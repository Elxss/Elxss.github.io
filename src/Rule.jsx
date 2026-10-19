import { useEffect, useRef, useState } from 'react'

/**
 * A rule drawn with real '-' characters, like the ones under the section
 * titles, but recomputed to stop exactly at the edge of the content column.
 */
export default function Rule({ char = '-' }) {
  const box = useRef(null)
  const ruler = useRef(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (!box.current || !ruler.current) return
      const charWidth = ruler.current.getBoundingClientRect().width / 10
      const width = box.current.getBoundingClientRect().width
      setCount(charWidth > 0 ? Math.floor(width / charWidth) : 0)
    }

    measure()
    const ro = new ResizeObserver(measure)
    if (box.current) ro.observe(box.current)
    // Font swaps change the character width after the first measure.
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [char])

  return (
    <div className="rule" ref={box}>
      <span className="ruler" ref={ruler} aria-hidden="true">
        {char.repeat(10)}
      </span>
      {char.repeat(count)}
    </div>
  )
}
