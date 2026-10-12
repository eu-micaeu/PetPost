<div align="center">
  <img src="./logoPetPost.svg" width="72" alt="Logo do PetPost" />

  # PetPost

  **Uma rede social para compartilhar os momentos mais fofos dos seus pets.**

</div>

---

## Sobre

O PetPost é um app mobile (Android, iOS e web) onde tutores cadastram seus pets, publicam fotos e acompanham o feed dos amigos. Ele foi feito com **Expo + Expo Router** e usa o **Supabase** para autenticação, banco de dados, armazenamento de imagens e eventos em tempo real.

## Funcionalidades

- **Autenticação**: cadastro e login com e-mail e senha ou com **Google** (OAuth com PKCE). A sessão fica salva no aparelho.
- **Feed**: mostra as publicações suas e dos seus amigos, das mais novas para as mais antigas, com paginação infinita e *pull to refresh*.
- **Curtidas**: curtidas no estilo Instagram, com contador.
- **Publicação**: envie uma foto da galeria ou da câmera como um "novo momento".
- **Pets**: cadastre, edite e remova pets com nome, espécie, raça, sexo, data de nascimento e foto. A idade é calculada automaticamente.
- **Amizades**: envie, aceite e recuse pedidos de amizade e veja o perfil público de outras pessoas.
- **Notificações em tempo real**: curtidas, pedidos de amizade e amizades aceitas chegam na hora (Supabase Realtime), com contador de não lidas.
- **Perfil e configurações**: foto de perfil, nome, nickname único e logout.
- **Interface**: tema escuro, barra de navegação flutuante com efeito de vidro, *skeleton loaders*, toasts e feedback háptico.

## Stack

| Camada | Tecnologia |
| --- | --- |
| App | [Expo SDK 57](https://docs.expo.dev/), React Native 0.86, React 19, TypeScript |
| Navegação | [Expo Router](https://docs.expo.dev/router/introduction/) (rotas por arquivo) |
| Backend | [Supabase](https://supabase.com/): Auth, Postgres, Storage e Realtime |
| UI | `react-native-svg`, `expo-blur`, `expo-haptics`, `@react-native-community/datetimepicker` |
| Mídia | `expo-image-picker` |
| Build e deploy | [EAS Build / Submit / Update](https://docs.expo.dev/eas/) |

## Estrutura do projeto

```
src/
├── app/                  # Rotas do Expo Router (cada arquivo é uma tela)
│   ├── _layout.tsx       # Layout raiz: providers e redirecionamento por sessão
│   ├── (auth)/           # Login / cadastro
│   ├── (tabs)/           # Home, Amigos, Notificações e Perfil
│   ├── publish.tsx       # Nova publicação
│   ├── settings.tsx      # Configurações da conta
│   └── user/[id].tsx     # Perfil público de outro usuário
├── screens/              # Implementação de cada tela
├── components/           # Componentes reutilizáveis (TabBar, Avatar, Icons, …)
├── contexts/             # AuthContext, NotificationsContext, ToastContext
├── lib/                  # Cliente Supabase e acesso a dados (feed, amizades)
├── utils/                # Funções auxiliares (idade do pet, datas, tempo relativo)
└── types/                # Tipos compartilhados
```

## Começando

### Pré-requisitos

- [Node.js](https://nodejs.org/) LTS
- Um projeto no [Supabase](https://supabase.com/dashboard)
- O app **Expo Go** no celular, um emulador Android ou um simulador iOS

### 1. Instale as dependências

```bash
git clone https://github.com/eu-micaeu/PetPost.git
cd PetPost
npm install
```

> O projeto usa `legacy-peer-deps=true` (no `.npmrc`). Para adicionar pacotes, use sempre `npx expo install <pacote>`, que escolhe versões compatíveis com o SDK.

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=<sua-anon-key>
```

Os dois valores estão em **Project Settings → API** no painel do Supabase. Use a chave **anon/publishable**, nunca a `service_role`: as variáveis `EXPO_PUBLIC_*` vão junto no app e qualquer pessoa pode lê-las.

### 3. Prepare o Supabase

Os scripts SQL não estão no repositório. O banco precisa ter:

| Recurso | Tipo | Uso |
| --- | --- | --- |
| `profiles` | tabela | Nome, nickname único e `avatar_url` de cada usuário |
| `pets` | tabela | `name`, `species`, `breed`, `birth_date`, `sex`, `image_url`, `user_id` |
| `posts` | tabela | `user_id`, `image_url`, `created_at` |
| `post_likes` | tabela | Curtidas (post × usuário) |
| `friendships` | tabela | `user_id`, `friend_id`, `status` (`pending` / `accepted`) |
| `notifications` | tabela | `user_id`, `actor_id`, `post_id`, `type` (`like` / `friend_request` / `friend_accept`), `read` |
| `get_feed(p_limit, p_before)` | função RPC | Feed paginado com contagem de curtidas (opcional: sem ela, o app usa consultas comuns) |
| `pet-photos` | bucket do Storage (público) | Fotos de posts, pets e avatares |

Ative também:

- **Row Level Security** em todas as tabelas.
- **Realtime** nas tabelas `notifications` e `friendships`.
- Para login com Google: o provedor **Google** em *Authentication → Providers* e a URL `petpost://auth/callback` em *Authentication → URL Configuration → Redirect URLs*.

### 4. Rode o app

```bash
npx expo start
```

Depois, escaneie o QR code com o Expo Go ou pressione `a` (Android), `i` (iOS) ou `w` (web).

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o servidor de desenvolvimento (Metro) |
| `npm run android` / `npm run ios` | Compila e roda um build nativo local |
| `npm run web` | Roda a versão web |
| `npm run lint` | Lint com ESLint (`eslint-config-expo`) |
| `npx tsc --noEmit` | Verificação de tipos |
| `npx expo-doctor` | Diagnóstico de dependências e configuração |

## Build e publicação (EAS)

Os perfis estão definidos em [`eas.json`](./eas.json):

```bash
npx eas-cli@latest build --profile development   # build de desenvolvimento (dev client)
npx eas-cli@latest build --profile preview       # APK para testes internos
npx eas-cli@latest build --profile production    # build de loja (versão incrementada automaticamente)
npx eas-cli@latest submit --profile production   # envio para as lojas
npx eas-cli@latest update                        # atualização OTA
```

As pastas `android/` e `ios/` são geradas automaticamente (*Continuous Native Generation*) e não ficam no repositório. Toda configuração nativa fica no [`app.json`](./app.json).

## Solução de problemas

- **Erro `Cannot read properties of undefined (reading 'exists')` ou mudanças que não aparecem no app**: o Metro não conseguiu montar o mapa de arquivos. Reinicie com cache limpo: `npx expo start -c`. Se o projeto estiver dentro do **OneDrive**, pause a sincronização ou mova a pasta para fora dele.
- **`As variáveis do Supabase não foram configuradas.`**: falta o `.env.local` (ou uma das variáveis). Depois de criar o arquivo, reinicie o servidor.
- **O login com Google não volta para o app**: confira se `petpost://auth/callback` está entre as Redirect URLs do Supabase.

## Contribuindo

1. Crie uma branch a partir da `main`: `git checkout -b feat/minha-feature`
2. Use [Conventional Commits](https://www.conventionalcommits.org/pt-br/) (`feat:`, `fix:`, `refactor:`, `chore:`…)
3. Rode `npm run lint` e `npx tsc --noEmit` antes de abrir o PR

## Licença

Distribuído sob a licença MIT. Veja [`LICENSE`](./LICENSE).
