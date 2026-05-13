# Falaí

Falaí é um tradutor simultâneo por voz para conversas presenciais entre duas pessoas que falam idiomas diferentes. A experiência gira em torno de um único disco: gire para escolher o idioma, segure para falar, e o outro idioma sai traduzido.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- WebRTC no navegador
- Build final estático: HTML, CSS e JavaScript

Não há backend, API routes, serverless functions, banco de dados, autenticação ou analytics.

## Instalação

```bash
npm install
```

## Rodar localmente

```bash
npm run dev
```

## Gerar build estático

```bash
npm run build
```

O resultado sai em `dist/` e pode ser publicado em hospedagens estáticas como Netlify, Vercel static, Cloudflare Pages, GitHub Pages ou qualquer CDN/servidor de arquivos.

## PWA

O projeto inclui `manifest.webmanifest`, ícone e service worker estático em `public/sw.js`. Depois do build, publique a pasta `dist/` em HTTPS para permitir instalação como PWA e uso de microfone no navegador.

## BYOK: Bring Your Own Key

O usuário informa a própria Chave da OpenAI no navegador. O custo de uso da OpenAI fica na conta OpenAI dessa chave.

A chave:

- fica somente em memória;
- não é salva em `localStorage`;
- não é salva em `sessionStorage`;
- não é salva em cookies;
- não passa por servidores do Falaí;
- é apagada ao recarregar ou fechar a página.

O navegador conecta direto com a OpenAI. Nenhuma requisição passa por servidores próprios do criador do app.

## Modelo

O MVP usa somente `gpt-realtime-translate`, modelo da OpenAI para tradução speech-to-speech em tempo real. Não há campo de modelo customizado porque o produto é um intérprete de voz em tempo real, não um playground técnico.

Novos modelos só devem ser adicionados manualmente à lista fixa em `src/lib/realtimeModels.ts` quando a documentação oficial da OpenAI listar modelos próprios para realtime translation.

## Conversation Dial

O controle central mostra o idioma ativo. Ao segurar, o app escuta esse idioma. Ao arrastar horizontalmente, o disco gira e troca o idioma ativo. A direção atual aparece como `Português → English`.

Não existem botões separados para duas pessoas. A interface não usa “Pessoa A/B”, “source”, “target”, “input”, “output” ou termos de infraestrutura na tela principal.

## Idiomas

O chip compacto do topo abre o seletor “Idiomas da conversa”. Ele permite escolher dois idiomas diferentes e inverter os lados do disco. A lista inicial fica em `src/lib/languages.ts`.

## Integração Realtime

A integração client-only está em `src/lib/openaiClientOnlyRealtime.ts`.

Ela usa:

- `navigator.mediaDevices.getUserMedia({ audio: true })`;
- `RTCPeerConnection`;
- data channel `oai-events` para deltas de legenda quando disponíveis;
- endpoint dedicado de tradução realtime da OpenAI;
- áudio traduzido reproduzido em um elemento `<audio autoplay />`.

Como esta versão evita backend, ela tenta criar o client secret diretamente do navegador usando a chave fornecida pelo próprio usuário e depois abre a chamada WebRTC de tradução. A documentação oficial recomenda gerar client secrets efêmeros em servidor para produção; este MVP escolhe arquitetura browser-only para manter infraestrutura zero e não custodiar chaves de usuários.

Se o navegador ou a API bloquear a conexão direta, o app mostra uma mensagem amigável e não tenta criar servidor próprio como fallback.

## Limitações do MVP

- A compatibilidade real depende de suporte do navegador, microfone, HTTPS e políticas atuais da OpenAI para chamadas diretas.
- iOS Safari e Android Chrome devem ser testados em dispositivos reais.
- A voz é o foco; legendas são secundárias e dependem dos eventos disponíveis da sessão.
- Sem backend, não há como esconder uma chave padrão do app. Use uma chave específica para o Falaí, com limites e permissões adequadas.

## Cuidados de produção

A arquitetura mais segura para produção envolve um backend mínimo para gerar client secrets efêmeros e evitar expor uma API key padrão no browser. Esta versão conscientemente não faz isso para manter o app publicável como site estático/PWA, sem custo de infraestrutura e sem servidores próprios do criador.
