JotaEditor - Editor de Fotos
============================

Arquivos:
  index.html     estrutura da página
  style.css      visual (Frutiger Aero)
  script.js      toda a lógica do editor
  manifest.json  permite instalar o site como app
  sw.js          permite usar offline (service worker)
  icon.svg       ícone do site e do app

Como usar:
  - Para testar rápido, abra o index.html no navegador (instalação e offline não funcionam assim).
  - Para instalar como app e usar offline, sirva a pasta por https ou localhost, por exemplo:
      python -m http.server 8000
    e abra http://localhost:8000
  - Para publicar, envie a pasta inteira para qualquer hospedagem estática (GitHub Pages, Netlify, Cloudflare Pages).
