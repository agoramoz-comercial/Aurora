# Design system v3 · Cockpit Aurora (F2)

Ativo só com `data-design="v3"` no `<html>`; v2 continua intacto até cada área migrar (F4–F5).
Ecrã de referência: abrir a app com `?lab=cockpit` (não aparece na navegação).

## Tokens (`src/styles.css`)
| Grupo | Tokens |
|---|---|
| Cor base | `--cx-bg #05070C` · tinta `--cx-ink-1/2/3` (100/74/56%) · hairline `--cx-hair` 10%, `--cx-hair-2` 16% |
| Estados | `--cx-good #3EE08F` · `--cx-warn #FFB547` · `--cx-bad #FF5D6C` |
| Luz ambiente | `--ambient`, `--ambient-rgb`, `--ambient-ink`, `--ambient-glow` — Conservador `#6CB8FF` · **Equilibrado `#38E1D6`** · Dinâmico `#FFB547` (`data-ambient`) |
| Vidro | `.cx-glass-thin` (blur 16) · `.cx-glass` (blur 28) · `.cx-glass-thick` (blur 40 + luz ambiente interior) |
| Raio | `--cx-r1..r4` = 10 / 14 / 20 / 28 |
| Sombra | `--cx-shadow-1..3` |
| Movimento | `--cx-t-micro 120` · `--cx-t-comp 200` · `--cx-t-view 300` · `--cx-t-stage 600` · `--cx-ease cubic-bezier(.23,1,.32,1)`; `prefers-reduced-motion` desliga |
| Utilitários | `.cx-eyebrow` · `.cx-focusable` (foco: escala 1,04 + contorno e brilho ambiente) · `.cx-ambient-line` |
| Tipografia | Inter Display (hero 60, display 46, números) · Inter 22 / 15 / 13 / 11 |

## Componentes (`src/components/aurora/cockpit/`)
| Componente | Função | Acessibilidade |
|---|---|---|
| `Gauge` | mostrador 270°, escala, zonas de limite, marcador de referência, agulha de aro com varrimento único (600 ms) | `role="meter"` com min/max/valor e texto |
| `Stage` | palco cinematográfico (foto ou gradiente) com véu de contraste e linha de luz ambiente | imagem decorativa `alt=""` |
| `Rail` + `Chip` | carril horizontal com foco estilo consola; o cartão ativo cresce e revela detalhe | tabindex itinerante, ← → movem, Enter abre |
| `ModeSwitch` | escolha do modo de luz ambiente (guardado no navegador) | `radiogroup`, setas |
| `AreaRail` | navegação única por áreas; a ativa expande com o nome | `nav`, `aria-current` |
| `useAmbient` | aplica e guarda o modo | — |

## Verificação G2
axe WCAG 2.2 AA: **0** · texto < 11px: **0** · 3 mostradores expostos como `meter` · teclado no carril confirmado · sem scroll horizontal a 390 px · 0 erros de JavaScript.
Capturas: `f2/g2-equilibrado.jpg`, `f2/g2-conservador.jpg`, `f2/g2-dinamico.jpg`, `f2/g2-foco.jpg`.

Nota: no modo Dinâmico a luz ambiente e o estado «Atenção» partilham o âmbar; nas áreas, as zonas de atenção levam também padrão/legenda para não depender só da cor.
