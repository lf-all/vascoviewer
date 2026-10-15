import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Proxy para forçar o download. O atributo `download` do HTML é ignorado em
 * links de outro domínio, então a imagem passa por aqui com Content-Disposition.
 * Só aceita hosts do VSCO (evita virar proxy aberto).
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const target = p.get("url") ?? "";
  const base = (p.get("name") ?? "vsco").replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 60) || "vsco";

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new Response("URL inválida", { status: 400 });
  }
  if (url.protocol !== "https:" || !(url.hostname === "vsco.co" || url.hostname.endsWith(".vsco.co"))) {
    return new Response("Host não permitido", { status: 400 });
  }

  const upstream = await fetch(url, { headers: { Referer: "https://vsco.co/" }, redirect: "error" }).catch(() => null);
  if (!upstream?.ok || !upstream.body) return new Response("Imagem indisponível", { status: 502 });

  const ext = url.pathname.match(/\.(jpe?g|png|webp|gif)$/i)?.[1]?.toLowerCase() ?? "jpg";
  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      "Content-Disposition": `attachment; filename="${base}.${ext}"`,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
