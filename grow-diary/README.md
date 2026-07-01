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
| `js/firebase-init.js` | **← cole aqui as chaves do Firebase** + inicialização (auth, Firestore offline, Storage) |
| `js/store.js` | Toda a conversa com a nuvem (login, config, registros, fotos, export/import) |
| `js/data.js` | Conteúdo fixo do guia (cronograma, tabelas, textos) — edite aqui pra ajustar |
| `js/phase.js` | Cálculo de dia/semana/fase a partir da data de plantio |
| `js/reminders.js` | Motor de lembretes (datas-gatilho + alertas dos seus dados) |
| `js/app.js` | Telas, navegação, formulários, gráficos |
| `manifest.json` + `sw.js` | PWA (instalar no celular + app shell offline) |
| `firestore.rules` / `storage.rules` | Regras de segurança prontas pra colar |
| `firebase.json` | Config de deploy (Firebase Hosting + regras) |

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

   **c) Storage**
   - Menu **Build → Storage → Get started**. Aceite o local sugerido.
   - (No plano Spark o Storage funciona normalmente para uso pessoal.)

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

**Storage** — Console → **Storage → aba Regras** → cole o conteúdo de
[`storage.rules`](./storage.rules) → **Publicar**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null
                   && request.auth.uid == uid
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

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
firebase deploy             # usa o firebase.json daqui (hosting + firestore + storage)
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
   o nome do cultivo e a meta em gramas.
3. Pronto — o dashboard já mostra dia/semana/fase e o que fazer hoje.
4. Faça login com **a mesma conta** em outro dispositivo: os dados aparecem sozinhos.

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
  > As **fotos não vão embutidas** no JSON (só as URLs) pra manter o arquivo leve — as
  > imagens seguem guardadas no Firebase Storage.
- **Importar:** menu ⋯ → **Importar backup (JSON)** e escolha o arquivo. Os registros
  são regravados no Firestore (e sincronizam pros outros dispositivos).

---

## Ajustar o conteúdo depois

- **Textos / cronograma / tabelas:** `js/data.js`.
- **Datas-gatilho dos lembretes:** `js/reminders.js` (constante `DATE_REMINDERS`).
- **Regra de contagem de dia/fase:** `js/phase.js` (função `dayNumber`).
- **Integração com Firebase:** `js/store.js` (login, Firestore, Storage) e
  `js/firebase-init.js` (config + offline).

Todos esses pontos estão comentados no código.

---

## Limites do plano grátis (Spark)

Pra 1 planta e uso pessoal, o plano **Spark** sobra. As fotos são **comprimidas no
navegador** (máx. 1280px, JPEG ~0.7) antes de subir, o que economiza bastante espaço e
banda. Se um dia quiser mais folga de Storage, o **Blaze** (pré-pago) mantém uma cota
grátis parecida e só cobra o excedente.
