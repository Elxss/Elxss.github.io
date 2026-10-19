import useClock from './useClock.js'

// The glyph sequences a `sparkle` link can be framed with. `still` is the
// frame shown when motion is reduced — a chosen one, not whatever frame 0
// happens to be. `offset` shifts the right-hand glyph by that fraction of a
// cycle, so a pair reads as two independent lights rather than one symmetry.
const SPINNERS = {
  // Claude Code's working spinner, played forward then back so it breathes.
  sparkle: {
    frames: ['·', '✢', '✳', '✶', '✻', '✽', '✽', '✻', '✶', '✳', '✢', '·'],
    rate: 8,
    still: '✻',
    offset: 0,
  },
  // A slower twinkle that blinks out entirely on its last frame.
  twinkle: {
    frames: ['˙', '·', '✦', '✧', '✦', '·', '˙', ' '],
    rate: 6,
    still: '✦',
    offset: 0,
  },
}

/**
 * One spinner glyph. `kind` names a sequence above; `second` marks the
 * right-hand glyph of a pair, which runs its sequence's offset ahead.
 */
export default function Sparkle({ kind = 'sparkle', second = false }) {
  const spec = SPINNERS[kind] || SPINNERS.sparkle
  const time = useClock(true, spec.rate)
  const shift = second ? spec.offset * spec.frames.length : 0
  const glyph =
    time > 0 ? spec.frames[Math.round(time * spec.rate + shift) % spec.frames.length] : spec.still
  return (
    <span className="sparkle" aria-hidden="true">
      {glyph}
    </span>
  )
}
