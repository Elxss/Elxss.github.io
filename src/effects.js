import { mix } from './gradients.js'

// Extra animations for a gradient span, picked with !name at the end of its
// spec: {{text}}(preset!shine). They run on top of the colours the gradient
// already gives each letter, and take the time in seconds from useClock.
// Each one gets the letters, their colours, the time and the span, and
// returns new letters and colours, same length, so the line never changes
// width.

const GLYPHS = '!<>-_\\/[]{}=+*^?#%&$@01'

// A cheap repeatable random number in [0, 1) for (a, b): the same frame
// always scrambles the same way, so a re-render does not flicker extra.
function noise(a, b) {
  let h = Math.imul(a + 1, 374761393) ^ Math.imul(b + 1, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

const glyph = (a, b) => GLYPHS[Math.floor(noise(a, b) * GLYPHS.length)]

export const EFFECTS = {
  // A white glint runs across the text every few seconds. Spans chained
  // with !shine.name (see chainGradients in buffer.js) share one glint: it
  // runs through them in order, as if they were one text, so it leaves the
  // last letter of a line for the first letter of the next.
  shine(chars, colors, time, span) {
    const offset = span?.chain?.offset ?? 0
    const total = span?.chain?.total ?? chars.length
    const lettersPerSecond = 50
    const sweep = Math.max(0.9, (total + 6) / lettersPerSecond)
    const period = sweep + 2.6
    const at = time % period
    if (at > sweep) return { chars, colors }
    const front = (at / sweep) * (total + 6) - 3 - offset
    return {
      chars,
      colors: colors.map((color, i) => {
        const near = Math.max(0, 1 - Math.abs(i - front) / 2.5)
        return mix(color, '#ffffff', near * 0.85)
      }),
    }
  },

  // The whole text slowly breathes, brighter then back.
  pulse(chars, colors, time) {
    const glow = (1 - Math.cos((time / 2.8) * Math.PI * 2)) / 2
    return { chars, colors: colors.map((color) => mix(color, '#ffffff', glow * 0.45)) }
  },

  // Short bursts of corruption: some letters turn into symbols in the other
  // end's colour for a fraction of a second, then it snaps back.
  glitch(chars, colors, time) {
    const period = 3.2
    const burst = 0.35
    if (time % period > burst) return { chars, colors }
    const frame = Math.floor(time * 20)
    const out = { chars: [...chars], colors: [...colors] }
    chars.forEach((char, i) => {
      if (char === ' ' || noise(frame, i) > 0.35) return
      out.chars[i] = glyph(frame + 7, i)
      out.colors[i] = colors[colors.length - 1 - i]
    })
    return out
  },

  // Every few seconds the text is scrambled, then decoded letter by letter
  // from left to right, like a password cracker landing each character.
  decrypt(chars, colors, time) {
    const period = 6
    const scrambled = 0.4
    const decode = 0.08 // seconds per letter
    const at = time % period
    const solved = at < scrambled ? 0 : Math.floor((at - scrambled) / decode)
    if (solved >= chars.length) return { chars, colors }
    const frame = Math.floor(time * 20)
    return {
      chars: chars.map((char, i) => (i < solved || char === ' ' ? char : glyph(frame, i))),
      colors: colors.map((color, i) => (i < solved ? color : mix(color, '#ffffff', 0.5))),
    }
  },
}
