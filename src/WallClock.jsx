import { useEffect, useState } from 'react'

const format = (date) =>
  [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')

/** The visitor's time, HH:MM:SS, ticking on each new second. */
export default function WallClock({ className }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timer
    // Wait for the next whole second each time, so the display never drifts
    // half a second behind the real clock.
    const tick = () => {
      setNow(new Date())
      timer = setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    timer = setTimeout(tick, 1000 - (Date.now() % 1000))
    return () => clearTimeout(timer)
  }, [])

  return (
    <time className={className} dateTime={now.toISOString()}>
      {format(now)}
    </time>
  )
}
