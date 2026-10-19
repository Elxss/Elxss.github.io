import { useEffect, useRef, useState } from 'react'

// The wipe front fades in through these, lightest first, before a letter is
// fully masked; the typing front fades back out through them in reverse.
const SHADES = ['░', '▒', '▓', '█']
// Milliseconds between one letter and the next, for each of the two passes.
const STEP_MS = 22

const reducedMotion = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Show `target`, and when it changes, swap it in letter by letter: the old
 * text is first covered by blocks from left to right (as far as the longer of
 * the two texts), then the blocks are replaced by the new text, also from
 * left to right. Each front is a soft edge (░▒▓█) rather than a hard cut. The
 * first value (from empty) gets the same treatment. `busy` is true while
 * this runs.
 *
 * Driven by requestAnimationFrame and the elapsed time, not a timer count, so
 * it keeps an even pace even when frames are late.
 */
export default function useRetype(target) {
  const [shown, setShown] = useState(target)
  const [busy, setBusy] = useState(false)
  const current = useRef(target)

  useEffect(() => {
    const from = current.current
    current.current = target
    if (!target || from === target || reducedMotion()) {
      setShown(target)
      setBusy(false)
      return undefined
    }

    // Both passes run over the longer of the two texts, so the blocks already
    // cover the full new length before typing starts: the line never jumps.
    const width = Math.max(from.length, target.length)
    const edge = SHADES.length
    // A pass is over once its front, soft edge included, has crossed every
    // letter.
    const pass = width + edge - 1

    const frame = (step) => {
      let text = ''
      for (let i = 0; i < width; i += 1) {
        if (step < pass) {
          // Pass 1: the old letter, then ░ ▒ ▓ █ as the front goes over it.
          const level = step - i
          text += level < 0 ? from[i] || '' : SHADES[Math.min(level, edge - 1)]
        } else {
          // Pass 2: █, then ▓ ▒ ░, then the new letter (nothing past its end).
          const level = step - pass - i
          text +=
            level < 0
              ? SHADES[edge - 1]
              : level < edge - 1
                ? SHADES[edge - 2 - level]
                : target[i] || ''
        }
      }
      return text
    }

    setBusy(true)
    let start = null
    let last = -1
    let raf = requestAnimationFrame(function tick(now) {
      if (start === null) start = now
      const step = Math.floor((now - start) / STEP_MS)
      if (step >= pass * 2) {
        setShown(target)
        setBusy(false)
        return
      }
      if (step !== last) {
        last = step
        setShown(frame(step))
      }
      raf = requestAnimationFrame(tick)
    })

    return () => cancelAnimationFrame(raf)
  }, [target])

  return { text: shown, busy }
}
