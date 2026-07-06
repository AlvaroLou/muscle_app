# 💪 Workout Planner

App de musculação em **React Native + Expo** para montar treinos, executá-los com cronômetro de descanso entre séries e acompanhar seu progresso. Tema escuro, acento neon e tipografia condensada.

## ✨ Funcionalidades

- **Treinos com CRUD completo** — criar, editar e excluir, com persistência local (AsyncStorage).
- **Dois formatos de treino** — *simples* (lista única de exercícios) ou *com grupos* (seções nomeadas, ex.: Perna, Costas, Peito).
- **Execução de treino** — cronômetro de duração total, marcação de séries concluídas, **timer de descanso** por série (padrão 90s, ajustável por exercício), navegação entre exercícios e resumo ao finalizar. Ao terminar a **última série** do exercício, avança sozinho para o próximo quando o descanso encerra.
- **Descanso e descrição por exercício** — cada exercício tem seu tempo de descanso e uma observação livre (técnica/cadência).
- **Rotação automática** — a Home sugere o *próximo* treino (A → B → C → A) e, dentro de um treino com grupos, o *próximo grupo* (Perna → Peito → …) a partir do último concluído.
- **Sessão em segundo plano** — sair do treino mantém a sessão viva; a Home mostra um banner **Retomar**; expira após 3h sem atualização.
- **Histórico de sessões** — cada treino finalizado vira uma sessão registrada, que alimenta a lista de **Recentes** e a aba **Histórico** (todas as sessões). Tocar numa sessão abre um **resumo** (duração, séries, % concluído). Marca os dias treinados no calendário da semana. Botão de limpar.
- **Reordenação** — treinos por setas no menu **e** por **arrastar-e-soltar**; grupos e exercícios arrastáveis no Detalhe (persiste) e na edição (aplica ao salvar).
- **Grupos minimizáveis** — expandir/colapsar cada seção no Detalhe (inclusive o treino simples).
- **UI animada** — bottom sheets deslizantes (API `Animated` nativa) para seletores, menus e **confirmações customizadas** (sem `Alert` nativo).
- **Estatísticas reais** — derivadas dos dados, sem valores fictícios.

## 🧱 Stack

| Área | Tecnologia |
|------|-----------|
| Runtime | Expo SDK 54, React 19, React Native 0.81 |
| Linguagem | TypeScript (strict) |
| Navegação | React Navigation 7 (bottom-tabs + native-stack) |
| Persistência | AsyncStorage |
| Gestos/animação | react-native-gesture-handler, react-native-reanimated 4 (+ react-native-worklets), react-native-draggable-flatlist |
| UI | expo-linear-gradient, @expo/vector-icons, Google Fonts (Barlow Condensed / DM Sans / DM Mono) |

## 📁 Estrutura

```
src/
├─ components/     # UI reutilizável (BottomSheet, ConfirmSheet, GradientButton, Icon, ProgressBar, RestTimer…)
├─ screens/        # Home, Workouts, Details, Create, ActiveWorkout
├─ navigation/     # navegadores e tipos de rota
├─ store/          # WorkoutStore (Context API: treinos + histórico + sessão ativa)
├─ repositories/   # workout / session / activeSession Repository (fonte de verdade da persistência)
├─ services/       # storage (wrapper tipado sobre AsyncStorage)
├─ hooks/          # useStopwatch, useCountdown, useWorkoutSession
├─ utils/          # workout, date, time, id (helpers puros)
├─ types.ts        # modelos de domínio
└─ theme.ts        # tokens de design (cores, fontes, gradientes)
```

> **Reanimated 4:** o `babel.config.js` usa `react-native-worklets/plugin` (não o antigo `react-native-reanimated/plugin`). Após mexer no babel, reinicie com `npx expo start -c`.

**Arquitetura em camadas:** telas consomem o `WorkoutStore` (Context) → que fala com os *repositories* → que usam o *service* de `storage`. Trocar AsyncStorage por SQLite/servidor depois exige mexer só em `services/storage.ts`.

## 🚀 Rodando localmente

Pré-requisitos: **Node.js LTS** e o app **Expo Go** no celular.

```bash
npm install
npm start
```

Escaneie o QR Code com o Expo Go (Android) ou a câmera (iOS). Outros scripts:

```bash
npm run android    # abre direto no Android
npm run typecheck  # checagem de tipos (tsc --noEmit)
```

## 📦 Gerando um APK (Android)

O projeto já traz um perfil `preview` em [`eas.json`](eas.json) que gera um `.apk` instalável.

**Via EAS (nuvem) — recomendado:**

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Ao terminar, o EAS retorna uma URL para baixar e instalar o APK no aparelho.

**Build local** (requer Android SDK + JDK configurados):

```bash
npx expo prebuild -p android
cd android && ./gradlew assembleRelease
# APK em android/app/build/outputs/apk/release/app-release.apk
```

## 🗺️ Modelo de dados

```ts
Workout { id, name, groups: ExerciseGroup[], createdAt, updatedAt }
ExerciseGroup { id, name, exercises: Exercise[] }
Exercise { id, name, sets, reps, weight, rest, description }   // weight/rest 0 = peso corporal / descanso padrão
WorkoutSession { id, workoutId, workoutName, groupId?, order, completedAt, durationMs, completedSets, totalSets }
ActiveSession { workoutId, groupId?, workoutName, order, currentExerciseIndex, completedSetKeys[], accumulatedMs, lastResumeAt, running, updatedAt }
```

Treinos no formato antigo (sem `groups`, `rest` ou `description`) são migrados automaticamente ao carregar (lista plana → grupo "Geral"; campos ausentes caem no padrão).

## 📚 Documentação

- [docs/PRD.md](docs/PRD.md) — requisitos priorizados e cronograma.
- [docs/GUIA_DESENVOLVIMENTO.md](docs/GUIA_DESENVOLVIMENTO.md) — passo a passo para construir do zero.

## 🗣️ Prompts para reconstruir o app (com IA)

Estes são os pedidos que originaram cada parte do app, **reescritos de forma clara e específica** — do jeito que rendem o melhor resultado com um assistente de código. Peça um por vez, na ordem, validando cada etapa antes de seguir. Dica geral: sempre feche com *"rode o typecheck e me diga onde alterou"*.

**1. Base do projeto**
> "Crie um app de musculação em React Native + Expo (SDK 54) com TypeScript. Tema escuro, acento neon rosa (#ff149d), fontes Barlow Condensed / DM Sans / DM Mono. Navegação com abas (Home, Meus Treinos) e telas de Detalhe, Criar e Treino Ativo. Estruture em camadas: telas → store (Context) → repository → serviço de storage (AsyncStorage). Alias `@/` para `src/`."

**2. CRUD de treinos**
> "Implemente o CRUD de treinos com persistência local: criar, listar, ver detalhes, editar e excluir. Cada treino tem nome e exercícios (nome, séries, reps, peso). Sem dados fictícios — comece vazio."

**3. Execução com descanso**
> "Crie a tela de executar treino: mostrar exercício atual, marcar séries concluídas com barra de progresso, cronômetro de duração total baseado em timestamp (sem drift), e um **timer de descanso** que abre a cada série concluída (padrão 90s, com ±15s e pular). Tela de resumo ao finalizar."

**4. Home real**
> "Deixe a Home com data e semana reais e estatísticas derivadas do store — sem nenhum dado fictício."

**5. Grupos**
> "Permita agrupar exercícios em seções nomeadas dentro de um treino (ex.: Treino A → Perna{...}, Costas{...}). No momento de criar, deixe escolher entre 'treino simples' (lista única) e 'treino com grupos'. Migre treinos antigos automaticamente."

**6. Seletores/menus animados (sem Alert nativo)**
> "Troque os alertas nativos por um bottom sheet animado (API Animated, sem dependência nova): um para escolher o tipo de treino e um para o menu de cada treino (iniciar, editar, excluir com confirmação inline)."

**7. Rotação, sessão em 2º plano e recentes**
> "Ao iniciar o treino, siga a rotação da semana: se fiz Perna e finalizei, na próxima vez o mesmo treino começa em Peito. Ao sair do treino sem pausar, ele deve continuar em segundo plano com opção de retomar; se pausei antes de sair, retoma pausado; expira após 3h. Registre as sessões concluídas em 'Recentes' e adicione um botão de limpar. Remova o card de volume."

**8. Descanso por exercício e correções**
> "Adicione um campo de descanso (segundos) e outro de descrição por exercício, propagados até a persistência e exibidos no Detalhe e na execução. Corrija: o timer de descanso deve abrir sempre que eu concluir uma série (não confie no retorno do setState). Torne as confirmações customizadas (bottom sheet) e faça o teclado empurrar a tela para o campo em edição ficar visível."

**9. Reordenar (menu) e minimizar**
> "Adicione reordenar treinos pelo menu (setas ▲/▼) e deixe cada grupo (e o treino simples) minimizável no Detalhe. Revise os layouts: corrija textos que estouram o campo (numberOfLines, flexWrap, flex:1)."

**10. Arrastar-e-soltar**
> "Quero reordenar arrastando com o dedo. Adicione gesture-handler + reanimated + draggable-flatlist (compatíveis com Expo Go). Comece só pelos **treinos** na lista; se funcionar, aplique também a **grupos** e **exercícios dentro do grupo**, no Detalhe (persistindo) e na edição (aplicando ao salvar). Use listas aninhadas e arraste por 'puxador' para não conflitar com os campos de texto."

> ⚠️ No Reanimated 4, o plugin do babel é `react-native-worklets/plugin` (o antigo quebra com "installTurboModule"). Reinicie com `npx expo start -c`.

**11. Auto-avanço e histórico**
> "No treino, ao concluir a última série de um exercício, quando o descanso encerra (pular ou zerar) passe automaticamente ao próximo exercício. Adicione uma aba de Histórico com todas as sessões e uma tela de resumo por sessão (duração, séries, % concluído), aberta ao tocar numa recente na Home ou num item do histórico."

**12. Documentação**
> "Gere um PRD com requisitos priorizados e cronograma, um guia de desenvolvimento passo a passo, e um README com estes prompts — e mantenha os três atualizados a cada nova funcionalidade."
