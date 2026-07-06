# Guia de Desenvolvimento — Muscle App (do zero)

> Passo a passo prático para construir o app descrito no [PRD](./PRD.md), na
> ordem das fases (0 → 9). Cada fase tem: **objetivo**, **passos** e **critério
> de pronto (DoD)**. Faça uma fase por vez e só avance quando o DoD passar.

## Princípios que valem para todas as fases
- **Camadas:** UI (telas/componentes) → `store` (Context) → `repository` → `services/storage`. A UI nunca fala com o AsyncStorage direto.
- **Helpers puros** em `utils/` (sem estado/React) — fáceis de testar e reusar.
- **Cronômetros por timestamp** (`Date.now()`), nunca somando `+1s` por tick.
- **Verifique sempre:** `npx tsc --noEmit` (0 erros) e teste o fluxo no Expo Go antes de marcar como pronto.
- Convenções: TypeScript estrito, componentes funcionais, `@/` como alias para `src/`.

---

## Fase 0 — Fundação

**Objetivo:** app roda, navega entre telas vazias e persiste um valor de teste.

**Passos**
1. Criar o projeto: `npx create-expo-app muscle_app -t expo-template-blank-typescript`.
2. Instalar dependências:
   - Navegação: `@react-navigation/native`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`.
   - Persistência: `@react-native-async-storage/async-storage`.
   - UI: `expo-linear-gradient`, `@expo/vector-icons`, fontes `@expo-google-fonts/*`.
3. Configurar o alias `@/ → src/` (babel-plugin-module-resolver + `paths` no `tsconfig.json`).
4. Criar `src/theme.ts` com tokens (cores, fontes, gradientes).
5. Criar `src/services/storage.ts` — wrapper tipado `get/set/remove` com try/catch.
6. Montar a navegação: `RootStack` → `Tabs` (Home, Treinos) + telas placeholder.
7. Componentes base em `src/components/`: `Screen`, `GradientButton`, `Icon`, `Pill`, `FocusInput`.

**DoD:** o app abre no Expo Go, troca de aba, e um `storage.set/get` de teste funciona.

---

## Fase 1 — CRUD de treinos (núcleo do MVP)

**Objetivo:** criar, listar, ver, editar e excluir treinos simples, com persistência.

**Passos**
1. `src/types.ts` — modelos `Exercise`, `ExerciseGroup`, `Workout` e entradas de CRUD.
2. `src/repositories/workoutRepository.ts` — `getAll/saveAll/clear` sobre o `storage`.
3. `src/store/WorkoutStore.tsx` — Context com `workouts`, `loading`, `getWorkout`, `createWorkout`, `updateWorkout`, `deleteWorkout`. Carrega na montagem; persiste a cada mudança (padrão `commit`).
4. `src/utils/workout.ts` — helpers: `allExercises`, `estimatedDurationMin`, `workoutLetter`, conversões formulário↔domínio (`toEditGroups`/`fromEditGroups`).
5. Telas:
   - `WorkoutsScreen` — lista com badge, resumo e FAB "criar".
   - `DetailsScreen` — exercícios do treino + botão "Iniciar" (placeholder por enquanto).
   - `CreateScreen` — formulário (nome + exercícios), validação e salvar.

**DoD:** dá para criar um treino, vê-lo na lista, editar, excluir — e ele **persiste** após fechar o app.

---

## Fase 2 — Execução do treino (núcleo do MVP)

**Objetivo:** iniciar um treino e executá-lo com séries, descanso e duração.

**Passos**
1. Hooks de tempo (timestamp-based):
   - `useStopwatch` — duração total (aceita tempo inicial p/ retomar depois).
   - `useCountdown` — contagem regressiva do descanso.
   - `useWorkoutSession(workout)` — achata grupos em sequência de exercícios, controla séries concluídas, progresso, navegação e `finish`.
2. `RestTimer` — overlay de descanso (contagem, ±15s, pular). **Regra de ouro:** a visibilidade segue o próprio countdown; o disparo usa um `trigger` que muda a cada série.
3. `ActiveWorkoutScreen`:
   - topo com duração + pausar; barra de progresso.
   - lista de séries do exercício atual (marcar/desmarcar).
   - ao **concluir** uma série (decidido por `!set.completed` no render, **nunca** pelo retorno do `setState`), abre o descanso.
   - navegação anterior/próximo; tela de resumo ao finalizar.
4. Ligar `DetailsScreen` → `ActiveWorkout` via rota `{ workoutId }`.

4. **Auto-avanço:** ao concluir a **última série** do exercício, quando o descanso encerra (pular ou zerar) avança automaticamente ao próximo (via `advanceRef`, verificando `!isLastExercise`).

**DoD:** iniciar treino, marcar séries → **timer de descanso abre toda vez**, duração conta certo, ao terminar a última série o app pula pro próximo exercício, resumo aparece ao finalizar.

---

## Fase 3 — Home real

**Objetivo:** Home sem dados fictícios.

**Passos**
1. `src/utils/date.ts` — `headerDate`, `currentWeek` (semana real, segunda→domingo).
2. `HomeScreen` — data real, calendário da semana, estatísticas derivadas do store (treinos, exercícios), card "treino de hoje", estado vazio de recentes.

**DoD:** tudo na Home reflete dados reais; sem números inventados.

> **Marco:** aqui você tem o **MVP jogável** (só P0). Use por alguns dias antes de seguir.

---

## Fase 4 — Treino com grupos

**Objetivo:** dividir um treino em seções nomeadas (Perna, Costas…).

**Passos**
1. Modelo já suporta `groups`; garantir `normalizeWorkout` para migrar treinos antigos (lista plana → grupo "Geral").
2. `CreateScreen` em **dois modos**: `simple` (lista única) e `grouped` (seções com nome + adicionar grupo). Escolha via bottom sheet no momento de criar.
3. `DetailsScreen` — renderizar por grupo, com rótulo da seção.
4. Validação: no modo com grupos, exigir nome em todo grupo que tenha exercícios.

**DoD:** criar "Treino A" com Perna/Peito, ver as seções separadas no Details.

---

## Fase 5 — Descanso e execução avançada

**Objetivo:** descanso por exercício, pausar/retomar, iniciar um grupo específico.

**Passos**
1. Adicionar `rest` (e opcional `description`) ao `Exercise`/`EditExercise`; campo no formulário; mapear nas conversões. Usar `currentExercise.rest || DEFAULT` no descanso.
2. Pausar/retomar no `ActiveWorkoutScreen` (o `useStopwatch` já suporta).
3. Rota `ActiveWorkout` aceita `groupId?`; quando presente, a sessão filtra só aquele grupo. Botão "Iniciar" por grupo no `DetailsScreen`.

**DoD:** definir descanso 120s num exercício e vê-lo no timer; iniciar só o grupo "Perna".

---

## Fase 6 — Histórico e rotação

**Objetivo:** registrar sessões e sugerir o próximo treino/grupo.

**Passos**
1. `WorkoutSession` + `sessionRepository`; `logSession` no store; registrar ao **finalizar** (com `groupId`).
2. Home: lista de **Recentes**, calendário marcando dias treinados (`dayKey`, `relativeDay`).
3. Helpers de rotação em `utils/workout.ts`: `nextWorkoutIndex` (A→B→C) e `nextGroupIndex`/`startParamsFor` (próximo grupo). Usar no botão iniciar da Home e no menu.
4. **Tela de Histórico** (aba) listando todas as sessões + **`SessionSummary`** (rota modal) com o resumo de uma sessão (duração, séries, % concluído). Tocar numa recente (Home) ou num item do histórico abre o resumo.

**DoD:** concluir "Perna" → próxima vez que iniciar o treino, vem "Peito"; a sessão aparece em Recentes e no Histórico; tocar nela abre o resumo; o dia fica marcado.

---

## Fase 7 — Sessão em segundo plano

**Objetivo:** sair do treino e retomar de onde parou (expira em 3h).

**Passos**
1. `ActiveSession` + `activeSessionRepository`; store com `activeSession`, `saveActiveSession`, `clearActiveSession` e checagem de expiração (3h) ao carregar.
2. `useWorkoutSession(workout, initial?)` — hidratar séries/índice/tempo do snapshot. Tempo reconstruído: `accumulatedMs + (running ? agora − lastResumeAt : 0)`.
3. `ActiveWorkoutScreen`: persistir snapshot em mudanças relevantes e ao sair; botão X sai mantendo em 2º plano (+ opção descartar); finalizar limpa a sessão.
4. Home: banner "Treino em andamento → Retomar".

**DoD:** iniciar, sair pelo X, voltar pelo banner e continuar; pausar+sair+voltar retoma pausado; após 3h some.

---

## Fase 8 — Polimento de UX

**Objetivo:** visual coeso, sem alertas nativos.

**Passos**
1. `BottomSheet` animado (Animated + `useNativeDriver`) para seletores.
2. `ConfirmSheet` — confirmações no estilo do app (substitui `Alert` nativo): sair/descartar treino, limpar recentes, avisos de validação.
3. Teclado: `softwareKeyboardLayoutMode: "pan"` no `app.json` (vale no APK). Fallback JS se precisar no Expo Go.
4. "Limpar recentes" na Home.
5. **Limites de texto:** revisar todas as telas — `numberOfLines` em títulos/nomes, `flexWrap` em linhas de pílulas/tags, `flex:1` para o texto encolher em vez de vazar.

**DoD:** nenhuma confirmação usa `Alert` nativo; teclado não cobre o campo em edição no APK; nenhum texto estoura o campo.

---

## Fase 9 — Reordenação simples (sem dependências)

**Objetivo:** reordenar treinos e organizar a visualização, antes de adicionar libs de gesto.

**Passos**
1. Store: `moveWorkout(id, 'up'|'down')` (troca imutável e persiste).
2. Menu (⋮) do treino: linha "Reordenar" com botões ▲/▼ (desabilitados nas pontas).
3. `DetailsScreen`: cada grupo vira um cabeçalho clicável (chevron) que **minimiza/expande**; vale também para o treino simples ("EXERCÍCIOS").

**DoD:** dá para mover um treino no menu e minimizar seções no Detalhe.

---

## Fase 10 — Arrastar-e-soltar (touch)

**Objetivo:** reordenar por gesto (arrastar com o dedo) treinos, grupos e exercícios.

**Passos**
1. Instalar: `npx expo install react-native-gesture-handler react-native-reanimated react-native-worklets react-native-draggable-flatlist`.
2. **Babel:** adicionar `'react-native-worklets/plugin'` como **último** plugin (Reanimated 4). Reiniciar com cache limpo: `npx expo start -c`.
3. `App.tsx`: envolver tudo em `<GestureHandlerRootView style={{ flex: 1 }}>`.
4. Store: `reorderWorkouts(lista)`, `reorderGroups(workoutId, lista)`, `reorderExercises(workoutId, groupId, lista)`.
5. **Lista de treinos:** `DraggableFlatList` com puxador (⣿); `onDragEnd` → `reorderWorkouts`.
6. **Detalhe (2 níveis):** `NestableScrollContainer` + `NestableDraggableFlatList` para grupos, e outro aninhado para os exercícios de cada grupo aberto. Persiste na hora.
7. **Criação/edição:** rascunhos ganham **chave estável** (`key`); mesmas listas arrastáveis; ordem aplica ao Salvar. Arraste só pelo puxador para não conflitar com os campos de texto.

**Armadilhas**
- Plugin errado do Reanimated → `installTurboModule` no runtime. Use o do worklets e limpe cache.
- `FlatList` não aplica `gap` — use `marginBottom` nos itens.
- Chave por índice quebra o arraste — use `id`/`key` estável.

**DoD:** arrastar reordena treinos, grupos e exercícios; funciona no Expo Go e no APK; a ordem persiste.

---

## Fase 11 — Distribuição (APK)

**Objetivo:** gerar um APK instalável.

**Passos**
1. Ícone e splash: configurar `icon`, `splash` e `android.adaptiveIcon` no `app.json` (imagem 1024×1024).
2. `eas.json` com perfil `preview` gerando `buildType: "apk"`.
3. Build: `npm i -g eas-cli` → `eas login` → `eas build -p android --profile preview`. Baixar o APK pela URL.
4. (Alternativa) Local: `npx expo prebuild -p android` → `./gradlew assembleRelease`.

**DoD:** APK instala no aparelho e o app abre e funciona offline.

---

## Checklist de qualidade (rodar ao fim de cada fase)
- [ ] `npx tsc --noEmit` sem erros.
- [ ] O bundle compila: `CI=1 npx expo export --platform android` (ou testar no Expo Go).
- [ ] Fluxo da fase testado manualmente no celular.
- [ ] Sem `Alert` nativo novo; sem dados fictícios; sem cronômetro por contador.
- [ ] Dados persistem após fechar/reabrir o app.

## Sugestão de fluxo com Git
- Uma branch por fase (`feat/fase-2-execucao`), commits pequenos por passo.
- Mensagem no imperativo; abrir PR ao fechar a fase para revisar o DoD.
