import chromium from "@sparticuz/chromium";
import { chromium as playwright, type Browser, type Page } from "playwright-core";

/* ---------- Tipos ---------- */

export type Photo = { id: string; url: string; width?: number; height?: number };

export type VscoProfile = {
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  photos: Photo[];
};

export type ScrapeErrorCode = "INVALID_USERNAME" | "NOT_FOUND" | "BLOCKED" | "TIMEOUT" | "UNKNOWN";

export class ScrapeError extends Error {
  constructor(public code: ScrapeErrorCode, message: string, public status: number) {
    super(message);
  }
}

/* ---------- Configuração ---------- */

const NAV_TIMEOUT = 25_000; // ms para carregar a página
const MAX_SCROLLS = 6; // quantas vezes rolar a galeria para carregar mais fotos
const CACHE_TTL = 10 * 60 * 1000; // 10 min
const CACHE_MAX = 50;
const SKIP_RESOURCES = new Set(["image", "media", "font", "stylesheet"]);
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/* ---------- Cache em memória (vale por instância serverless "quente") ---------- */

const cache = new Map<string, { at: number; data: VscoProfile }>();
const inflight = new Map<string, Promise<VscoProfile>>();

export async function getProfile(raw: string): Promise<VscoProfile> {
  const username = raw.trim().toLowerCase();
  if (!/^[a-z0-9._-]{1,40}$/.test(username)) {
    throw new ScrapeError("INVALID_USERNAME", "Username inválido.", 400);
  }

  const hit = cache.get(username);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit.data;

  // Evita scraping duplicado se duas requisições do mesmo perfil chegarem juntas
  let job = inflight.get(username);
  if (!job) {
    job = scrape(username)
      .then((data) => {
        if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
        cache.set(username, { at: Date.now(), data });
        return data;
      })
      .finally(() => inflight.delete(username));
    inflight.set(username, job);
  }
  return job;
}

/* ---------- Scraping ---------- */

async function scrape(username: string): Promise<VscoProfile> {
  let browser: Browser | undefined;
  try {
    // Em dev local, aponte CHROME_PATH para um Chrome/Chromium instalado
    const local = process.env.CHROME_PATH;
    browser = await playwright.launch({
      executablePath: local || (await chromium.executablePath()),
      args: local ? [] : chromium.args,
      headless: true,
    });

    const context = await browser.newContext({
      userAgent: UA,
      locale: "en-US",
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(NAV_TIMEOUT);

    // Só precisamos do HTML/JS/JSON — bloqueia imagens, fontes e CSS para ser rápido
    await page.route("**/*", (route) =>
      SKIP_RESOURCES.has(route.request().resourceType()) ? route.abort() : route.continue()
    );

    // Guarda respostas JSON de API (paginação da galeria)
    const payloads: unknown[] = [];
    page.on("response", async (res) => {
      try {
        const type = res.headers()["content-type"] ?? "";
        if (res.url().includes("/api/") && type.includes("json")) payloads.push(await res.json());
      } catch {
        /* resposta sem corpo / já descartada */
      }
    });

    const res = await page.goto(`https://vsco.co/${username}/gallery`, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });
    const status = res?.status() ?? 0;
    const title = await page.title();

    if (status === 403 || status === 429 || status === 503 || /just a moment|attention required/i.test(title)) {
      throw new ScrapeError("BLOCKED", "O VSCO bloqueou o acesso automático (Cloudflare). Tente novamente mais tarde.", 403);
    }
    if (status === 404) {
      throw new ScrapeError("NOT_FOUND", "Perfil não encontrado.", 404);
    }

    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});

    let result = await collect(page, payloads, username);
    for (let i = 0; i < MAX_SCROLLS; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(900);
      const next = await collect(page, payloads, username);
      const grew = next.photos.length > result.photos.length;
      result = next;
      if (!grew) break;
    }

    if (result.photos.length === 0 && !result.hasSite) {
      throw new ScrapeError("NOT_FOUND", "Perfil não encontrado ou sem fotos públicas.", 404);
    }

    const { hasSite: _hasSite, ...profile } = result;
    return profile;
  } catch (err) {
    if (err instanceof ScrapeError) throw err;
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new ScrapeError("TIMEOUT", "O VSCO demorou demais para responder. Tente novamente.", 504);
    }
    console.error("[vsco] scrape error:", err);
    throw new ScrapeError("UNKNOWN", "Não foi possível carregar o perfil agora.", 500);
  } finally {
    await browser?.close().catch(() => {});
  }
}

/* ---------- Extração dos dados ---------- */

type Rec = Record<string, any>;

async function collect(page: Page, payloads: unknown[], username: string) {
  const state = await page.evaluate(() => (window as any).__PRELOADED_STATE__ ?? null).catch(() => null);
  const dom = await page.evaluate(() => ({
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null,
    imgs: Array.from(document.images).map((i) => i.currentSrc || i.src),
  }));

  const found = new Map<string, Photo>();
  const ctx: { site: Rec | null } = { site: null };

  for (const source of [state, ...payloads]) {
    walk(source, (o) => {
      const raw = o.responsive_url ?? o.responsiveUrl;
      if (typeof raw === "string" && !o.is_video && !o.isVideo) {
        const url = toUrl(raw);
        if (url && !found.has(url)) {
          found.set(url, {
            id: String(o._id ?? o.id ?? url.split("/").pop()),
            url,
            width: num(o.width),
            height: num(o.height),
          });
        }
      }
      if (!ctx.site && typeof o.subdomain === "string" && o.subdomain.toLowerCase() === username) {
        ctx.site = o;
      }
    });
  }

  const site = ctx.site;
  const avatarRaw =
    site &&
    [site.profile_image, site.profileImage, site.profile_image_url, site.profileImageUrl].find(
      (v) => typeof v === "string" && v.includes("/")
    );
  const avatar = (avatarRaw && toUrl(avatarRaw)) || (dom.ogImage && toUrl(dom.ogImage)) || null;

  // Fallback: se o estado não trouxe nada, pega as <img> da galeria direto do DOM
  if (found.size === 0) {
    for (const src of dom.imgs) {
      const url = src && toUrl(src);
      if (url && /\.(jpe?g|png|webp)$/i.test(url) && url !== avatar) {
        found.set(url, { id: url.split("/").pop()!, url });
      }
    }
  }

  const photos = [...found.values()].filter((p) => p.url !== avatar);
  const bio = typeof site?.description === "string" && site.description.trim() ? site.description.trim() : null;

  return {
    username,
    name: (site?.name as string) || (site?.displayName as string) || username,
    bio,
    avatar,
    photos,
    hasSite: !!site,
  };
}

function walk(node: unknown, cb: (o: Rec) => void, seen = new Set<object>()) {
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) return node.forEach((n) => walk(n, cb, seen));
  cb(node as Rec);
  Object.values(node).forEach((v) => walk(v, cb, seen));
}

/** Normaliza para https, remove query (resize) e aceita só hosts do VSCO → URL original. */
function toUrl(raw: string): string | null {
  let u = raw.trim();
  if (u.startsWith("//")) u = "https:" + u;
  else if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const url = new URL(u);
    if (!(url.hostname === "vsco.co" || url.hostname.endsWith(".vsco.co"))) return null;
    url.search = "";
    return url.toString();
  } catch {
    return null;
  }
}

const num = (v: unknown) => (typeof v === "number" ? v : undefined);
