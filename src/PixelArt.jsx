import { useEffect, useRef, useState } from 'react'

import useClock from './useClock.js'

// Shimmer: every colour group of the drawing runs a gradient from its own
// colour to a lighter shade of the same hue (same saturation, only more
// light, so green stays a vivid green instead of fading to pastel), and the
// gradient slides diagonally across the drawing.
const SHIMMER = {
  cycle: 24, // cells per own > lighter > own gradient, along the diagonal
  speed: 5, // cells a second
  lighten: 0.16, // how much lighter the light end is (HSL lightness, 0 to 1)
  levels: 8, // shades between the two ends
  rate: 10, // redraws a second
}
// Outlines stay put: black has no hue to lighten, it would only turn grey.
const STILL = new Set(['#000000'])

const hex2 = (n) => Math.round(n * 255).toString(16).padStart(2, '0')

/** #rrggbb to [h (0-360), s, l (0-1)]. */
function toHsl(color) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

/** [h, s, l] back to #rrggbb. */
function fromHsl([h, s, l]) {
  const k = (n) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return `#${[f(0), f(8), f(4)].map(hex2).join('')}`
}

const shades = new Map()
/** `color` with `level` (0 to 1) of SHIMMER.lighten more lightness, cached. */
function shade(color, level) {
  const key = `${color}${level}`
  if (!shades.has(key)) {
    const [h, s, l] = toHsl(color)
    // Never darker than the colour itself (white is already past the cap).
    shades.set(key, fromHsl([h, s, Math.max(l, Math.min(0.92, l + level * SHIMMER.lighten))]))
  }
  return shades.get(key)
}

// The corner the gradient starts from, as for gradientBlock in buffer.js:
// [starts on the right, starts at the bottom]. It slides away from it.
const CORNERS = {
  'top-left': [false, false],
  'top-right': [true, false],
  'bottom-left': [false, true],
  'bottom-right': [true, true],
}

/** The rows with every colour cell shimmered for `time`, merged into runs. */
function shimmer(rows, time, corner) {
  const { cycle, speed, levels } = SHIMMER
  const [fromRight, fromBottom] = CORNERS[corner] || CORNERS['top-left']
  const width = Math.max(...rows.map((runs) => runs.reduce((n, run) => n + run.n, 0)))
  return rows.map((runs, row) => {
    const y = fromBottom ? rows.length - 1 - row : row
    const out = []
    let x = 0
    for (const run of runs) {
      for (let i = 0; i < run.n; i += 1, x += 1) {
        let color = run.color
        if (color && !STILL.has(color) && !run.glyph) {
          // Triangle wave along the diagonal from the start corner: 0 is the
          // own colour, 1 the lightest.
          const across = fromRight ? width - 1 - x : x
          const phase = (across + y - time * speed) / cycle
          const wave = 1 - Math.abs(2 * (phase - Math.floor(phase)) - 1)
          color = shade(color, Math.round(wave * (levels - 1)) / (levels - 1))
        }
        const last = out[out.length - 1]
        if (last && last.color === color && !run.glyph && !last.glyph) last.n += 1
        else out.push({ ...run, n: 1, color })
      }
    }
    return out
  })
}

/**
 * Whether `ref` is in view (a little before it comes in, so the drawing is
 * already moving when it arrives). A drawing off screen is redrawn ten times
 * a second for nobody, and the page holds several of them: a shimmer is only
 * worth its cost while it can be seen.
 */
function useOnScreen(ref, watch) {
  const [seen, setSeen] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!watch || !el || typeof IntersectionObserver !== 'function') return undefined
    const watcher = new IntersectionObserver(
      ([entry]) => setSeen(entry.isIntersecting),
      { rootMargin: '200px' },
    )
    watcher.observe(el)
    return () => watcher.disconnect()
  }, [ref, watch])
  return seen
}

/**
 * Pixel art in text: rows of { n, color } runs (see pixelRows in buffer.js).
 * A run may also set `glyph` (the two characters of each of its pixels, '██'
 * by default) and `background` (its colour by default), for a textured cell
 * such as '▓▓' in colour on black.
 * A pixel is two monospace cells wide (2ch) and as tall as it is wide, so
 * it is square with any font; drawing it as two '██' glyphs at a line height
 * of 1 made every pixel about 20% wider than tall, and the art looked
 * squashed. The blocks stay in the text, so copying the page still gives the
 * drawing; the colour comes from the background, not the glyphs.
 * With `shimmer`, each colour group runs an animated gradient (SHIMMER);
 * give it a corner ('bottom-right'...) to change where the gradient starts.
 */
export default function PixelArt({ rows, shimmer: animated = false }) {
  const box = useRef(null)
  const onScreen = useOnScreen(box, Boolean(animated))
  const time = useClock(Boolean(animated) && onScreen, SHIMMER.rate)
  // `shimmer` is true (from the top left) or the corner to start from.
  const corner = typeof animated === 'string' ? animated : 'top-left'
  const drawn = animated && time > 0 ? shimmer(rows, time, corner) : rows

  return (
    <div className="pixel-art" ref={box}>
      {drawn.map((runs, r) => (
        <div key={r} className="pixel-row">
          {runs.map((run, k) =>
            run.color ? (
              <span
                key={k}
                className="pixel-run"
                style={{ color: run.color, background: run.background ?? run.color }}
              >
                {(run.glyph ?? '██').repeat(run.n)}
              </span>
            ) : (
              <span key={k} className="pixel-run">
                {'  '.repeat(run.n)}
              </span>
            ),
          )}
        </div>
      ))}
    </div>
  )
}
