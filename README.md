# 🚀 Semana Intensiva One For All (26 a 30/09)

Landing Page de alta conversão para o workshop de 5 dias de Inglês & Espanhol com cultura pop (Stranger Things, La Casa de Papel, Camp Rock, Soy Luna e O Diabo Veste Prada).

- **Domínio Oficial:** `https://intensivo.oneforallschool.com`
- **Painel de Leads & Abandonos:** `https://intensivo.oneforallschool.com/admin.html`

---

## 🛠️ Funcionalidades & Arquitetura

1. **Funil Multi-Etapas com Rastreamento em Tempo Real:**
   - **Etapa 1:** Escolha do Plano (Passaporte 5 Dias R$ 49,90 ou Avulso R$ 24,90/dia).
   - **Etapa 2:** Diagnóstico & Perfil (Idioma de foco, nível atual, histórico e objetivo).
   - **Etapa 3:** Dados de Contato (Nome, WhatsApp, E-mail, Origem).
   - **Etapa 4:** Pagamento PIX Instantâneo com QR Code dinâmico e Copia e Cola gerados automaticamente com o valor exato.
   - **Etapa 5:** Envio do comprovante e dados completos diretamente no WhatsApp da escola.

2. **Banco de Dados & API de Abandonos:**
   - `POST /api/track`: Registra e atualiza os passos do visitante em tempo real.
   - `GET /api/leads`: Retorna todos os leads cadastrados para o Painel Admin.
   - Persistência em JSON (`leads_db.json`) + suporte a Cloudflare Pages Functions & KV.
   - Backup local automático no navegador (`localStorage`) para resiliência instantânea.

3. **Painel de Recuperação (Admin Dashboard):**
   - Acompanhamento de onde cada visitante parou (Etapa 1, Etapa 2, Etapa 3, PIX Copiado, WhatsApp Enviado).
   - Botão **"Chamar no WhatsApp"** em 1 clique com mensagem de recuperação personalizada para cada lead.
   - Filtros dinâmicos e exportação instantânea para **CSV**.

---

## 📦 Como rodar localmente
```bash
npm run dev
```
- Landing Page: `http://localhost:3000`
- Painel Admin: `http://localhost:3000/admin.html`

## 🚀 Build de Produção (Cloudflare Pages)
```bash
npm run build
```
- Os arquivos otimizados são gerados na pasta `dist/`.

