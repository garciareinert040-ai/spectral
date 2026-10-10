# 🌿 Diário de Cultivo

Web app **mobile-first**, instalável como **PWA**, pra acompanhar cultivos de
**qualquer strain** dia a dia. Cada pessoa cria a própria conta, monta quantos
cultivos quiser **dentro do app** (strain, autoflorescente ou fotoperíodo, tempo de
ciclo, vaso, luz, treino, adubação) e o app **gera o cronograma** a partir disso:
o que fazer e observar em cada fase, altura da luz, rega pelo porte, lembretes e
janela de colheita. Registros + fotos todo dia — da germinação à secagem e cura.

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
| `js/data.js` | Conteúdo genérico: padrões de um cultivo novo, atalhos de tempo de ciclo, tabelas, textos |
| `js/plan.js` | **Gerador do cronograma** a partir da configuração de cada cultivo |
| `js/phase.js` | Dia/fase/janela de colheita do cultivo numa data |
| `js/reminders.js` | Lembretes derivados do plano + alertas dos seus registros |
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

1. Abra a URL e toque em **Criar conta** (e-mail + senha, com confirmação).
   Esqueceu a senha? **Esqueci a senha** na tela de login manda um link por e-mail.
2. No primeiro acesso aparece **Monte seu cultivo**:
   - **Genética:** strain, banco (opcional), apelido (opcional), **Autoflorescente** ou **Fotoperíodo**.
   - **Tempo de cultivo:** auto → dias da semente à colheita; foto → semanas de vegetativo.
     Nos dois, as semanas de floração. Use o que o banco informa — ou toque num **atalho**
     (Auto rápida/padrão/longa, Foto indica/híbrida/sativa).
   - **Datas:** plantio (âncora) e, quando acontecer, o início da floração.
   - **Estrutura e manejo:** vaso, luz e **distância mínima da luz**, treino, adubação, meta.
   - Uma **prévia ao vivo** mostra floração prevista, janela de colheita e a fase de hoje.
3. Pronto — o dashboard já mostra o dia, a fase e o que fazer hoje.
4. Entre com **a mesma conta** em outro dispositivo: os dados aparecem sozinhos.

> **Qualquer pessoa com o link pode criar conta.** Cada conta só enxerga os próprios
> cultivos (garantido pelas regras do Passo 3). Se quiser fechar o app só pra você, em
> **Authentication → Settings → User actions** desmarque "Enable create (sign-up)".

### Vários cultivos
**Menu ⋯ → Meus cultivos** (ou toque no nome do cultivo no topo) lista todos: toque pra
trocar, **+ Novo cultivo** pra começar outro do zero. Os anteriores ficam guardados com
os registros e fotos. Excluir pede pra digitar EXCLUIR e apaga registros junto.

### Como o cronograma é gerado
- **Germinação** (dias 1–7) → **Muda** (8–14) → **Vegetativo** em semanas → **Floração**
  pelo número de semanas configurado → **Janela de colheita**.
- **Floração prevista:** auto = ciclo total − semanas de flor; foto = fim do vegetativo
  (dia de virar 12/12).
- Textos se adaptam ao **treino** (LST, topping, SCROG ou nenhum), à **adubação** (só água
  ou nutrientes — com flush no fim) e ao **tipo** (aviso de virar 12/12 no foto).
- Alturas de luz partem da **distância mínima** da sua luz (plântula +15 cm, veg +5–10,
  flor no mínimo).

### 🌸 Marque a floração real
Autoflorescente floresce quando quer. Quando vir os **primeiros pistilos** (auto) ou
**virar a luz pra 12/12** (foto), marque a data em **Configurar cultivo** — o dashboard
avisa na hora certa. A partir daí a fase e a janela de colheita contam dessa data, e os
lembretes de treino somem. O botão **"usar"** sugere a data lendo as suas notas.

### 📏 Rega pelo porte
O card **Rega** usa a **última altura registrada**: vaso grande com planta pequena bebe
pouco e demora a secar. Há alerta se o volume passar do dobro do recomendado pro porte.

| Altura | Volume | Onde molhar |
|---|---|---|
| até 15 cm | ~200–350 ml | círculo próximo ao caule |
| 16–30 cm | ~350–500 ml | círculo médio |
| 31–50 cm | ~500–700 ml | mais área do vaso |
| acima de 50 cm | ~700 ml–1 L+ | até pingar 10–20% pelo fundo |

### Ajuste de dias
Se a contagem não bate com a sua, use **Ajuste de dias** em Configurar cultivo
(positivo adianta, negativo atrasa). Muda só o rótulo — registros são guardados por data.

### Dados de antes da versão multi-cultivo
Contas criadas na versão anterior (um cultivo só) continuam funcionando: a configuração
antiga vira o cultivo **"principal"** automaticamente e os registros ficam onde estão.
Nada precisa ser feito no console.

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

- **Textos do cronograma gerado:** `js/plan.js` (`vegPhases`, `flowerWeekGuide`).
- **Atalhos de tempo de ciclo / padrões de um cultivo novo:** `js/data.js` (`PRESETS`, `GROW_DEFAULTS`).
- **Lembretes:** `js/reminders.js`.
- **Contagem de dia/fase e janela de colheita:** `js/phase.js` (`computeStatus`).
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
