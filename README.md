# 💪 Workout Planner

App de musculação em **React Native + Expo** para montar treinos, executá-los com cronômetro de descanso entre séries e acompanhar seu progresso. Tema escuro, acento neon e tipografia condensada.

## ✨ Funcionalidades

- **Treinos com CRUD completo** — criar, editar e excluir, com persistência local (AsyncStorage).
- **Dois formatos de treino** — *simples* (lista única de exercícios) ou *com grupos* (seções nomeadas, ex.: Perna, Costas, Peito).
- **Execução de treino** — cronômetro de duração total, marcação de séries concluídas, **timer de descanso** automático (90s) entre séries, navegação entre exercícios e resumo ao finalizar.
- **Rotação automática (A → B → C → A)** — a Home sugere o *próximo* treino a partir do último concluído; com um treino só, permanece nele.
- **Histórico de sessões** — cada treino finalizado vira uma sessão registrada, que alimenta a lista de **Recentes** e marca os dias treinados no calendário da semana.
- **Estatísticas reais** — nº de treinos, exercícios e volume total, derivados dos dados (sem valores fictícios).
- **UI animada** — bottom sheets deslizantes (API `Animated` nativa) para escolher o tipo de treino e para o menu de cada treino.

## 🧱 Stack

| Área | Tecnologia |
|------|-----------|
| Runtime | Expo SDK 54, React 19, React Native 0.81 |
| Linguagem | TypeScript (strict) |
| Navegação | React Navigation 7 (bottom-tabs + native-stack) |
| Persistência | AsyncStorage |
| UI | expo-linear-gradient, @expo/vector-icons, Google Fonts (Barlow Condensed / DM Sans / DM Mono) |

## 📁 Estrutura

```
src/
├─ components/     # UI reutilizável (BottomSheet, GradientButton, Icon, ProgressBar, RestTimer…)
├─ screens/        # Home, Workouts, Details, Create, ActiveWorkout
├─ navigation/     # navegadores e tipos de rota
├─ store/          # WorkoutStore (Context API: treinos + histórico de sessões)
├─ repositories/   # workoutRepository, sessionRepository (fonte de verdade da persistência)
├─ services/       # storage (wrapper tipado sobre AsyncStorage)
├─ hooks/          # useStopwatch, useCountdown, useWorkoutSession
├─ utils/          # workout, date, time, id (helpers puros)
├─ types.ts        # modelos de domínio
└─ theme.ts        # tokens de design (cores, fontes, gradientes)
```

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
Exercise { id, name, sets, reps, weight }   // weight 0 = peso corporal
WorkoutSession { id, workoutId, workoutName, order, completedAt, durationMs, completedSets, totalSets }
```

Treinos no formato antigo (lista plana de exercícios) são migrados automaticamente para um grupo "Geral" ao carregar.
