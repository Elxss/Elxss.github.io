import { useCallback, useEffect, useState } from 'react'

/**
 * A block scrollbar for an element that scrolls. It is drawn as one cell per
 * visible text row, filled like the inverted title bar, so it lines up with
 * the buffer instead of looking like a browser widget.
 */
export default function ScrollBar({ targetRef, watch }) {
  const [bar, setBar] = useState({ rows: 0, start: 0, size: 0, active: false })

  useEffect(() => {
    const el = targetRef.current
    if (!el) return undefined

    const measure = () => {
      const styles = getComputedStyle(el)
      const lineHeight =
        parseFloat(styles.lineHeight) || parseFloat(styles.fontSize) * 1.35
      const rows = Math.max(1, Math.floor(el.clientHeight / lineHeight))
      const visible = el.clientHeight / el.scrollHeight

      if (visible >= 1) {
        setBar({ rows, start: 0, size: 0, active: false })
        return
      }

      const size = Math.max(1, Math.round(rows * visible))
      const travel = rows - size
      const progress = el.scrollTop / (el.scrollHeight - el.clientHeight)
      setBar({ rows, size, start: Math.round(travel * progress), active: true })
    }

    measure()
    el.addEventListener('scroll', measure, { passive: true })
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', measure)
      ro.disconnect()
    }
  }, [targetRef, watch])

  const jumpTo = useCallback(
    (row) => {
      const el = targetRef.current
      if (!el || !bar.active) return
      const fraction = row / Math.max(1, bar.rows - 1)
      el.scrollTo({ top: fraction * (el.scrollHeight - el.clientHeight) })
    },
    [targetRef, bar.active, bar.rows],
  )

  return (
    <div className="nano-scroll" aria-hidden="true">
      {Array.from({ length: bar.rows }, (_, row) => {
        const onThumb =
          bar.active && row >= bar.start && row < bar.start + bar.size
        return (
          <div
            key={row}
            className={`cell${onThumb ? ' thumb' : ''}`}
            onMouseDown={() => jumpTo(row)}
          >
            {'\u00a0'}
          </div>
        )
      })}
    </div>
  )
}
