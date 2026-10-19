import { useLayoutEffect, useRef, useState } from 'react'

// Scroll speed, in characters per second. The line moves in small steps
// (see SUBSTEPS), like a terminal, instead of gliding.
const SPEED = 3
// Blank characters between the end of the text and its next copy. Must match
// the padding-right of .marquee-track.moving .marquee-text (in ch).
const GAP = 4
// Moves per letter: 1 is a hard terminal jump, 2 moves half a letter at a
// time, which reads smoother while keeping the stepped look.
const SUBSTEPS = 2

/**
 * One line of text that scrolls in a loop when it is wider than its box, and
 * sits still when it fits. The text is drawn twice back to back so the loop
 * has no jump. `still` holds it at the start, e.g. while the text is being
 * rewritten, so the change can be watched.
 */
export default function Marquee({ className = '', still = false, children, ...rest }) {
  const boxRef = useRef(null)
  const textRef = useRef(null)
  const [steps, setSteps] = useState(0) // letters per loop; 0 means it fits

  useLayoutEffect(() => {
    const box = boxRef.current
    const text = textRef.current
    if (!box || !text) return undefined

    const measure = () => {
      // Leave out the gap added while scrolling, or a line that fits again
      // after a resize would keep scrolling.
      const gap = parseFloat(getComputedStyle(text).paddingRight) || 0
      const width = text.scrollWidth - gap
      const letters = [...text.textContent].length
      setSteps(!still && width > box.clientWidth ? letters + GAP : 0)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    observer.observe(text)
    return () => observer.disconnect()
  }, [children, still])

  return (
    <div ref={boxRef} className={`marquee ${className}`} {...rest}>
      <div
        className={steps ? 'marquee-track moving' : 'marquee-track'}
        style={
          steps
            ? {
                animationDuration: `${steps / SPEED}s`,
                animationTimingFunction: `steps(${steps * SUBSTEPS})`,
              }
            : undefined
        }
      >
        <span ref={textRef} className="marquee-text">
          {children}
        </span>
        {steps > 0 && (
          <span className="marquee-text" aria-hidden="true">
            {children}
          </span>
        )}
      </div>
    </div>
  )
}
