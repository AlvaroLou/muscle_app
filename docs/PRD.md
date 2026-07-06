# PRD — Muscle App (Planejador de Treino de Musculação)

> Documento de Requisitos de Produto. Serve para organizar o escopo, priorizar
> as atividades e guiar o desenvolvimento **do zero** do aplicativo.

- **Produto:** app mobile de musculação (montar treinos, executar com timer de descanso, acompanhar histórico).
- **Plataforma:** React Native + Expo (Android e iOS), rodável em Expo Go e distribuível como APK.
- **Autor:** Álvaro Lourenço
- **Versão do documento:** 1.0
- **Status:** em desenvolvimento

---

## 1. Visão geral

### 1.1 Problema
Quem treina precisa de um lugar simples para **montar seus treinos**, **executá-los na academia** (marcando séries, com pausa de descanso cronometrada) e **acompanhar o que já fez**. Apps genéricos de nota não têm timer de descanso nem organização por treino/grupo muscular; apps grandes são complexos e cheios de funções que atrapalham.

### 1.2 Solução
Um app enxuto, offline-first, com foco em três momentos:
1. **Planejar** — criar treinos (simples ou divididos em grupos: Perna, Costas, Peito…).
2. **Executar** — iniciar o treino, marcar séries, com **timer de descanso automático** e duração total.
3. **Acompanhar** — histórico de sessões, rotação automática do próximo treino/grupo da semana.

### 1.3 Objetivos (metas de produto)
- Criar e iniciar um treino em **menos de 2 minutos**.
- Zero dependência de internet para uso diário (dados locais).
- Rodar liso no celular do usuário (60fps nas animações, sem travar).

### 1.4 Não-objetivos (fora de escopo nesta fase)
- Login/conta na nuvem e sincronização entre dispositivos.
- Rede social, compartilhamento, ranking.
- Biblioteca pronta de exercícios com vídeos.
- Nutrição / dieta.

---

## 2. Personas

| Persona | Perfil | Necessidade principal |
|---|---|---|
| **Praticante regular (foco)** | Treina 3–6x/semana, segue uma rotina A/B/C ou por grupo muscular | Montar a rotina uma vez e executá-la rápido, com descanso cronometrado |
| **Iniciante** | Começando agora, poucos treinos | Interface simples, sem configuração complexa |

Foco primário: **praticante regular**.

---

## 3. Requisitos funcionais (com prioridade)

Prioridade em **MoSCoW**: **P0 = Must** (MVP), **P1 = Should**, **P2 = Could**, **P3 = Won't (agora)**.

### 3.1 Fundação
| ID | Requisito | Prioridade |
|---|---|---|
| F-01 | Projeto Expo + TypeScript, navegação (tabs + stack) | P0 |
| F-02 | Tema/design tokens (cores, fontes, gradientes) | P0 |
| F-03 | Persistência local (AsyncStorage) isolada por camada (service → repository → store) | P0 |
| F-04 | Componentes base reutilizáveis (botão, input, pílula, ícones, tela) | P0 |

### 3.2 CRUD de treinos
| ID | Requisito | Prioridade |
|---|---|---|
| T-01 | Criar treino com nome | P0 |
| T-02 | Adicionar exercícios (nome, séries, reps, peso) | P0 |
| T-03 | Editar e excluir treino | P0 |
| T-04 | Listar treinos com resumo (nº de exercícios, duração estimada) | P0 |
| T-05 | Ver detalhes de um treino | P0 |
| T-06 | Treino **com grupos** (seções nomeadas: Perna, Costas…) | P1 |
| T-07 | Escolher no momento da criação: treino simples vs. com grupos | P1 |
| T-08 | Campo de **descanso por exercício** (segundos) | P1 |
| T-09 | Campo de **descrição/observação** por exercício | P2 |
| T-10 | **Reordenar treinos** (setas no menu + arrastar-e-soltar) | P1 |
| T-11 | **Reordenar grupos** e **exercícios** por arrastar-e-soltar | P2 |
| T-12 | **Minimizar/expandir** grupos (e o treino simples) no Detalhe | P2 |

### 3.3 Execução do treino
| ID | Requisito | Prioridade |
|---|---|---|
| E-01 | Iniciar treino: tela de execução com exercício atual e séries | P0 |
| E-02 | Marcar/desmarcar séries concluídas; barra de progresso | P0 |
| E-03 | **Timer de descanso** automático ao concluir cada série (ajustável ±15s, pular) | P0 |
| E-04 | Cronômetro de **duração total** (baseado em timestamp, sem drift) | P0 |
| E-05 | Navegar entre exercícios (anterior/próximo); resumo ao finalizar | P0 |
| E-06 | Pausar/retomar a sessão | P1 |
| E-07 | Iniciar **um grupo específico** de um treino com grupos | P1 |
| E-08 | **Treino em segundo plano**: sair da tela mantém a sessão; opção de retomar; expira em 3h | P1 |
| E-09 | **Auto-avanço**: ao concluir a última série, ao fim do descanso (pular ou zerar) passa ao próximo exercício | P1 |

### 3.4 Acompanhamento
| ID | Requisito | Prioridade |
|---|---|---|
| A-01 | Home com data real, semana atual e estatísticas reais (sem dados fictícios) | P0 |
| A-02 | Histórico de sessões concluídas ("Recentes") | P1 |
| A-03 | Marcar no calendário da semana os dias treinados | P1 |
| A-04 | **Rotação automática** do próximo treino (A→B→C) e do próximo grupo (Perna→Peito→…) | P1 |
| A-05 | Limpar histórico de recentes | P2 |
| A-06 | Tela de **Histórico** (todas as sessões) + **resumo por sessão** ao tocar em uma recente/item | P1 |

### 3.5 Experiência / UI
| ID | Requisito | Prioridade |
|---|---|---|
| U-01 | Diálogos/confirmações **customizados** (bottom sheet animado), sem `Alert` nativo | P1 |
| U-02 | Seletores em bottom sheet animado (tipo de treino, menu do treino) | P1 |
| U-03 | Teclado empurra a tela para o campo em edição ficar visível | P1 |
| U-04 | Ícone e splash do app | P2 |
| U-05 | Limites de texto (sem estouro de campo) em todas as telas | P1 |
| U-06 | Gestos de arrastar fluidos a 60fps (thread nativa) | P2 |

### 3.6 Distribuição
| ID | Requisito | Prioridade |
|---|---|---|
| D-01 | Rodar em Expo Go para desenvolvimento | P0 |
| D-02 | Gerar **APK instalável** (perfil EAS `preview`) | P1 |
| D-03 | Build local via prebuild + Gradle (alternativa) | P2 |

### 3.7 Futuro (P3 — não agora)
- Conta na nuvem e sincronização; reordenar/duplicar grupos; gráficos de evolução de carga; biblioteca de exercícios; notificações de lembrete.

---

## 4. Requisitos não-funcionais
- **Offline-first:** todo o uso diário funciona sem internet.
- **Performance:** animações com `useNativeDriver`; cronômetros baseados em timestamp (sem acumular tick).
- **Persistência resiliente:** falha de storage não quebra o app (try/catch com fallback).
- **Compatibilidade de dados:** treinos antigos migram para o formato novo automaticamente.
- **Tipagem:** TypeScript estrito, sem `any` no domínio.
- **Manutenibilidade:** camadas separadas (UI → store → repository → storage); helpers puros testáveis.

---

## 5. Modelo de dados (domínio)

```
Workout { id, name, groups: ExerciseGroup[], createdAt, updatedAt }
ExerciseGroup { id, name, exercises: Exercise[] }
Exercise { id, name, sets, reps, weight, rest, description }
WorkoutSession { id, workoutId, workoutName, groupId?, order, completedAt, durationMs, completedSets, totalSets }
ActiveSession { workoutId, groupId?, workoutName, order, currentExerciseIndex, completedSetKeys[], accumulatedMs, lastResumeAt, running, updatedAt }
```

- **Workout** = coleção ordenada de grupos; treino "simples" é um único grupo sem nome.
- **WorkoutSession** = retrato de um treino concluído (histórico).
- **ActiveSession** = treino em andamento persistido (permite retomar; expira em 3h).

---

## 6. Métricas de sucesso
- Criar + iniciar um treino em < 2 min (medição manual).
- 100% das features P0 funcionando offline.
- 0 crashes nos fluxos principais (criar, executar, finalizar).
- Timer de descanso abre em 100% das conclusões de série.

---

## 7. Priorização e cronograma

Estimativa em **sessões de desenvolvimento** (blocos de ~meio dia). Ajuste conforme seu ritmo. O caminho crítico é: **Fundação → CRUD → Execução → Acompanhamento**.

| Fase | Entregável | Requisitos | Estimativa |
|---|---|---|---|
| **0. Fundação** | App roda, navega, persiste, com design base | F-01…F-04 | 2 sessões |
| **1. CRUD (MVP núcleo)** | Criar/editar/excluir/listar/detalhar treinos simples | T-01…T-05, D-01 | 3 sessões |
| **2. Execução (MVP núcleo)** | Iniciar treino, marcar séries, timer de descanso, duração, resumo | E-01…E-05 | 3 sessões |
| **3. Home real** | Data/semana/estatísticas reais | A-01 | 1 sessão |
| **→ Marco: MVP jogável (só P0)** | | | **~9 sessões** |
| **4. Grupos** | Treino com grupos + seletor simples/grupos | T-06, T-07 | 2 sessões |
| **5. Descanso e execução avançada** | Descanso por exercício, pausar/retomar, iniciar grupo específico | T-08, E-06, E-07 | 2 sessões |
| **6. Histórico e rotação** | Recentes, tela de Histórico + resumo por sessão, calendário treinado, rotação treino/grupo | A-02…A-04, A-06 | 2 sessões |
| **7. Sessão em 2º plano** | Persistir/retomar sessão, expiração 3h | E-08 | 2 sessões |
| **8. Polimento de UX** | Bottom sheets, confirmações customizadas, teclado, limpar recentes, limites de texto | U-01…U-05, A-05 | 2 sessões |
| **9. Reordenação simples** | Setas ▲/▼ no menu + minimizar grupos | T-10 (menu), T-12 | 1 sessão |
| **10. Arrastar-e-soltar** | Treinos, grupos e exercícios arrastáveis (gesture-handler + reanimated + draggable-flatlist) | T-10 (drag), T-11, U-06 | 2 sessões |
| **11. Distribuição** | Ícone/splash + APK via EAS | T-09, U-04, D-02, D-03 | 1 sessão |
| **→ Marco: v1.0 completa** | | | **~23 sessões** |

### Ordem de prioridade recomendada (o que fazer primeiro)
1. **P0 primeiro, sempre** — sem MVP não há o que polir.
2. Dentro do P1, priorize **Grupos** e **Descanso por exercício** (maior valor percebido).
3. **Sessão em 2º plano** e **rotação** vêm depois (dependem de histórico existir).
4. **Polimento e distribuição** por último.

---

## 8. Riscos e mitigação
| Risco | Impacto | Mitigação |
|---|---|---|
| Cronômetro sofrer drift / congelar em background | Duração errada | Basear em timestamps (`Date.now()`), não em contador incremental |
| `setState` updater lido de forma síncrona (bug de estado) | Timer não dispara | Decidir por estado do render, nunca pelo retorno do updater |
| Config nativa (teclado `pan`) não valer no Expo Go | Confusão em teste | Documentar que vale no APK; oferecer fallback JS |
| Mudança de modelo quebrar dados salvos | Perda de treinos | Função de normalização/migração ao carregar |
| Reanimated 4 exigir plugin do `react-native-worklets` (não o antigo) | App não inicia ("installTurboModule") | Usar `react-native-worklets/plugin` no babel e limpar cache (`expo start -c`) |
| Listas arrastáveis aninhadas disputarem com scroll/teclado | Gesto travado | Arraste só pelo puxador; `NestableScrollContainer`/`NestableDraggableFlatList` |
| Escopo crescer (nuvem, social) | Atraso do MVP | Congelar P3 até a v1.0 sair |
