import { useMemo } from 'react'
import qrcode from 'qrcode-generator'
import PixelArt from './PixelArt.jsx'
import { gradientColors } from './gradients.js'
import useClock from './useClock.js'

// The frame and the QR's light cells share one animated gradient, violet to
// pale violet, sliding diagonally like the gradients on the page. The QR's dark
// cells stay black: its light cells must be the lighter ones for phones to
// read it, so the usual polarity is kept, a coloured background under a black
// pattern.
const GRADIENT = '#8b5cf6>#ddd6fe'
const CYCLE = 16 // cells per violet > pale > violet wave
const SPEED = 6 // cells a second
// Light margin around the code, in cells: scanners need one to find it.
const QUIET = 2
// Then a black gap, then the frame: a ring of shaded ASCII cells.
const GAP = 1
const FRAME = '\u2593\u2593' // ▓▓

/** The address to open on the phone: this page, without any query string. */
const pageUrl = () => `${location.origin}${location.pathname}`

/**
 * A QR code of the site, in the middle of the screen, in a black square
 * framed in red ASCII. Drawn as pixel art in text (PixelArt.jsx). Closes on
 * a click outside it; App.jsx closes it on Esc and ^S too.
 */
export default function QrOverlay({ onClose }) {
  const url = pageUrl()

  // What each cell is: 'frame', 'gap' (black), 'light' or 'dark'.
  const cells = useMemo(() => {
    const qr = qrcode(0, 'M')
    qr.addData(url)
    qr.make()
    const count = qr.getModuleCount()
    const edge = 1 + GAP + QUIET // cells between the outside and the code
    const size = count + edge * 2
    return Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => {
        if (x === 0 || y === 0 || x === size - 1 || y === size - 1) return 'frame'
        if (x <= GAP || y <= GAP || x >= size - 1 - GAP || y >= size - 1 - GAP) return 'gap'
        const cx = x - edge
        const cy = y - edge
        const inCode = cx >= 0 && cy >= 0 && cx < count && cy < count
        return inCode && qr.isDark(cy, cx) ? 'dark' : 'light'
      }),
    )
  }, [url])

  // The gradient moves, so the colours are worked out on every tick.
  const time = useClock(true)
  const size = cells.length
  const rows = cells.map((row, y) => {
    const colors = gradientColors(
      GRADIENT,
      size,
      CYCLE,
      0,
      { direction: 'top-left', row: y, rows: size, skew: 1 },
      time * SPEED,
    )
    return row.map((kind, x) => {
      if (kind === 'frame') return { n: 1, color: colors[x], glyph: FRAME, background: '#000000' }
      if (kind === 'light') return { n: 1, color: colors[x] }
      return { n: 1, color: '#000000' }
    })
  })

  // A cell is 2ch wide and as tall; the whole square takes about half of the
  // smaller side of the screen, never more than 320px.
  const side = 'min(55vw, 45vh, 320px)'
  const fontSize = `calc(${side} / ${size * 1.25})`

  return (
    <div className="qr-overlay" role="dialog" aria-label="QR code of this site" onClick={onClose}>
      <div className="qr-box" onClick={(e) => e.stopPropagation()}>
        <div className="qr-code" style={{ fontSize }}>
          <PixelArt rows={rows} />
        </div>
        <p className="qr-caption">Scan to open on your phone</p>
      </div>
    </div>
  )
}
