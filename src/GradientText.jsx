import { gradientColors } from './gradients.js'
import { EFFECTS } from './effects.js'
import useClock from './useClock.js'

/**
 * A {{text}}(preset) span: one solid colour per character. With a speed
 * (preset~N) the ramp slides N units a second; with an effect (preset!name,
 * see effects.js) it is animated on top. Only this span re-renders.
 */
export default function GradientText({ text, start, span, hit }) {
  const effect = EFFECTS[span.effect]
  // A grouped ramp (/N) moves one whole step at a time, `speed` steps a
  // second: re-rendering more often than that would redraw the same colours.
  const rate = !effect && span.groups && span.speed > 0 ? span.speed : undefined
  const time = useClock(span.speed > 0 || Boolean(effect), rate)
  let chars = [...text]
  let colors = gradientColors(
    span.gradient,
    chars.length,
    span.cycle,
    span.groups,
    span.block,
    time * (span.speed || 0),
  )
  // time stays 0 when motion is reduced: show the plain gradient then, not
  // a frozen first frame of the effect.
  if (effect && colors && time > 0) ({ chars, colors } = effect(chars, colors, time, span))

  // Neighbouring letters of the same colour share one element, and spaces
  // join whatever run they are in (they show no colour). A grouped logo row
  // is then a dozen elements instead of ninety, which is what keeps big
  // animated drawings smooth.
  const runs = []
  chars.forEach((char, c) => {
    const at = start + c
    if (hit && at >= hit.start && at < hit.end) {
      runs.push({ mark: true, text: char })
      return
    }
    const color = colors ? colors[c] : undefined
    const last = runs[runs.length - 1]
    if (last && !last.mark && (char === ' ' || last.color === color)) {
      last.text += char
      if (char !== ' ') last.blank = false
    } else if (last && !last.mark && last.blank) {
      // A run made only of spaces takes the colour of what follows.
      last.text += char
      last.color = color
      last.blank = false
    } else {
      runs.push({ text: char, color, blank: char === ' ' })
    }
  })

  return (
    <span className="gradient-text">
      {runs.map((run, r) =>
        run.mark ? (
          <mark key={r}>{run.text}</mark>
        ) : (
          <span key={r} style={run.color ? { color: run.color } : undefined}>
            {run.text}
          </span>
        ),
      )}
    </span>
  )
}
