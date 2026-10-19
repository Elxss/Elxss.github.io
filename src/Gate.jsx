import { useEffect, useRef, useState } from 'react'
import { PROFILE } from './cv.js'
import './gate.css'

// Typed into the little terminal of the first choice.
const PROMPT = 'elxss@web:~$'
const COMMAND = 'nano whoami.txt'
// Milliseconds per character, and the pause before typing starts.
const TYPE_MS = 85
const START_MS = 500

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** The command, typed out once, then left with a blinking cursor. */
function useTyped(text) {
  const [count, setCount] = useState(() => (reducedMotion() ? text.length : 0))

  useEffect(() => {
    if (count >= text.length) return undefined
    const timer = setTimeout(() => setCount(count + 1), count === 0 ? START_MS : TYPE_MS)
    return () => clearTimeout(timer)
  }, [count, text])

  return text.slice(0, count)
}

export default function Gate({ onChoose }) {
  const first = useRef(null)
  const typed = useTyped(COMMAND)

  useEffect(() => {
    first.current?.focus()
  }, [])

  return (
    <div className="gate">
      <div className="gate-inner">
        <p className="gate-who">{PROFILE.name}</p>
        <h1>Are you comfortable in a Unix terminal?</h1>

        <div className="gate-choices">
          <button
            ref={first}
            type="button"
            className="gate-choice gate-choice-unix"
            onClick={() => onChoose('nano')}
          >
            <span className="gate-screen" aria-hidden="true">
              <span className="gate-prompt">{PROMPT}</span> {typed}
              <span className="gate-cursor" />
            </span>
            <span className="gate-title">Yes, open the terminal version</span>
            <span className="gate-desc">The fun one.</span>
          </button>

          <button type="button" className="gate-choice" onClick={() => onChoose('standard')}>
            <span className="gate-title">No, open the standard version</span>
            <span className="gate-desc">A plain CV page.</span>
          </button>
        </div>

        <p className="gate-note">Either way, you can switch from the page itself.</p>
      </div>
    </div>
  )
}
