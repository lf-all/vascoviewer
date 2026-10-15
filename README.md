<div align="center">

# 📷 Vasco Viewer

**Veja e baixe as fotos de qualquer perfil público do VSCO, num visual limpo e minimalista.**

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)
![License](https://img.shields.io/badge/license-MIT-green)

[✨ Funcionalidades](#-funcionalidades) • [🚀 Início rápido](#-início-rápido) • [☁️ Deploy](#️-deploy-na-vercel) • [🐛 Problemas comuns](#-solução-de-problemas)

</div>

---

## ✨ Funcionalidades

### 🔎 Busca de perfil
- Digite um **username**, `@username` ou cole a **URL** do perfil (`vsco.co/nome/gallery`)
- Exibe **foto de perfil, nome e bio** (quando disponível)
- Estados claros de **carregando** e **erro**, com mensagens em português

### 🖼️ Galeria
- Grid responsivo de **2 a 4 colunas**, com espaçamento mínimo
- Carrega mais fotos rolando a galeria automaticamente
- Fotos em **qualidade original** (sem parâmetros de resize)
- Hover sutil, sem sombras ou bordas pesadas

### 📥 Abrir e baixar
- Clique na foto → abre o **original em nova aba**
- Botão **Baixar** em cada foto, com download forçado pelo servidor

### ⚡ Leve e simples
- Sem banco de dados, sem login, sem biblioteca de UI
- **Cache** em memória (10 min) + cache de CDN da Vercel
- Roda 100% em **Serverless Functions** da Vercel

---

## 🧰 Stack

| Tecnologia | Versão | Para quê |
|---|---|---|
| Next.js (App Router) | ^15 | Frontend + rotas de API |
| React | ^19 | Interface |
| TypeScript | ^5.7 | Tipagem |
| Tailwind CSS | ^3.4 | Estilização |
| playwright-core | ^1.54 | Automação do navegador |
| @sparticuz/chromium | ^138 | Chromium compatível com serverless |

---

## 🚀 Início rápido

**Pré-requisitos:** [Node.js 20+](https://nodejs.org) e npm.

### 1️⃣ Instalar

```bash
npm install
```

### 2️⃣ Apontar para o seu Chrome

O Chromium do `@sparticuz/chromium` só roda em Linux/serverless. Em dev local, use o Chrome instalado na sua máquina:

<details>
<summary><b>🪟 Windows (PowerShell)</b></summary>

```powershell
$env:CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe"
```
</details>

<details>
<summary><b>🍎 macOS</b></summary>

```bash
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```
</details>

<details>
<summary><b>🐧 Linux</b></summary>

```bash
export CHROME_PATH=/usr/bin/google-chrome
```
</details>

### 3️⃣ Rodar

```bash
npm run dev
```

Abra **http://localhost:3000** 🎉

> 💡 Não defina `CHROME_PATH` na Vercel. Lá o Chromium serverless é usado automaticamente.

---

## ☁️ Deploy na Vercel

### Pelo GitHub (recomendado)

1. Suba o projeto para um repositório no GitHub
2. Na [Vercel](https://vercel.com): **Add New… → Project** e importe o repositório
3. Deixe os padrões (o Next.js é detectado sozinho, sem variáveis de ambiente)
4. Clique em **Deploy** ✅

### Pela CLI

```bash
npm i -g vercel
vercel login
vercel          # preview
vercel --prod   # produção
```

### ⚙️ Pontos importantes

| Item | Detalhe |
|---|---|
| ⏱️ Timeout | `/api/vsco` declara `maxDuration = 60`. O scraping leva ~5–20 s |
| 🧠 Memória | O Chromium usa bastante. Se a função cair, aumente em *Settings → Functions* |
| 🗄️ Cache | Memória (10 min, some em cold start) + `s-maxage=600` na CDN |
| 🖼️ Imagens | `unoptimized`, direto da CDN do VSCO (não gasta cota de otimização) |

---

## 📂 Estrutura do projeto

```
vasco-viewer/
├── app/
│   ├── page.tsx                  # Tela principal (input, loading, erro, perfil)
│   ├── layout.tsx                # Fonte e metadados
│   ├── globals.css               # Tailwind + estilos base
│   └── api/
│       ├── vsco/route.ts         # GET /api/vsco?username=xxx → JSON do perfil
│       └── download/route.ts     # GET /api/download?url=... → força download
├── components/
│   ├── ProfileHeader.tsx         # Foto, nome e bio
│   ├── PhotoGrid.tsx             # Grid responsivo
│   └── PhotoCard.tsx             # Foto + abrir original + baixar
├── lib/
│   └── scraper.ts                # Playwright, parsing e cache em memória
├── next.config.js                # Externaliza e inclui o Chromium na função
├── tailwind.config.ts            # Paleta e fonte
├── package.json
└── README.md
```

---

## 🔌 API

### `GET /api/vsco?username=xxx`

```jsonc
// 200 OK
{
  "username": "exemplo",
  "name": "Exemplo",
  "bio": "Texto da bio",
  "avatar": "https://im.vsco.co/...",
  "photos": [{ "id": "abc123", "url": "https://im.vsco.co/..." }]
}
```

| Status | `error` | Quando |
|---|---|---|
| 400 | `INVALID_USERNAME` | Username fora do padrão (letras, números, `.`, `_`, `-`) |
| 403 | `BLOCKED` | Cloudflare bloqueou o acesso automático |
| 404 | `NOT_FOUND` | Perfil inexistente, privado ou sem fotos públicas |
| 504 | `TIMEOUT` | O VSCO demorou demais |
| 500 | `UNKNOWN` | Erro inesperado |

### `GET /api/download?url=...&name=...`

Devolve a imagem com `Content-Disposition: attachment`. Aceita apenas hosts `*.vsco.co`.

---

## 🎨 Customização

### Cores

Edite `tailwind.config.ts`:

```ts
colors: {
  paper: "#fafaf8",  // fundo
  ink:   "#1c1c1a",  // texto
  mute:  "#8a8a85",  // texto secundário
  line:  "#e8e8e3",  // bordas e placeholders
}
```

### Comportamento do scraper

Em `lib/scraper.ts`:

```ts
const NAV_TIMEOUT = 25_000;       // tempo máximo para abrir a página
const MAX_SCROLLS = 6;            // quantas vezes rolar para carregar mais fotos
const CACHE_TTL = 10 * 60 * 1000; // duração do cache em memória
const CACHE_MAX = 50;             // máximo de perfis em cache
```

### Colunas do grid

Em `components/PhotoGrid.tsx`, ajuste `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4`.

---

## 🐛 Solução de problemas

### ❌ "O VSCO bloqueou o acesso automático"
O Cloudflare pode barrar IPs de datacenter, incluindo os da Vercel. Tente novamente mais tarde. Se persistir, será preciso usar um proxy ou um serviço de scraping.

### ❌ A busca funciona, mas vem sem fotos
O VSCO não tem API pública, então o scraper lê a estrutura interna da página. Se ela mudar, ajuste a função `collect()` em `lib/scraper.ts`.

### ❌ Erro ao iniciar o Chromium em dev local
Confirme que `CHROME_PATH` aponta para um Chrome/Chromium instalado e que a variável foi definida **no mesmo terminal** onde roda `npm run dev`.

### ❌ Função cai ou estoura o tempo na Vercel
Verifique em **Settings → Functions** se a duração máxima permite 60 s e se a memória é suficiente. Os erros aparecem em **Deployments → Logs** como `[vsco] scrape error`.

### ❌ Falha no launch do Chromium após o deploy
Ajuste as versões de `@sparticuz/chromium` e `playwright-core` no `package.json` para um par compatível e faça um novo deploy.

---

## ⚠️ Aviso

Projeto independente, **sem qualquer vínculo com o VSCO**. Respeite os termos de uso do serviço e os direitos autorais das fotos. Use para fins pessoais.

---

## 📝 Licença

MIT. Veja o arquivo [LICENSE](LICENSE).

---

<div align="center">

Feito com ❤️ por **lf-all**

⭐ Dê uma estrela se foi útil!

</div>
