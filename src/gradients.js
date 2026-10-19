// Text gradients, in the spirit of pystyle's Colorate.Horizontal.
// Add a preset here and it is immediately usable in the buffer as
// {{some text}}(preset_name). A gradient can also be written straight from
// its colours, with every option a preset has: {{some text}}(#ff0000>#0000ff)
// or {{some text}}(#f00>#0f0>#00f*12~4). See colors() below.

export const GRADIENTS = {
  blue_to_red: ['#3b82f6', '#ef4444'],
  purple_to_blue: ['#a855f7', '#3b82f6'],
  green_to_blue: ['#22c55e', '#3b82f6'],
  red_to_yellow: ['#ef4444', '#facc15'],
  cyan_to_purple: ['#22d3ee', '#a855f7'],
  black_to_white: ['#6b7280', '#ffffff'],
  fire: ['#facc15', '#f97316', '#dc2626'],
  matrix: ['#134e13', '#22c55e', '#86efac'],
}

/**
 * A gradient between your own colours, for use wherever a preset name goes:
 * gradientBlock(LOGO, `${colors('#ff0000', '#0000ff')}*8~2`). Two colours or
 * more, as #rrggbb or #rgb.
 */
export const colors = (...list) => list.join('>')

/** The colour stops for a preset name or a '#aaa>#bbbbbb' list, or null. */
function stopsFor(name) {
  if (GRADIENTS[name]) return GRADIENTS[name]
  const list = name.split('>')
  if (list.length < 2 || !list.every((c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c))) {
    return null
  }
  // #rgb -> #rrggbb, so parse() only has one shape to read.
  return list.map((c) => (c.length === 4 ? `#${[...c.slice(1)].map((d) => d + d).join('')}` : c))
}

const hex = (n) => Math.round(n).toString(16).padStart(2, '0')

/** #rrggbb for a hue (0-360), saturation and lightness (0-1). */
function fromHsl(h, sat, light) {
  const k = (n) => (n + h / 30) % 12
  const a = sat * Math.min(light, 1 - light)
  const f = (n) => light - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return `#${[f(0), f(8), f(4)].map((v) => hex(v * 255)).join('')}`
}

/**
 * Two colours picked from a text, always the same for the same text: a
 * 32-bit FNV-1a hash of it gives the first hue, and other bits of the same
 * hash how far round the colour wheel the second one sits (90 to 210
 * degrees, so the two never look alike). Saturation and lightness are fixed
 * so both stay readable on the dark background.
 */
export function colorsFromText(text) {
  let hash = 0x811c9dc5
  for (const char of text) {
    hash ^= char.codePointAt(0)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  const first = hash % 360
  const second = (first + 90 + ((hash >>> 12) % 121)) % 360
  return [fromHsl(first, 0.75, 0.62), fromHsl(second, 0.75, 0.62)]
}

function parse(color) {
  return [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ]
}

/** A colour `t` of the way (0 to 1) from #rrggbb `a` to #rrggbb `b`. */
export function mix(a, b, t) {
  const x = parse(a)
  const y = parse(b)
  return `#${x.map((v, k) => hex(v + (y[k] - v) * t)).join('')}`
}

/** The colour at position t (0 to 1) along a list of stops. */
function sample(stops, t) {
  const span = (stops.length - 1) * Math.min(Math.max(t, 0), 1)
  const i = Math.min(Math.floor(span), stops.length - 2)
  const frac = span - i
  const a = parse(stops[i])
  const b = parse(stops[i + 1])
  return `#${a.map((v, k) => hex(v + (b[k] - v) * frac)).join('')}`
}

// Diagonal directions, named after the corner the ramp starts from:
// [starts on the right, starts at the bottom].
const CORNERS = {
  diagonal: [false, false],
  'top-left': [false, false],
  'top-right': [true, false],
  'bottom-left': [false, true],
  'bottom-right': [true, true],
}

/**
 * One solid colour per character, the way pystyle colours a string: a letter
 * is never itself a gradient, the gradient happens across the letters.
 *
 * Without a cycle the ramp is stretched over the whole text. With one, it
 * repeats every `cycle` units; the stops are mirrored first (A->B->A) so
 * repetitions join without a hard seam.
 *
 * With `groups`, the ramp is cut into that many equal steps and each step is
 * one unit sharing a single colour. `cycle` then counts steps, not letters.
 *
 * `block` places the text inside a multi-line drawing ({ direction, row,
 * rows, skew }) so the ramp can run top to bottom ('vertical') or from one
 * corner to the opposite one ('top-left', 'top-right', 'bottom-left',
 * 'bottom-right': the corner where the first colour sits; 'diagonal' is
 * 'top-left'), like pystyle's Colorate.Vertical and Colorate.Diagonal.
 * For a corner, `skew` is how many letters one line is worth (default 2); for
 * 'horizontal' it shifts each line, see positionOf below.
 *
 * `offset` slides the ramp by that many units (fractions allowed), which is
 * how a moving gradient is animated. A moving ramp needs to wrap around, so
 * without a cycle it becomes one A->B->A cycle over the whole text.
 */
export function gradientColors(name, length, cycle, groups, block, offset = 0) {
  const stops = stopsFor(name)
  if (!stops || length <= 0) return null

  // Where each letter sits along the ramp, out of `count` positions.
  const direction = block?.direction || 'horizontal'
  const rows = block?.rows || 1
  const row = block?.row || 0
  const skew = block?.skew || 0
  let count = length
  // With a skew, line N starts its ramp N * skew letters further right; the
  // letters before that margin wrap around and show the end of the ramp.
  let positionOf = (i) => (((i - row * skew) % length) + length) % length
  if (direction === 'vertical') {
    count = rows
    positionOf = () => row
  } else if (CORNERS[direction]) {
    // A line is about twice as tall as a letter is wide, so by default a row
    // weighs two columns: that keeps the bands close to 45 degrees on screen.
    const [fromRight, fromBottom] = CORNERS[direction]
    const slope = skew || 2
    const y = fromBottom ? rows - 1 - row : row
    count = length + slope * (rows - 1)
    positionOf = (i) => (fromRight ? length - 1 - i : i) + slope * y
  }

  const units = groups ? Math.min(groups, count) : count
  const unitOf = (p) => (groups ? Math.floor((p * units) / count) : p)

  if (offset && !cycle) cycle = units
  // Steps stay solid: a grouped ramp moves one whole step at a time.
  const shift = groups ? Math.floor(offset) : offset

  let unitColor
  if (!cycle) {
    unitColor = (u) => sample(stops, units === 1 ? 0 : u / (units - 1))
  } else {
    const mirrored = [...stops, ...stops.slice(0, -1).reverse()]
    unitColor = (u) => {
      const at = (((u - shift) % cycle) + cycle) % cycle
      return sample(mirrored, at / cycle)
    }
  }

  return Array.from({ length }, (_, i) => unitColor(unitOf(positionOf(i))))
}
