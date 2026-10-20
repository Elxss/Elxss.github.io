import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { contentFor, formatPeriod, sectionsFor } from './cv.js'
import { READY, ui } from './i18n.js'
import { LANGUAGES } from './buffer.js'
import { EMAIL, LINKS } from './actions.js'
import { COLUMN, GLOBE, PALETTE, TREE } from './icons.js'
import './standard.css'

const RESUME = '/documents/cv_elias.pdf'
// Left in English whatever the language, on purpose, as is the credit under it.
const FOOTER_LINE = 'If the sun is still rising, there is still hope.'

// A drawing from icons.js as runs of one colour per row, for PixelSvg.
const toRuns = (drawing) =>
  drawing.map((row) =>
    [...row.matchAll(/(.)\1*/g)].map(([run, key]) => ({
      n: run.length,
      color: key === '.' ? null : PALETTE[key],
    })),
  )

// The favicon tree: the same mark as the tab and the top of the terminal view.
const TREE_RUNS = toRuns(TREE)
// The globe and its proverb, as under Interests in the terminal view.
const GLOBE_RUNS = toRuns(GLOBE)
// Beside the recommendation, in the room its quote leaves on the right.
const COLUMN_RUNS = toRuns(COLUMN)

/**
 * Pixel art as SVG, one rect per run. PixelArt draws with text, and at the few
 * pixels a logo is tall the browser rounds every run's glyph width: rows grew
 * wider than tall and slid apart, and the tree leaned as if in a gale. Rects
 * scale to any size exactly.
 */
function PixelSvg({ rows, className }) {
  const width = Math.max(...rows.map((runs) => runs.reduce((n, run) => n + run.n, 0)))
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rows.flatMap((runs, y) => {
        let x = 0
        return runs.map((run, k) => {
          const rect = run.color && (
            <rect key={`${y}-${k}`} x={x} y={y} width={run.n} height={1} fill={run.color} />
          )
          x += run.n
          return rect
        })
      })}
    </svg>
  )
}

/**
 * Titles dealt into `count` rows of near-equal length, longest first onto the
 * shortest row, each row keeping the list's order. Justified, the rows then
 * end flush on both sides and the block reads as a rectangle.
 */
function balancedRows(titles, count) {
  const cap = Math.ceil(titles.length / count)
  const rows = Array.from({ length: count }, () => ({ len: 0, items: [] }))
  titles
    .map((title, i) => ({ title, i }))
    .sort((a, b) => b.title.length - a.title.length)
    .forEach((item) => {
      const row = rows
        .filter((r) => r.items.length < cap)
        .reduce((a, b) => (b.len < a.len ? b : a))
      row.len += item.title.length
      row.items.push(item)
    })
  return rows
    .filter((r) => r.items.length)
    .map((r) => r.items.sort((a, b) => a.i - b.i).map((item) => item.title))
}

const yearOf = (text) => String(text ?? '').match(/\d{4}/)?.[0]

/** Years only: "2026", "2023 — 2026", "2026 — now"; a date without a year as written. */
function period(entry, now) {
  if (entry.date) return yearOf(entry.date) ?? entry.date
  const from = yearOf(entry.from)
  const to = yearOf(entry.to)
  if (!from) return formatPeriod(entry)
  if (!to) return `${from} — ${now}`
  return from === to ? from : `${from} — ${to}`
}

/** "ESSEC Business School, Cergy-Pontoise" -> ["ESSEC Business School", "Cergy-Pontoise"]. */
function splitPlace(place) {
  const [name, ...rest] = String(place ?? '').split(/,\s*/)
  return [name, rest.at(-1)]
}

/** "Stack: Java, Python" -> "Java, Python". */
const afterLabel = (text) => String(text ?? '').replace(/^[^:]*:\s*/, '')

const newestFirst = (entries) => [...entries].sort((a, b) => yearOf(b.from) - yearOf(a.from))

/**
 * Text set as large as the box is wide: the giant name. `lines` puts each
 * string on its own line, the widest one filling the box.
 */
function FitLine({ lines }) {
  const box = useRef(null)
  const text = useRef(null)

  useLayoutEffect(() => {
    const fit = () => {
      const el = text.current
      if (!el) return
      el.style.fontSize = '100px'
      el.style.fontSize = `${(100 * box.current.clientWidth) / el.scrollWidth}px`
    }
    fit()
    // Again once the pixel font is in: the fallback has other widths.
    document.fonts?.ready.then(fit)
    const watch = new ResizeObserver(fit)
    watch.observe(box.current)
    return () => watch.disconnect()
  }, [lines.join('\n')])

  return (
    <div ref={box} className="sv-fit">
      <span ref={text}>
        {lines.map((line, i) => (
          <Fragment key={line}>
            {i > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </span>
    </div>
  )
}

/**
 * Rows of words justified into a rectangle, + between the words. The block is
 * set as wide as the row that is shortest at the widest gap allowed, so no gap
 * anywhere grows past it (the hero meta line's), and the other rows tighten
 * to fit. The widest gap is the box's column-gap, the narrowest each row's.
 */
function JustifiedRows({ rows }) {
  const box = useRef(null)

  useLayoutEffect(() => {
    const fit = () => {
      const el = box.current
      if (!el) return
      const widest = parseFloat(getComputedStyle(el).columnGap)
      const lines = [...el.children].map((ul) => {
        const items = [...ul.children]
        return {
          words: items.reduce((w, li) => w + li.getBoundingClientRect().width, 0),
          gaps: items.length - 1,
          narrowest: parseFloat(getComputedStyle(ul).columnGap),
        }
      })
      const loosest = Math.min(...lines.map((l) => l.words + l.gaps * widest))
      const tightest = Math.max(...lines.map((l) => l.words + l.gaps * l.narrowest))
      el.style.width = `${Math.ceil(Math.max(loosest, tightest))}px`
    }
    fit()
    document.fonts?.ready.then(fit)
    const watch = new ResizeObserver(fit)
    watch.observe(box.current.parentElement)
    return () => watch.disconnect()
  }, [rows])

  return (
    <div ref={box} className="sv-interests">
      {rows.map((row) => (
        <ul key={row.join()}>
          {row.flatMap((title, i) => [
            i > 0 && (
              <li key={`+${title}`} className="sv-plus" aria-hidden="true">
                +
              </li>
            ),
            <li key={title}>{title}</li>,
          ])}
        </ul>
      ))}
    </div>
  )
}

/** A labelled value of the side column: "Period / 2026 — now". */
function Fact({ label, children, wide = false }) {
  return (
    <dl className={wide ? 'sv-fact sv-fact-wide' : 'sv-fact'}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </dl>
  )
}

// Phones get the interests two to a row instead of three (see standard.css).
const PHONE = '(max-width: 680px)'

/** Whether a media query matches, kept up to date as the window changes. */
function useMedia(query) {
  const [matches, setMatches] = useState(
    () => typeof matchMedia === 'function' && matchMedia(query).matches,
  )
  useEffect(() => {
    if (typeof matchMedia !== 'function') return undefined
    const list = matchMedia(query)
    const onChange = () => setMatches(list.matches)
    onChange()
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** A job or a degree: what and where, what was done, and the facts. */
function Step({ entry, S }) {
  const [name, city] = splitPlace(entry.place)
  const details = entry.details ?? []
  return (
    <article className="sv-step">
      <div className="sv-step-what">
        <h3>{entry.place ? name : entry.title}</h3>
        {entry.place && <p className="sv-muted">{entry.title}</p>}
      </div>
      <div className="sv-step-mid">
        {details.length > 0 && (
          <ul className="sv-points">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="sv-step-facts">
        <Fact label={S.period}>{period(entry, S.now)}</Fact>
        {city && (
          <Fact label={S.place}>{[city, entry.country].filter(Boolean).join(', ')}</Fact>
        )}
        {entry.footer && <Fact label={S.stack} wide>{afterLabel(entry.footer)}</Fact>}
      </div>
    </article>
  )
}

/**
 * A card: a grey tile with a word set in pixels, then a title, where it took
 * place (as the terminal view's "@" line) and a line.
 */
function Card({ tile, title, place, text, when }) {
  return (
    <article className="sv-card">
      <div className="sv-tile" aria-hidden="true">
        <span>{tile}</span>
      </div>
      <h3>
        {title}
        {when && <span className="sv-muted"> · {when}</span>}
      </h3>
      {place && <p className="sv-card-place">{place}</p>}
      {text && <p className="sv-muted">{text}</p>}
    </article>
  )
}

export default function StandardView({ lang = 'en', onLanguage, onExit }) {
  const { PROFILE, SECTIONS } = contentFor(lang)
  const T = ui(lang)
  const phone = useMedia(PHONE)
  const [blurbStart, blurbEnd] = PROFILE.blurb.split(/, (.*)/, 2)
  const S = T.std
  const [copied, setCopied] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  // The bar gets its frosted backing once the page leaves the top.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The bands under the hero fade in as they come into view, one after the
  // other when several arrive at once. A data attribute rather than a class,
  // so React's renders leave it alone; the fade itself is in standard.css.
  // On desktop the skills sit right under the hero and are simply there.
  const main = useRef(null)
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return undefined
    const skills = main.current.querySelector('#skills')
    if (skills && !phone) skills.dataset.reveal = 'in'
    const bands = [
      ...main.current.querySelectorAll('.sv-band:not(.sv-hero):not(.sv-marquee)'),
    ].filter((band) => band.dataset.reveal !== 'in')
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, i) => {
            entry.target.style.setProperty('--reveal-delay', `${i * 150}ms`)
            entry.target.dataset.reveal = 'in'
            observer.unobserve(entry.target)
          })
      },
      { rootMargin: '0px 0px -30% 0px' },
    )
    bands.forEach((band) => {
      band.dataset.reveal = ''
      observer.observe(band)
    })
    return () => observer.disconnect()
  }, [lang, phone])

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard refused (insecure origin, or the visitor blocked it):
      // fall back to opening their mail client instead of failing silently.
      window.location.href = `mailto:${EMAIL}`
    }
  }

  const byId = Object.fromEntries(sectionsFor('standard', SECTIONS).map((s) => [s.id, s]))
  const { skills, education, work, competitions, projects, references, interests } = byId
  const quote = references?.quotes?.[0]
  // The marquee's words twice over, so the loop has no seam.
  const marquee = [...S.marquee, ...S.marquee]

  return (
    <div className="sv">
      <header className={`sv-bar${scrolled ? ' is-scrolled' : ''}`}>
        <div className="sv-wrap sv-nav">
          <div className="sv-nav-start">
            <a className="sv-logo" href="#top" aria-label={PROFILE.name}>
              <PixelSvg rows={TREE_RUNS} />
            </a>
            {/* Same switch as the terminal's: only the languages written so far. */}
            <span className="sv-lang" role="group" aria-label="Language">
              {LANGUAGES.filter(({ code }) => READY.includes(code)).map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={code === lang}
                  title={label}
                  onClick={() => onLanguage?.(code)}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </span>
          </div>
          <nav className="sv-nav-links" aria-label="Sections">
            <a href="#path">{S.nav.path}</a>
            <a href="#skills">{S.nav.skills}</a>
            <a href="#projects">{S.nav.projects}</a>
            <a href="#contact">{S.nav.contact}</a>
            <a href={RESUME} target="_blank" rel="noreferrer">
              {S.resume}
            </a>
          </nav>
          <div className="sv-nav-end">
            <button type="button" className="sv-term" onClick={onExit}>
              <span className="sv-term-prompt" aria-hidden="true">
                &gt;
              </span>
              {S.terminal}
              <span className="sv-term-cursor" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="top" ref={main}>
        <section className="sv-hero sv-band">
          <div className="sv-wrap">
            {/* Split at its comma: on phones the second half drops to its own
                line, against the right edge (see standard.css). */}
            <p className="sv-lede">
              {blurbEnd ? (
                <>
                  <span>{blurbStart},</span> <span className="sv-lede-end">{blurbEnd}</span>
                </>
              ) : (
                PROFILE.blurb
              )}
            </p>
            <p className="sv-lede-sub">
              {S.lede.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </p>
            <ul className="sv-meta">
              {S.meta.map((item, i) => (
                <li key={item}>
                  {i > 0 && (
                    <span className="sv-plus" aria-hidden="true">
                      +
                    </span>
                  )}
                  {item}
                </li>
              ))}
            </ul>
            <h1 className="sv-name">
              {/* On phones, the first name over the last name: the name stays
                  larger than when it shrinks to fit the width on one line. */}
              <FitLine lines={phone ? PROFILE.name.split(/ (.*)/, 2) : [PROFILE.name]} />
            </h1>
          </div>
        </section>

        {skills && (
          <section id="skills" className="sv-band" aria-label={skills.heading}>
            <div className="sv-wrap sv-pillars">
              {skills.groups.map((group) => (
                <div key={group.label} className="sv-pillar">
                  <h2>{group.label}</h2>
                  {group.blurb && <p className="sv-muted">{group.blurb}</p>}
                  <p className="sv-tools">{group.items.split(/,\s*/).join(' · ')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="sv-marquee sv-band" aria-hidden="true">
          <div className="sv-marquee-track">
            {marquee.map((word, i) => (
              <span key={i}>
                {word}
                <span className="sv-plus">+</span>
              </span>
            ))}
          </div>
        </div>

        <div id="path">
          {[work, education]
            .filter((section) => section?.entries.length)
            .map((section) => (
              <section key={section.id} className="sv-band">
                <div className="sv-wrap">
                  <h2 className="sv-display">{section.heading}</h2>
                  {newestFirst(section.entries).map((entry) => (
                    <Step key={entry.title} entry={entry} S={S} />
                  ))}
                </div>
              </section>
            ))}
        </div>

        {quote && (
          <section className="sv-band sv-reco">
            <div className="sv-wrap">
              {/* On phones the icon moves up beside the title (see standard.css). */}
              <div className="sv-reco-head">
                <h2 className="sv-display">{references.heading}</h2>
                <PixelSvg rows={COLUMN_RUNS} className="sv-reco-head-art" />
              </div>
              <div className="sv-reco-body">
                <figure>
                  <blockquote className="sv-lede">
                    {lang === 'fr' ? `« ${quote.text} »` : `“${quote.text}”`}
                  </blockquote>
                  <figcaption className="sv-meta">
                    <span>{quote.author}</span>
                    <span>{quote.role}</span>
                    {quote.pdf && (
                      <a href={quote.pdf} target="_blank" rel="noreferrer">
                        {S.viewLetter} ↗
                      </a>
                    )}
                  </figcaption>
                </figure>
                <PixelSvg rows={COLUMN_RUNS} className="sv-reco-art" />
              </div>
            </div>
          </section>
        )}

        {projects?.entries.length > 0 && (
          <section id="projects" className="sv-band">
            <div className="sv-wrap">
              <h2 className="sv-display">{projects.heading}</h2>
              <div className="sv-cards">
                {projects.entries.map((entry) => (
                  <Card
                    key={entry.title}
                    tile={entry.title}
                    title={entry.meta}
                    text={entry.footer}
                    when={period(entry, S.now)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {competitions?.entries.length > 0 && (
          <section className="sv-band">
            <div className="sv-wrap">
              <h2 className="sv-display">{competitions.heading}</h2>
              <div className="sv-cards">
                {competitions.entries.map((entry) => (
                  <Card
                    key={entry.title}
                    tile={entry.rank ?? entry.details?.[0]}
                    title={entry.title}
                    place={entry.place}
                    text={[entry.details?.join(', '), entry.meta].filter(Boolean).join(' — ')}
                    when={period(entry, S.now)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {interests?.entries.length > 0 && (
          <section className="sv-band">
            <div className="sv-wrap sv-about">
              <h2 className="sv-display">{interests.heading}</h2>
              <div>
                <JustifiedRows
                  rows={balancedRows(
                    interests.entries.map((entry) => entry.title),
                    Math.ceil(interests.entries.length / (phone ? 2 : 3)),
                  )}
                />
                <figure className="sv-globe">
                  <PixelSvg rows={GLOBE_RUNS} className="sv-globe-art" />
                  <div>
                    <blockquote>{T.globeQuote[0]}</blockquote>
                    <figcaption className="sv-muted">{T.globeQuote[1].replace(/^-- /, '— ')}</figcaption>
                  </div>
                </figure>
              </div>
            </div>
          </section>
        )}

        <section id="contact" className="sv-band">
          <div className="sv-wrap sv-contact">
            <h2 className="sv-display">{S.nav.contact}</h2>
            <div className="sv-joined">
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              <button type="button" onClick={copyEmail}>
                {copied ? S.emailCopied : S.copyEmail}
              </button>
              <a href={LINKS.github} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
              <a href={RESUME} target="_blank" rel="noreferrer">
                {S.resume} ↗
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="sv-wrap sv-foot">
        <div className="sv-foot-text">
          <p>{FOOTER_LINE}</p>
          <p>
            This part of the site is inspired by{' '}
            <a href="https://jithinrp.com" target="_blank" rel="noreferrer">
              Jithin RP
            </a>
            .
          </p>
        </div>
        <button type="button" onClick={onExit}>
          {S.footerTerminal}
        </button>
      </footer>
    </div>
  )
}
