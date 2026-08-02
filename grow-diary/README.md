# 🌿 Diário de Cultivo — Auto Pineapple Express

Web app **mobile-first**, instalável como **PWA**, que funciona como um diário diário
de cultivo. É a versão "viva" do guia em PDF: ancora tudo numa **data de plantio**,
calcula sozinho o dia/semana/fase atual, mostra a orientação certa pra aquele momento
e deixa você registrar dados + fotos todo dia — da germinação à colheita, secagem e cura.

**Sincroniza entre dispositivos:** o que você registra no celular aparece sozinho no PC
(e vice-versa), porque os dados ficam no **Firebase** (nuvem), não só no navegador.

> ⚖️ **Material educacional.** Pressupõe cultivo pessoal em contexto legalmente
> autorizado. Não constitui orientação jurídica, médica ou agronômica.

---

## O que tem dentro

| Arquivo | Papel |
|---|---|
| `index.html` | Casca do app (carrega fontes, Chart.js e o JS) |
| `style.css` | Tema dark editorial |
| `js/firebase-init.js` | **← cole aqui as chaves do Firebase** + inicialização (auth + Firestore offline) |
| `js/store.js` | Toda a conversa com a nuvem (login, config, registros, fotos, export/import) |
| `js/data.js` | Conteúdo fixo do guia (cronograma, tabelas, textos) — edite aqui pra ajustar |
| `js/phase.js` | Cálculo de dia/semana/fase a partir da data de plantio (+ ajuste de dias) |
| `js/reminders.js` | Motor de lembretes (datas-gatilho + alertas dos seus dados) |
| `js/app.js` | Telas, navegação, formulários, gráficos |
| `manifest.json` + `sw.js` | PWA (instalar no celular + app shell offline) |
| `firestore.rules` | Regras de segurança prontas pra colar |
| `storage.rules` | Opcional — só se um dia você voltar a usar o Firebase Storage (não é necessário) |
| `firebase.json` | Config de deploy (Firebase Hosting + regras do Firestore) |

> **Sobre as fotos:** o Firebase **Storage** passou a exigir plano pago (Blaze).
> Por isso este app **não usa Storage** — as fotos são comprimidas no navegador e
> guardadas dentro do próprio **Firestore** (plano Spark, grátis). Você **não
> precisa ativar o Storage**.

---

## Passo 1 — Criar o projeto Firebase (grátis, plano Spark)

1. Acesse <https://console.firebase.google.com> e clique em **Adicionar projeto**.
2. Dê um nome (ex.: `diario-cultivo`), pode desativar o Google Analytics. Criar.
3. Dentro do projeto, ative os três serviços:

   **a) Authentication**
   - Menu **Build → Authentication → Get started**.
   - Aba **Sign-in method → Email/senha → Ativar → Salvar**.

   **b) Cloud Firestore**
   - Menu **Build → Firestore Database → Criar banco de dados**.
   - Escolha um local (ex.: `southamerica-east1`). Comece em **modo de produção**
     (as regras seguras estão no Passo 3).
   - É aqui que ficam os dados **e as fotos** (comprimidas).

   > **Storage não é necessário.** Como o Firebase Storage virou plano pago, o app
   > guarda as fotos no Firestore. Pode pular a ativação do Storage.

---

## Passo 2 — Pegar as chaves e colar no código

1. No Console, clique na **engrenagem ⚙ → Configurações do projeto**.
2. Role até **Seus apps** e clique no ícone **`</>` (Web)** para registrar um app web.
   Dê um apelido (ex.: `diario-web`), **não** precisa marcar Firebase Hosting agora.
3. O Console mostra um objeto `firebaseConfig` assim:

   ```js
   const firebaseConfig = {
     apiKey: "AIza…",
     authDomain: "diario-cultivo.firebaseapp.com",
     projectId: "diario-cultivo",
     storageBucket: "diario-cultivo.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123"
   };
   ```

4. Abra **`js/firebase-init.js`** e **substitua** o bloco `firebaseConfig` (os `COLE_AQUI`)
   por esse objeto. Salve.

   > Essas chaves são **públicas por natureza** (ficam no frontend). Quem protege
   > seus dados são as **regras de segurança** do Passo 3, não as chaves.

---

## Passo 3 — Publicar as regras de segurança

Cada usuário só acessa os próprios dados. Cole as regras prontas:

**Firestore** — Console → **Firestore Database → aba Regras** → cole o conteúdo de
[`firestore.rules`](./firestore.rules) → **Publicar**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

> **Storage:** não precisa publicar nada. O app não usa Firebase Storage (as fotos
> ficam no Firestore, já cobertas pelas regras acima). O arquivo
> [`storage.rules`](./storage.rules) fica no projeto só como referência, caso um dia
> você opte por migrar as fotos de volta pro Storage (aí sim no plano Blaze).

---

## Passo 4 — Rodar / hospedar

O app é **HTML estático + Firebase**. Não tem build. Só precisa ser servido por HTTP
(abrir o arquivo com `file://` **não** funciona por causa dos módulos ES + Service Worker).

### Teste local rápido
```bash
cd grow-diary
python3 -m http.server 8080
# abra http://localhost:8080
```

### Opção A — Firebase Hosting (mais direto; já deploya as regras junto)
```bash
npm install -g firebase-tools
firebase login
cd grow-diary
firebase use --add          # escolha o projeto que você criou
firebase deploy             # usa o firebase.json daqui (hosting + regras do firestore)
```
O `firebase.json` já aponta o `public` para esta pasta. Ao final ele mostra a URL
pública (ex.: `https://diario-cultivo.web.app`).

### Opção B — Netlify / Vercel / GitHub Pages
Qualquer host de site estático serve. Aponte o diretório de publicação para a pasta
`grow-diary/` (ou publique só o conteúdo dela na raiz).
- **Netlify:** arraste a pasta `grow-diary` em <https://app.netlify.com/drop>.
- **Vercel:** `vercel` na pasta, framework "Other".
- **GitHub Pages:** ative Pages apontando para a pasta; a URL vira
  `https://usuario.github.io/repo/grow-diary/`.

> ⚠️ Depois de hospedar, adicione o domínio em
> **Authentication → Settings → Domínios autorizados** (o `web.app`/`firebaseapp.com`
> já vem autorizado; para Netlify/Vercel/Pages, inclua o domínio deles).

---

## Passo 5 — Primeiro uso

1. Abra a URL, **crie a conta** (e-mail + senha) na tela de login.
2. No **onboarding**, informe a **data de plantio** (âncora de todo o cronograma),
   o nome do cultivo, a meta em gramas e — se precisar — o **ajuste de dias**.
3. Pronto — o dashboard já mostra dia/semana/fase e o que fazer hoje.
4. Faça login com **a mesma conta** em outro dispositivo: os dados aparecem sozinhos.

### 🌸 Início da floração — a âncora real de uma autoflorescente
Autoflorescente **floresce quando quer**, não quando o calendário do guia manda. Se a
sua entrou em flor fora do previsto (cedo ou tarde), informe a data dos **primeiros
pistilos** em **Menu ⋯ → Editar cultivo → Início da floração**.

A partir daí o app para de guiar pelas semanas fixas e passa a usar a floração real:

- **Fase, "Fazer hoje", "Observe" e luz** vêm da *semana de floração* (`FLOWER_SCHEDULE`).
- **Janela de colheita** estimada = floração + 7 a 10 semanas (o tricoma decide).
- **Lembretes de treino (LST/top-dress por calendário) somem** — não se treina em flor.
- A aba **Guia** passa a mostrar o cronograma de floração no topo, e o guia original
  logo abaixo, como referência.
- O botão **"usar"** sugere a data varrendo as suas próprias notas (procura "pistilo",
  "pré floração", "floração") — é só conferir e salvar.

### 📏 Rega pelo porte (não só pela fase)
O guia assume uma planta perto de 100 cm. Se a sua ficou menor, o volume do guia
**encharca** — num vaso de 12 L, planta pequena bebe pouco e o substrato demora a secar.
O card **Rega** e o placeholder do formulário passam a usar a **última altura registrada**:

| Altura | Volume | Onde molhar |
|---|---|---|
| até 15 cm | ~200–350 ml | círculo próximo ao caule |
| 16–30 cm | ~350–500 ml | círculo médio |
| 31–50 cm | ~500–700 ml | mais área do vaso |
| acima de 50 cm | ~700 ml–1 L | até pingar 10–20% pelo fundo |

Há ainda um alerta se o volume registrado passar do dobro do recomendado pro porte.

### 🌱 Planta anã / floração precoce
Se a floração começou e a planta está com menos de 20 cm, o app mostra um card com o
manejo que realmente se aplica (não treinar, não desfolhar, rega curta, luz no ponto) e
uma estimativa realista de rendimento no módulo de colheita — pra a meta virar uma régua
útil em vez de um número inalcançável.

### Ajuste de dias (ex.: germinação antes da semana 1)
Se o cronograma do guia (Semana 1 = germinação) não bate com a sua realidade — por
exemplo, a semente passou alguns dias germinando antes de virar "dia 1" — dá pra
corrigir sem mexer em nada do que você já registrou:

- Menu ⋯ → **Editar cultivo** → campo **Ajuste de dias**.
- Número **positivo adianta** a contagem, **negativo atrasa**. Uma prévia mostra na
  hora em que Dia/Semana/Fase o "hoje" vai cair — é só deixar batendo com a realidade.
- Isso muda **apenas o rótulo** de dia/semana/fase. Seus registros são guardados por
  **data**, então **nenhum dado preenchido é alterado**.

---

## Instalar como app (PWA) no celular

Abra a URL hospedada (precisa ser **https**, que o Firebase Hosting/Netlify/Vercel dão de graça):

- **Android (Chrome):** menu ⋮ → **Instalar app** / **Adicionar à tela inicial**.
- **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.

Depois de instalado ele abre em tela cheia, com ícone próprio, e o app shell fica em
cache — abre rápido mesmo com internet ruim, e os dados já sincronizados continuam
visíveis offline.

---

## Offline

- A **persistência offline do Firestore** já vem ligada (`persistentLocalCache`): você
  pode **ver os dados sincronizados e registrar novos dias sem internet** — quando a
  conexão voltar, tudo sobe sozinho.
- O indicador no topo mostra **Sincronizado / Sincronizando / Offline**.

---

## Backup / Restore (JSON)

Além da nuvem, dá pra guardar uma cópia:

- **Exportar:** menu ⋯ → **Exportar backup (JSON)**. Baixa um arquivo com a config e
  todos os registros.
  > As **fotos não vão embutidas** no JSON (só a contagem por dia) pra manter o arquivo
  > leve — as imagens já ficam guardadas no Firestore, na nuvem.
- **Importar:** menu ⋯ → **Importar backup (JSON)** e escolha o arquivo. Os registros
  são regravados no Firestore (e sincronizam pros outros dispositivos).

---

## Ajustar o conteúdo depois

- **Textos / cronograma / tabelas:** `js/data.js`.
- **Datas-gatilho dos lembretes:** `js/reminders.js` (constante `DATE_REMINDERS`).
- **Regra de contagem de dia/fase:** `js/phase.js` (função `dayNumber`, com o `offset`).
- **Integração com Firebase:** `js/store.js` (login, Firestore, fotos) e
  `js/firebase-init.js` (config + offline).

Todos esses pontos estão comentados no código.

---

## Limites do plano grátis (Spark)

Pra 1 planta e uso pessoal, o plano **Spark** sobra — e **sem precisar de plano pago**,
já que não usamos o Storage. As fotos são **comprimidas no navegador** (máx. 1080px,
JPEG ~0.6) e guardadas no **Firestore**, junto do registro do dia.

O Firestore no plano Spark oferece **1 GiB de armazenamento** + limites diários
generosos de leitura/escrita — de sobra pra um cultivo pessoal. Como cada documento do
Firestore tem teto de **1 MiB**, o app comprime bem as fotos e **avisa** caso as imagens
de um mesmo dia fiquem grandes demais (é só remover uma e salvar de novo).
