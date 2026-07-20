# Mídia demonstrativa dos exercícios

Coloque aqui os **GIFs / vídeos** de demonstração dos exercícios padrão do app.

## Convenção de nomes

Nomeie cada arquivo com o **`id` do exercício** (o mesmo usado em
[`src/data/exerciseLibrary.ts`](../../src/data/exerciseLibrary.ts)), em minúsculas:

```
bench_press.gif      (ou .mp4)
incline_dumbbell_press.gif
push_up.gif
pull_up.gif
...
```

### Ids atuais dos exercícios padrão

Peito: `bench_press`, `incline_dumbbell_press`, `push_up`, `cable_fly`
Costas: `pull_up`, `bent_over_row`, `lat_pulldown`, `seated_cable_row`
Ombros: `overhead_press`, `lateral_raise`, `face_pull`
Bíceps: `barbell_curl`, `hammer_curl`
Tríceps: `triceps_pushdown`, `overhead_triceps_extension`, `dips`
Antebraço: `wrist_curl`
Pernas: `back_squat`, `leg_press`, `romanian_deadlift`, `leg_extension`, `leg_curl`
Glúteos: `hip_thrust`, `glute_bridge`
Panturrilha: `standing_calf_raise`
Core: `plank`, `hanging_leg_raise`, `cable_crunch`
Corpo todo: `deadlift`, `kettlebell_swing`
Cardio: `burpee`, `jump_rope`

## Onde conseguir os GIFs/vídeos (licença livre)

Priorize fontes com licença que permite uso comercial (o app terá versão paga).
Sempre confira a licença de cada item antes de publicar.

| Fonte | O que é | Observação |
|-------|---------|------------|
| **Wikimedia Commons** (commons.wikimedia.org) | Vídeos/GIFs de exercícios | Licenças CC — verifique atribuição exigida |
| **Pexels** / **Pixabay** (vídeos) | Vídeos de treino | Licença livre p/ uso comercial, sem atribuição |
| **Coverr** (coverr.co) | Vídeos curtos gratuitos | Bom p/ recortar demonstrações |
| **Mixkit** (mixkit.co) | Vídeos gratuitos | Licença própria — ler antes |
| **musclewiki.com** | Animações por músculo | **Verifique a licença** — nem tudo é livre |
| **Gravar você mesmo** | Vídeo próprio | Sem risco de licença; melhor p/ consistência visual |

> Dica: para consistência visual, um GIF curto (2–4 s, em loop, ~480p) fica leve
> e carrega bem no app. Vídeos `.mp4` H.264 também funcionam.

## Como exibir no app

Hoje há **duas formas** de anexar mídia a um exercício:

1. **Pelo próprio app (por usuário, recurso Pro):** abra o exercício → **Editar** →
   seção *Mídia* → *Adicionar vídeo*. O vídeo é copiado para o dispositivo e
   aparece no detalhe do exercício. Vale tanto para exercícios personalizados
   quanto para os **padrão** (as edições viram um "override" salvo localmente).

2. **Empacotado no app (bundled), para todos os usuários:** requer registrar os
   arquivos desta pasta num mapa `require(...)` e renderizá-los como fallback no
   detalhe do exercício. Ainda **não** está ligado — se quiser essa opção
   (mesma mídia para todos, sem depender de cada usuário anexar), me avise que
   eu ligo o carregamento dos arquivos daqui.
