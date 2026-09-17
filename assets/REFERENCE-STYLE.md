# AADAM pattern styles — owned references (canonical)

Jack owns these patterns. **These are the styles to create patterns for.**  
When Jack asks for a new or updated animal pattern, map to the closest family below and match that construction. Prefer fidelity to these refs over generic templates.

Local copies (PDF + extracted `.txt` where noted):

| Animal family | Files | Typical size |
| --- | --- | --- |
| Kitten | `KittenKaya.pdf` / `.txt` | ~26 cm / ~10" |
| Teddy | `PatternTeddyBear.pdf` / `.txt` | ~30–32 cm / ~12" |
| Unicorn | `PatternMollytheUnicorn.pdf` / `.txt` | ~26 cm / ~10" |
| Hippo | `PatternHippoHarry.pdf` / `.txt` | ~8–15" (yarn-dependent) |
| Chinchilla | `PatternChinchilla.pdf` / `.txt` | ~21 cm / 8" incl. ears |
| Deer | `reference-deer.webp` | dangling chibi ~10" |

When Jack adds more owned PDFs: copy into `assets/`, extract text, add a section here, and wire `js/animalGenerator.js` + `js/shapes.js`.

## Pattern detail bar (required)

Every generated AADAM pattern must feel like the owned PDFs (Kaya / Harry / Marty).

**Also follow** `.cursor/rules/amigurumi-pattern-engine.mdc`: Rules A–D (flat-fold, oval symmetry, 3D cone ears, row-step validation), anti-pancake even rounds, yarn/hook scale caps, exact JAYG limb gaps.

1. Skills, notes, materials, abbreviations, tips — then **Let's start!**
2. Piece titles with (make N) when needed
3. Exact round math: `1. … (22)` and grouped evens `4-8. sc around (5 rounds) (36)`
4. Stuffing cues and placement cues inside the piece (eyes, joins, color changes)
5. Precise JAYG joins when limbs join the body — join count = fold-closure count = half the last even tube round (Rule A)
6. Assembly that finishes the toy — sculpting, embroidery, sew order
7. No notebook-sketch math cards in the crocheter-facing text

If a new animal is added, match the closest family construction **and** this detail bar.


- Chenille / dolphin / chunky plush yarn vibe; tight sc spiral; stitch markers.
- **Sitting or dangling-chibi** — not standing 4-leg stilts (except true standing animals like fox/horse).
- Large head (~35–45% of height); head sewn to body — **no long neck tube**.
- Limbs: fold-close tops; often **JAYG** into the body (or joints for Molly unicorn).
- Face: safety eyes + sculpting and/or embroidery; decorate head before sewing on when the ref does.

## Kitten (Kitten Kaya)

- **Ears:** 3D spiral cones from MR (Rule C). Flat dual-panel only if the user explicitly asks for flat ears.
- Head: muzzle shaped *inside* rounds (no sew-on snout); eye sculpting.
- Oval/chain sole legs (Rule B symmetry) → BLO → taper → fold-close (Rule A); slim arms; **thin tube tail**.
- Body joins legs early, arms near open top.

## Teddy (Marty)

- Folded dome ears; **sew-on snout** + nose; cheek shaping + needle sculpt.
- Round MR foot hind legs; arms join near top; **tiny ball tail**.
- Body wider (~42 sts family); JAYG limbs.

## Unicorn (Molly)

- Sitting — **not** a standing horse.
- Hoof-color limb tips; limbs separate (joints or sew).
- Sculpted head (early taper then face rebuild); **thin horn**; **spiral mane & tail** locks.
- Optional pastel tint.

## Hippo (Harry)

- **Chain-oval muzzle → head as ONE piece** with continuous slope (maintain width or gradual increases only — no hourglass taper-then-rebuild).
- Legs: oval feet; 2nd leg **continues into body** via chain bridge: `2×legLastRound + 2×bridge`.
- Arms JAYG near top; **tiny chain tail** on the body.
- Embroider cheeks/brows; optional nostrils/teeth.

## Chinchilla

- Size cue: ~21 cm / 8" including ears; bulky chenille + fur yarn accents.
- **Head + body ONE piece** worked feet-up (oval chain base).
- Tiny flat **feet** and **bushy fur tail** joined into the body as-you-go.
- Small unstuffed **arms sewn on**; large oval **ears** with fur edging, folded.
- Safety nose + eyes; embroider brows.

## Deer (photo)

- Dangling chibi: vertical **pear body**, 2 arms + 2 long thin legs.
- Sew-on cream muzzle; cream lower face; flat layered ears; branched antlers.

## Otter (chibi floppy water mammal)

- **Head:** solid sphere only (cap ~36 chenille / ~42 worsted) — **never** continuous snout→head.
- **Muzzle:** separate cream/white oval patch (Ch 4–5), 3–4 rounds, lightly stuffed, sew between the eyes.
- **Arms:** narrow tubes (8–10 sts), fold-close; sew close together on upper chest, paws angled inward (shell accessory).
- **Feet:** wide flat paddle from oval sole; short walls (≤6–8 rounds total); fold-close so paddles face up/forward on the body base.
- **Tail:** thick tapered cone tip→base (~half body width at base) — backrest support for the floppy body.
- **Body:** plump egg/pear; sew-on limbs (not JAYG); head sewn to open top.

## How to pick a family for a new animal

1. Same species as a ref → use that path exactly (Cat, Teddy Bear, Unicorn, Hippo, Chinchilla, Deer).
2. Else pick the closest build:
   - 3D cone ears + thin tail + sculpted face → **kitten**
   - Sew-on snout + round feet + tiny ball tail → **teddy**
   - Horn + spiral mane → **unicorn**
   - Big chain muzzle / wide mouth animal → **hippo**
   - Head+body one piece + fur bushy tail + tiny feet → **chinchilla**
   - Dangling arms/legs + pear body → **deer**
   - Floppy seated + sew-on oval muzzle + paddle feet + thick tail backrest → **otter**
3. Change only species-specific bits (ears, face, tail, horns).
4. Scale stitch counts from the user’s SPI/RPI and target height.
