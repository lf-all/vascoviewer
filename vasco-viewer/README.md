# Vasco Viewer

Visualizador minimalista de perfis públicos do VSCO: digite um username, veja foto de perfil, nome, bio e a galeria em grid. Clique na foto para abrir o original em nova aba ou use **Baixar** para salvar o arquivo.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 3 · `playwright-core` + `@sparticuz/chromium` · deploy na Vercel. Sem banco, sem autenticação, sem biblioteca de UI.

## Estrutura

```
app/
  page.tsx                # UI: input + estados (loading / erro / perfil)
  layout.tsx              # fonte e metadados
  api/vsco/route.ts       # GET /api/vsco?username=xxx  → JSON do perfil
  api/download/route.ts   # GET /api/download?url=...   → força download (proxy restrito a *.vsco.co)
lib/scraper.ts            # Playwright + Chromium, parsing e cache em memória
components/               # ProfileHeader, PhotoGrid, PhotoCard
next.config.js            # externaliza o Chromium e inclui o binário na função
```

## Rodar localmente

Requer Node 20+.

```bash
npm install
```

Em dev local o Chromium do `@sparticuz/chromium` (feito para Linux/serverless) não roda em Windows/macOS. Aponte para o Chrome instalado na sua máquina:

```bash
# Windows (PowerShell)
$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run dev

# macOS
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run dev

# Linux
CHROME_PATH=/usr/bin/google-chrome npm run dev
```

Abra http://localhost:3000. Não defina `CHROME_PATH` na Vercel.

## Deploy na Vercel

1. Suba o projeto para um repositório no GitHub.
2. Em vercel.com → **Add New… → Project**, importe o repositório. O framework (Next.js) é detectado sozinho; não precisa de variáveis de ambiente.
3. Clique em **Deploy**.

Ou pela CLI:

```bash
npm i -g vercel
vercel --prod
```

### Pontos importantes

- **Timeout:** a rota `/api/vsco` declara `maxDuration = 60`. O scraping leva ~5–20 s. Planos/configurações da Vercel com limite menor que isso vão cortar a função.
- **Memória:** o Chromium precisa de bastante memória. Se vir erros de crash/OOM, aumente a memória da função em *Project Settings → Functions*.
- **Cache:** há dois níveis — mapa em memória (10 min, por instância quente) e header `Cache-Control: s-maxage=600` para a CDN da Vercel. Sem banco, o cache em memória some em cold starts.
- **Imagens:** ficam com `unoptimized` e são carregadas direto da CDN do VSCO, sem consumir cota de otimização de imagens da Vercel. O download passa por `/api/download`, que só aceita hosts `*.vsco.co`.

## Limitações

- O VSCO não tem API pública. O scraper lê o estado embutido na página (`__PRELOADED_STATE__`), as respostas JSON de API que a página dispara ao rolar e, como último recurso, as `<img>` do DOM. **Se o VSCO mudar a estrutura, ajuste `collect()` em `lib/scraper.ts`.**
- O VSCO pode bloquear IPs de datacenter (Cloudflare). Nesse caso a API devolve `403` com a mensagem "O VSCO bloqueou o acesso automático".
- Perfis privados ou inexistentes retornam "Perfil não encontrado".
- Respeite os termos de uso do VSCO e os direitos autorais das fotos; use para fins pessoais.

## Respostas da API

```jsonc
// 200
{ "username": "x", "name": "X", "bio": "…", "avatar": "https://…", "photos": [{ "id": "…", "url": "https://…" }] }
// erro
{ "error": "NOT_FOUND | BLOCKED | TIMEOUT | INVALID_USERNAME | UNKNOWN", "message": "…" }
```
