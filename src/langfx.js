// The animation played when the page changes language. Pick one here:
//
//   'scramble'  every letter turns into a random symbol, then the text is
//               decoded from left to right   <- the original
//   'wipe'      the page is blocked out, then wiped back in through ░▒▓█,
//               the same soft-edged pass the song title uses (useRetype.js)
//   'none'      the text simply swaps, no animation at all
//
// The three below are the discreet ones: the page stays readable throughout,
// only a small part of it is disturbed at any moment.
//
//   'band'      a narrow band of blocks sweeps across each line
//   'dissolve'  a light dither over everything, resolving left to right
//   'wave'      'scramble' confined to a moving front
//
export const LANG_ANIM = 'wipe'

// Characters that are never animated: spaces and newlines keep the layout,
// and █ belongs to the drawings rather than to any language.
const KEEP = new Set([' ', '\n', '█'])

// How long every letter stays a symbol, how long the decoding takes (ms),
// and the symbols used, those of the !decrypt effect.
const SCRAMBLE = { hold: 300, decode: 900, glyphs: '!<>-_\\/[]{}=+*^?#%&$@01' }

// The text first thickens into blocks over `fade` (through ░▒▓█, so the
// fade is four visible steps rather than a smooth dissolve), holds solid for
// `hold`, then is revealed letter by letter over `reveal`.
const WIPE = { fade: 260, hold: 140, reveal: 900, shades: '░▒▓█' }

/**
 * A fixed number in [0, 1) for a character position: the same letter always
 * thickens at the same moment, so a re-render never makes the page shimmer.
 * Without it every letter would step up together and the fade would read as
 * three flashes; scattered, it reads as the text clotting into blocks.
 */
function jitter(i) {
  let h = Math.imul(i + 1, 374761393)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** `text` scrambled, `t` ms into the animation. */
function scrambleFrame(text, t) {
  const solved = t < SCRAMBLE.hold ? 0 : ((t - SCRAMBLE.hold) / SCRAMBLE.decode) * text.length
  let out = ''
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    out +=
      i < solved || KEEP.has(char)
        ? char
        : SCRAMBLE.glyphs[Math.floor(Math.random() * SCRAMBLE.glyphs.length)]
  }
  return out
}

/**
 * `text` mid-wipe, `t` ms in. The front is placed as a fraction of the
 * line's own length, so every line of the page finishes together however
 * long it is — what makes this a page animation rather than many.
 */
function wipeFrame(text, t) {
  const edge = WIPE.shades.length

  // Phase 1: the blocks thicken in, each letter on its own beat.
  if (t < WIPE.fade) {
    const grown = (t / WIPE.fade) * edge
    let out = ''
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i]
      out += KEEP.has(char)
        ? char
        : WIPE.shades[Math.max(0, Math.min(edge - 1, Math.floor(grown + jitter(i))))]
    }
    return out
  }

  const progress = t < WIPE.fade + WIPE.hold ? 0 : (t - WIPE.fade - WIPE.hold) / WIPE.reveal
  const front = progress * (text.length + edge)
  let out = ''
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (KEEP.has(char)) {
      out += char
      continue
    }
    // Ahead of the front the letter is still fully covered; behind it, it
    // fades up through ▓ ▒ ░ before the letter itself lands.
    // -1 at front 0, so nothing is uncovered until the front moves.
    const level = Math.floor(front - i) - 1
    out +=
      level < 0
        ? WIPE.shades[edge - 1]
        : level < edge - 1
          ? WIPE.shades[edge - 2 - level]
          : char
  }
  return out
}

/* --- the discreet three --- */

// Width of a sweeping front, in characters, and how long a sweep takes.
const BAND = { ms: 700, width: 5 }
const DISSOLVE = { ms: 700 }
const WAVE = { ms: 700, width: 7 }

/**
 * Where a front sits at time `t`: it starts `width` before the first letter
 * and ends `width` past the last, so the first and last characters get the
 * whole band over them rather than half of it.
 */
const frontAt = (t, ms, length, width) => (t / ms) * (length + width * 2) - width

/** A band of blocks passing over otherwise untouched text. */
function bandFrame(text, t) {
  const edge = WIPE.shades.length
  const front = frontAt(t, BAND.ms, text.length, BAND.width)
  let out = ''
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const away = Math.abs(i - front)
    // Darkest at the middle of the band, fading to plain text at its edges.
    out +=
      KEEP.has(char) || away > BAND.width
        ? char
        : WIPE.shades[Math.min(edge - 1, Math.floor((1 - away / BAND.width) * edge))]
  }
  return out
}

/**
 * Every letter sits under a light shade and comes back at its own moment:
 * mostly left to right, with `jitter` scattering the order so the front is
 * ragged rather than a ruler edge.
 */
function dissolveFrame(text, t) {
  const progress = t / DISSOLVE.ms
  let out = ''
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (KEEP.has(char)) {
      out += char
      continue
    }
    const due = (i / text.length) * 0.7 + jitter(i) * 0.3
    // Two shades only: this one never blocks the page out.
    out += progress > due ? char : WIPE.shades[Math.floor(jitter(i * 7 + 3) * 2)]
  }
  return out
}

/** The scramble, but only the letters the front is currently passing over. */
function waveFrame(text, t) {
  const front = frontAt(t, WAVE.ms, text.length, WAVE.width)
  let out = ''
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    out +=
      KEEP.has(char) || Math.abs(i - front) > WAVE.width
        ? char
        : SCRAMBLE.glyphs[Math.floor(Math.random() * SCRAMBLE.glyphs.length)]
  }
  return out
}

// `ms` is how long the whole thing runs; `frame` draws one line of it.
const ANIMATIONS = {
  scramble: { ms: SCRAMBLE.hold + SCRAMBLE.decode, frame: scrambleFrame },
  wipe: { ms: WIPE.fade + WIPE.hold + WIPE.reveal, frame: wipeFrame },
  band: { ms: BAND.ms, frame: bandFrame },
  dissolve: { ms: DISSOLVE.ms, frame: dissolveFrame },
  wave: { ms: WAVE.ms, frame: waveFrame },
  none: null,
}

/** The chosen animation, or null when the text just swaps. */
export const LANG_FX = ANIMATIONS[LANG_ANIM] ?? null
