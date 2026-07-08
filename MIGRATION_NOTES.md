# Migração para Vercel independente

Este pacote foi recriado a partir do ZIP original do Base44 e agora contém as pastas completas `src` e `public`.

## Alterações principais

- Removidas as dependências `@base44/sdk` e `@base44/vite-plugin`.
- Removida a pasta `base44`.
- Criado cliente local em `src/api/base44Client.js` usando `localStorage`.
- Ajustado `src/lib/AuthContext.jsx` para não depender de endpoints do Base44.
- Adicionado `vercel.json` para Vercel com rotas SPA e instalação via `pnpm`.
- Substituídas imagens externas do Base44 por SVGs locais em `public/assets`.
- Reduzidas dependências do `package.json` para facilitar o deploy.

## Login inicial

E-mail: `admin@avaliatechro.local`
Senha: `admin123`

## Observação

Esta versão salva dados no navegador via `localStorage`. Para uso multiusuário real, conecte um backend como Supabase ou Firebase.
