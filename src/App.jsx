import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ACTIVITY_LEVELS,
  MENU,
  NAV_LINKS,
  buildLines,
  buildMenuLines,
  FILES,
  LANGUAGES,
  // TOP_PERIOD, (Most played panel, switched off)
  charCount,
  footerLine,
  parseGradient,
  parseLine,
  // topTracksLine,
} from './buffer.js'
// import useTopTracks from './useTopTracks.js' (Most played panel, switched off)
import HelpScreen from './HelpScreen.jsx'
import Rule from './Rule.jsx'
import ScrollBar from './ScrollBar.jsx'
import StandardView from './StandardView.jsx'
import Gate from './Gate.jsx'
import useNowPlaying from './useNowPlaying.js'
import GradientText from './GradientText.jsx'
import Marquee from './Marquee.jsx'
import Sparkle from './Sparkle.jsx'
import PixelArt from './PixelArt.jsx'
import WallClock from './WallClock.jsx'
import QrOverlay from './QrOverlay.jsx'
import useRetype from './useRetype.js'
import { colors, colorsFromText } from './gradients.js'
import { READY, ui } from './i18n.js'
import { ACTIONS, LINKS, openExternal } from './actions.js'
import { LANG_FX } from './langfx.js'
import { lag } from './perf.js'

// Shown until the visitor moves with the arrows, which is proof enough that
// they no longer need to be told.
const HINT = 'Arrows to move, Enter to open'
// How long a toast stays on screen.
const TOAST_MS = 5000

const PROMPT_LABELS = {
  search: 'Search',
  searchBack: 'Search (to go backward)',
  goto: 'Enter line number',
  execute: 'Command to execute',
}

/**
 * A language button's label: the language's own name, or on phones its code
 * (FR, EN...) so the whole row fits on one line (see nano.css).
 */
function LangLabel({ code }) {
  const { label } = LANGUAGES.find((l) => l.code === code) || { label: code }
  return (
    <>
      [ <span className="lang-long">{label}</span>
      <span className="lang-short" aria-hidden="true">
        {code.toUpperCase()}
      </span>{' '}
      ]
    </>
  )
}

/**
 * For a panel line, whose links carry the text row they sit on: the first
 * link of the next row of links after link `col` (dir 1) or of the row
 * before it (dir -1), or null when there is none and the cursor should move
 * to another line.
 */
function linkInRow(line, col, dir) {
  const links = line?.links || []
  const here = links[col]
  if (here?.row == null) return null
  const rows = [...new Set(links.map((l) => l.row))].sort((a, b) => a - b)
  const target = rows[rows.indexOf(here.row) + dir]
  if (target == null) return null
  return links.find((l) => l.row === target).k
}

/** The first link of a panel line's last row of links (0 when none). */
function lastRowLink(line) {
  const links = line?.links || []
  if (links[0]?.row == null) return 0
  const lastRow = Math.max(...links.map((l) => l.row))
  return links.find((l) => l.row === lastRow).k
}

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

// The language the visitor picked last time, English the first time.
function savedLang() {
  try {
    const saved = localStorage.getItem('lang')
    return READY.includes(saved) ? saved : 'en'
  } catch {
    return 'en'
  }
}

// A touch screen has no arrow keys: the keyboard hint means nothing there.
const TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches

/**
 * Inline style of a plain buffer line. A line that starts with an indent or
 * a marker ("- ", "  * ", "  @ ") gets a hanging indent: when it is too long
 * and wraps, the next rows start under its text, not at the left edge.
 */
function lineStyle(line) {
  if (line.art) return { fontSize: `${line.art}em` }
  if (line.pushFrom) return undefined
  const lead = /^\s*(?:[-*@] )?/.exec(line.text)[0].length
  return lead ? { paddingLeft: `${lead}ch`, textIndent: `-${lead}ch` } : undefined
}

// The site has two pages for now: the CV (/) and the menu (/menu). Which one
// is showing comes from the address bar, so a link can be shared and the back
// button works; anything else falls back to the CV.
const MENU_PATH = '/menu'
const pageOf = (path) => (path === MENU_PATH ? 'menu' : 'whoami')
const pageLines = (page, lang) => (page === 'menu' ? buildMenuLines(lang) : buildLines(lang))
/** The line the first menu entry sits on, so the cursor can start there. */
const firstEntryLine = (lines) =>
  Math.max(
    0,
    lines.findIndex((line) => line.links?.some((l) => l.target?.startsWith('action:menu:'))),
  )

const FAKE_SHELL = {
  whoami: 'elxss',
  pwd: '/home/elxss',
  ls: 'index.jsx  cv.js  buffer.js  whoami.txt  resume.pdf',
  uname: 'Linux elxss 6.12.0 x86_64 GNU/Linux',
  date: () => new Date().toString(),
  lag: () => {
    lag()
    return 'sampling 3s of frames \u2014 report lands in the browser console'
  },
  help: 'try: whoami, pwd, ls, uname, date, lag',
}

export default function App() {
  const [lang, setLang] = useState(savedLang)
  const T = ui(lang)
  const [path, setPath] = useState(() => globalThis.location?.pathname || '/')
  const page = pageOf(path)
  const [lines, setLines] = useState(() => pageLines(pageOf(globalThis.location?.pathname || '/'), lang))
  const [cursor, setCursor] = useState(2)
  const [prompt, setPrompt] = useState(null) // { mode, value }
  const [status, setStatus] = useState(TOUCH ? '' : HINT)
  const [screen, setScreen] = useState('buffer') // buffer | help | exited
  const [match, setMatch] = useState(null) // { line, start, end }
  const [modified, setModified] = useState(false)
  const [qrOpen, setQrOpen] = useState(false) // ^S: the site's QR code
  // No view until the visitor picks one; the choice is then remembered.
  const [view, setView] = useState(() => {
    try {
      const saved = localStorage.getItem('view')
      return saved === 'standard' || saved === 'nano' ? saved : 'gate'
    } catch {
      return 'gate'
    }
  })

  const [col, setCol] = useState(0) // focused link on the cursor line

  const { track, refresh: refreshTrack } = useNowPlaying()

  // When the song changes, the old title is wiped and the new one typed in
  // letter by letter (see useRetype.js).
  const songName = track ? `${track.artist} - ${track.title}` : ''
  // The label is part of what is typed, so switching language wipes and
  // retypes the whole line rather than swapping the words underneath it.
  const songLine = track
    ? `${track.playing ? T.nowPlaying : T.lastPlayed}${songName} \u266a`
    : ''
  const song = useRetype(songLine)
  // The whole line gets a gradient between two colours drawn from a hash of
  // the song, so each song has its own colours and keeps them.
  const songGradient = useMemo(() => colors(...colorsFromText(songName)), [songName])

  // Switched off: the "most played" panel, filled in once Last.fm answers. Found by
  // type rather than index, since cutting lines moves it.
  // const topTracks = useTopTracks(TOP_PERIOD.id)
  // useEffect(() => {
  //   const next = topTracksLine(topTracks)
  //   setLines((current) => current.map((line) => (line.type === 'top' ? next : line)))
  // }, [topTracks])

  // Going from one page to the other: the address bar follows, so the link
  // can be shared and Back works. The cursor starts at the top of the new
  // buffer, and any open help screen is left behind.
  const go = useCallback(
    (to) => {
      if (to === path) return
      globalThis.history?.pushState({}, '', to)
      setPath(to)
    },
    [path],
  )

  // The Back and Forward buttons.
  useEffect(() => {
    const onPop = () => setPath(globalThis.location?.pathname || '/')
    globalThis.addEventListener?.('popstate', onPop)
    return () => globalThis.removeEventListener?.('popstate', onPop)
  }, [])

  useEffect(() => {
    const next = pageLines(page, lang)
    setLines(next)
    // On the menu the cursor starts on the first entry, so Enter opens
    // something straight away instead of sitting on the banner.
    setCursor(page === 'menu' ? firstEntryLine(next) : 2)
    setScreen('buffer')
    setMatch(null)
    setModified(false)
    // `lang` is left out: switchLanguage already rebuilds, and listing it here
    // would undo the scramble it sets up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  // Set on the visitor's first key press or line click (see the focus sync).
  const touched = useRef(false)
  const cutBuffer = useRef(null)
  const linkRefs = useRef(new Map())
  const lineRefs = useRef(new Map())
  const bodyRef = useRef(null)
  const undoStack = useRef([])
  const redoStack = useRef([])
  const lastSearch = useRef('')
  const promptInput = useRef(null)

  // Bumped on every message, so the same text said twice restarts its timer.
  const [statusId, setStatusId] = useState(0)

  const say = useCallback((msg) => {
    setStatus(msg)
    setStatusId((id) => id + 1)
    setPrompt(null)
  }, [])

  // A menu entry: the ones that have a page open it, the others say they are
  // not written yet rather than pretending to be links.
  const openMenuEntry = useCallback(
    (key) => {
      const entry = MENU.find((item) => item.key === key)
      if (!entry) return
      if (entry.to) go(entry.to)
      else say(T.menu.unwritten(T.menu.entries[key]))
    },
    [go, say, T],
  )

  // Toasts clear themselves after 5 s. The start-up hint is left alone: it
  // goes away once the visitor moves, as before.
  useEffect(() => {
    if (!status || status === HINT) return undefined
    const timer = setTimeout(() => setStatus(''), TOAST_MS)
    return () => clearTimeout(timer)
  }, [status, statusId])

  // Right-click on the line copies its two colours, in the same form the
  // gradient syntax takes (#aaaaaa>#bbbbbb), instead of opening the menu.
  const copySongColors = useCallback(
    async (e) => {
      e.preventDefault()
      try {
        await navigator.clipboard.writeText(songGradient)
        say(`Copied gradient colors ${songGradient.replace('>', ' > ')}`)
      } catch {
        say(`Clipboard blocked — the colors are ${songGradient.replace('>', ' > ')}`)
      }
    },
    [songGradient, say],
  )

  const openPrompt = useCallback((mode) => {
    setStatus('')
    setPrompt({ mode, value: '' })
  }, [])

  useEffect(() => {
    if (prompt) promptInput.current?.focus()
  }, [prompt])

  // Browsers restore the previous scroll offset on reload, including on inner
  // scrollers. Start every load at the top of the buffer instead.
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    bodyRef.current?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [])

  // Swap every line of a toggle group (e.g. a recommendation's excerpt and
  // its full letter) between its two versions, `raw` and `alt`.
  const toggleLines = useCallback((group) => {
    setLines((current) =>
      current.map((line) =>
        line.toggle === group
          ? { ...line, ...parseLine(line.alt), raw: line.alt, alt: line.raw }
          : line,
      ),
    )
  }, [])

  // Language change animation, chosen in langfx.js: `scrambleFrom` is when it
  // started (null when idle, and always null when the animation is 'none');
  // `frame` just re-renders on each animation frame.
  const [scrambleFrom, setScrambleFrom] = useState(null)
  const [, setFrame] = useState(0)
  useEffect(() => {
    if (scrambleFrom === null) return undefined
    let raf
    const step = (now) => {
      if (now - scrambleFrom >= LANG_FX.ms) {
        setScrambleFrom(null)
        return
      }
      setFrame((n) => n + 1)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [scrambleFrom])

  /** `text` as it shows at this point of the animation (itself when idle). */
  const scrambled = (text) =>
    scrambleFrom === null || !text || !LANG_FX
      ? text
      : LANG_FX.frame(text, performance.now() - scrambleFrom)

  // A language button: the whole page is rebuilt in that language (cut or
  // unfolded lines start afresh), the cursor stays on the line it was on, and
  // the choice is kept for the next visit. Languages not written yet say so.
  const switchLanguage = useCallback(
    (code) => {
      if (code === lang) return
      if (!READY.includes(code)) {
        const { label } = LANGUAGES.find((l) => l.code === code) || { label: code }
        say(ui(lang).soon(label))
        return
      }
      setLang(code)
      setLines(pageLines(page, code))
      if (LANG_FX && !reducedMotion()) setScrambleFrom(performance.now())
      undoStack.current = []
      redoStack.current = []
      setModified(false)
      try {
        localStorage.setItem('lang', code)
      } catch {
        /* private mode: the choice just will not stick */
      }
    },
    [lang, say],
  )

  // Only the buffer scrolls, but the wheel should work anywhere on the page:
  // over the side margins, the title bar or the bottom bars, it is passed on
  // to the buffer. Inside the buffer the browser already handles it.
  useEffect(() => {
    const onWheel = (e) => {
      const body = bodyRef.current
      if (!body || body.contains(e.target) || e.ctrlKey) return
      // deltaMode 1 counts lines, 2 pages; turn both into pixels.
      const unit =
        e.deltaMode === 1
          ? parseFloat(getComputedStyle(body).lineHeight) || 20
          : e.deltaMode === 2
            ? body.clientHeight
            : 1
      body.scrollBy({ top: e.deltaY * unit, left: 0 })
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  const snapshot = useCallback(() => {
    undoStack.current.push({ lines, cursor })
    redoStack.current = []
  }, [lines, cursor])

  // The page says which language it is in (screen readers, translators).
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // One owner for the theme: the editor is a terminal, the other two are
  // paper. The menu is an editor screen whichever view was picked for the CV.
  useEffect(() => {
    const dark = view === 'nano' || page === 'menu'
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [view, page])

  useEffect(() => {
    if (view === 'gate') return
    try {
      localStorage.setItem('view', view)
    } catch {
      /* private mode: the choice just will not stick */
    }
  }, [view])

  // Move the cursor to a line and land on its first link, if it has one.
  const goToLine = useCallback((next) => {
    touched.current = true
    setCursor(next)
    setCol(0)
  }, [])

  // A nav label lands on its section's heading line.
  const jumpToLine = useCallback(
    (section) => {
      const index = lines.findIndex((line) => line.section === section)
      if (index === -1) return say('Not in this buffer')
      goToLine(index)
      // A jump puts the target at the top, not merely just-visible.
      requestAnimationFrame(() =>
        lineRefs.current.get(index)?.scrollIntoView({ block: 'start' }),
      )
      return undefined
    },
    [lines, goToLine, say],
  )

  // Every focusable thing on the nav line, in keyboard order.
  const navItems = [
    ...NAV_LINKS.map((section) => ({
      label: T.nav[section],
      onClick: () => jumpToLine(section),
    })),
    {
      label: T.notDev,
      onClick: () => setView('standard'),
      // The way out for visitors who do not want a terminal: it shimmers
      // (the gradient slides along it) and stands apart from the dev links.
      gradient: '#d855e7>#f8a5ae*28~8',
      standout: true,
    },
  ]

  // The shortcut bar is a virtual row just past the end of the buffer, so the
  // same cursor/arrow machinery reaches its buttons.
  const shortcuts = [
    { key: '^F', label: T.shortcuts.search, run: () => openPrompt('search') },
    { key: '^G', label: T.shortcuts.github, run: () => openExternal(LINKS.github) },
    { key: '^M', label: T.shortcuts.mail, run: () => ACTIONS['copy-email'](say) },
    { key: '^S', label: T.shortcuts.qr, run: () => setQrOpen(true) },
  ]

  const barRow = lines.length

  const linkCount = useCallback(
    (i) =>
      i === lines.length
        ? shortcuts.length
        : lines[i]?.type === 'nav'
          ? navItems.length
          : lines[i]?.links?.length || 0,
    [lines, navItems.length, shortcuts.length],
  )

  /* --- editing ops --- */

  const cutLine = useCallback(() => {
    if (lines[cursor]?.type !== 'text') return say('Cannot cut that line')
    snapshot()
    cutBuffer.current = lines[cursor]
    setLines(lines.filter((_, i) => i !== cursor))
    setCursor((c) => Math.min(c, lines.length - 2))
    setModified(true)
    say('Cut 1 line')
  }, [lines, cursor, snapshot, say])

  const pasteLine = useCallback(() => {
    if (!cutBuffer.current) return say('Cutbuffer is empty')
    snapshot()
    const next = [...lines]
    next.splice(cursor, 0, cutBuffer.current)
    setLines(next)
    setModified(true)
    say('Pasted 1 line')
  }, [lines, cursor, snapshot, say])

  const undo = useCallback(() => {
    const prev = undoStack.current.pop()
    if (!prev) return say('Nothing to undo')
    redoStack.current.push({ lines, cursor })
    setLines(prev.lines)
    setCursor(prev.cursor)
    say('Undid cut')
  }, [lines, cursor, say])

  const redo = useCallback(() => {
    const next = redoStack.current.pop()
    if (!next) return say('Nothing to redo')
    undoStack.current.push({ lines, cursor })
    setLines(next.lines)
    setCursor(next.cursor)
    say('Redid cut')
  }, [lines, cursor, say])

  /* --- search --- */

  const runSearch = useCallback(
    (needle, backward = false, from = cursor) => {
      const term = (needle || lastSearch.current).trim()
      if (!term) return say('Cancelled')
      lastSearch.current = term
      const lower = term.toLowerCase()
      const n = lines.length
      for (let step = 1; step <= n; step += 1) {
        const i = backward
          ? (from - step + n * 2) % n
          : (from + step) % n
        const at = lines[i].text.toLowerCase().indexOf(lower)
        if (at !== -1) {
          setCursor(i)
          setMatch({ line: i, start: at, end: at + term.length })
          return say('')
        }
      }
      setMatch(null)
      return say(`"${term}" not found`)
    },
    [lines, cursor, say],
  )

  /* --- location --- */

  const showLocation = useCallback(() => {
    const total = lines.length
    const chars = charCount(lines)
    const before = charCount(lines.slice(0, cursor))
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
    say(
      `line ${cursor + 1}/${total} (${pct(cursor + 1, total)}%), ` +
        `col 1/${(lines[cursor]?.text.length || 0) + 1} (100%), ` +
        `char ${before}/${chars} (${pct(before, chars)}%)`,
    )
  }, [lines, cursor, say])

  /* --- prompt submit --- */

  const submitPrompt = useCallback(() => {
    if (!prompt) return
    const value = prompt.value.trim()
    if (prompt.mode === 'search' || prompt.mode === 'searchBack') {
      runSearch(value, prompt.mode === 'searchBack')
    } else if (prompt.mode === 'goto') {
      const n = parseInt(value, 10)
      if (Number.isNaN(n)) return say('Invalid line number')
      const target = Math.max(0, Math.min(lines.length - 1, n - 1))
      setCursor(target)
      say('')
    } else if (prompt.mode === 'execute') {
      const out = FAKE_SHELL[value.split(' ')[0]]
      say(out ? (typeof out === 'function' ? out() : out) : `${value}: command not found`)
    }
  }, [prompt, runSearch, lines.length, say])

  /* --- key bindings --- */

  useEffect(() => {
    // Whether anything is selected, on the page or inside a text field.
    const hasSelection = () => {
      const field = document.activeElement
      if (field?.tagName === 'INPUT' && field.selectionStart !== field.selectionEnd) {
        return true
      }
      return Boolean(window.getSelection()?.toString())
    }

    const onKey = (e) => {
      touched.current = true
      const ctrl = e.ctrlKey && !e.altKey
      const meta = e.altKey && !e.ctrlKey
      const key = e.key.toLowerCase()

      // The QR code is open: Esc or ^S closes it, everything else waits.
      if (qrOpen) {
        if (e.key === 'Escape' || (ctrl && key === 's')) {
          e.preventDefault()
          setQrOpen(false)
        }
        return
      }

      // Prompt is open: Enter submits, ^C / Esc cancels.
      if (prompt) {
        if (e.key === 'Enter') {
          e.preventDefault()
          submitPrompt()
        } else if (ctrl && key === 'c' && hasSelection()) {
          // Text selected in the prompt: a real copy, the prompt stays open.
        } else if (e.key === 'Escape' || (ctrl && key === 'c')) {
          e.preventDefault()
          say('Cancelled')
        }
        return
      }

      // On the menu, a digit opens the entry it numbers.
      if (page === 'menu' && screen === 'buffer' && !ctrl && !e.altKey && !e.metaKey) {
        const pick = /^[1-9]$/.test(e.key) ? MENU[Number(e.key) - 1] : null
        if (pick) {
          e.preventDefault()
          openMenuEntry(pick.key)
          return
        }
      }

      if (screen === 'exited') {
        if (ctrl && key === 'r') {
          e.preventDefault()
          setScreen('buffer')
          say('')
        }
        return
      }

      if (ctrl) {
        switch (key) {
          case 'h':
            e.preventDefault()
            setScreen('help')
            return
          case 'g':
            e.preventDefault()
            // Same tab on purpose: a Ctrl+key keydown carries no user
            // activation, so any attempt at a new tab is blocked as a popup.
            window.location.href = LINKS.github
            say('Opening GitHub')
            return
          case 's':
            // The browser's "save page" is not much use here: ^S shows the
            // site's QR code instead.
            e.preventDefault()
            setQrOpen(true)
            return
          case 'm':
            // Copies the address (with a toast) rather than opening a mail app.
            e.preventDefault()
            ACTIONS['copy-email'](say)
            return
          case 'x':
            e.preventDefault()
            if (screen === 'help') {
              setScreen('buffer')
              say('')
            } else {
              setScreen('exited')
            }
            return
          case 'c': {
            // With text selected, ^C is a normal copy (the browser does it,
            // so no preventDefault); without, it is nano's cursor position.
            const copied = window.getSelection()?.toString() || ''
            if (copied) {
              say(`Copied ${[...copied].length} characters`)
              return
            }
            e.preventDefault()
            showLocation()
            return
          }
          case 'f':
            e.preventDefault()
            openPrompt('search')
            return
          case 'b':
            e.preventDefault()
            openPrompt('searchBack')
            return
          case 'k':
            e.preventDefault()
            cutLine()
            return
          case 'u':
            e.preventDefault()
            pasteLine()
            return
          case 'o':
            e.preventDefault()
            say(modified ? 'Read-only buffer: nice try ;)' : 'No changes to write')
            return
          case 't':
            e.preventDefault()
            openPrompt('execute')
            return
          case 'p':
            e.preventDefault()
            refreshTrack()
            say('Refreshing what is playing')
            return
          case 'y':
            e.preventDefault()
            goToLine(Math.max(0, cursor - 12))
            return
          case 'v':
            e.preventDefault()
            goToLine(Math.min(barRow, cursor + 12))
            return
          case '/':
          case '_':
            e.preventDefault()
            openPrompt('goto')
            return
          default:
            return
        }
      }

      if (meta) {
        if (key === 'u') {
          e.preventDefault()
          undo()
        } else if (key === 'e') {
          e.preventDefault()
          redo()
        } else if (key === 'f') {
          e.preventDefault()
          runSearch('', false)
        } else if (key === 'b') {
          e.preventDefault()
          runSearch('', true)
        }
        return
      }

      if (e.key.startsWith('Arrow')) {
        setStatus((current) => (current === HINT ? '' : current))
      }

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          // Inside a panel, first walk down its rows of links.
          const next = linkInRow(lines[cursor], col, 1)
          if (next != null) setCol(next)
          else goToLine(Math.min(barRow, cursor + 1))
          return
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prev = linkInRow(lines[cursor], col, -1)
          if (prev != null) {
            setCol(prev)
            return
          }
          // Coming up into a panel: land on its last row of links.
          const above = Math.max(0, cursor - 1)
          goToLine(above)
          const last = lastRowLink(lines[above])
          if (last) setCol(last)
          return
        }
        case 'ArrowRight': {
          const n = linkCount(cursor)
          if (!n) return
          e.preventDefault()
          setCol((c) => Math.min(n - 1, c + 1))
          return
        }
        case 'ArrowLeft':
          if (!linkCount(cursor)) return
          e.preventDefault()
          setCol((c) => Math.max(0, c - 1))
          return
        case 'PageDown':
          e.preventDefault()
          goToLine(Math.min(barRow, cursor + 12))
          return
        case 'PageUp':
          e.preventDefault()
          goToLine(Math.max(0, cursor - 12))
          return
        case 'Home':
          e.preventDefault()
          goToLine(0)
          return
        case 'End':
          e.preventDefault()
          goToLine(barRow)
          return
        default:
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    prompt, screen, lines.length, modified, submitPrompt, say, openPrompt,
    showLocation, cutLine, pasteLine, undo, redo, runSearch, cursor,
    goToLine, linkCount, barRow, refreshTrack, qrOpen, col, lines,
    page, openMenuEntry,
  ])

  // Keep the real DOM focus in sync with the cursor, so Enter/Space activate
  // whatever the cursor is sitting on and screen readers follow along.
  useEffect(() => {
    if (screen !== 'buffer' || prompt) return
    // Until the visitor presses a key or clicks a line, no link takes the
    // focus: on load that would light up the first button of the intro all
    // by itself.
    if (!touched.current) {
      bodyRef.current?.focus({ preventScroll: true })
      return
    }
    // On the first line, go all the way up so the padding above the header is
    // visible again instead of stopping at the line itself.
    if (cursor === 0) bodyRef.current?.scrollTo({ top: 0 })
    else lineRefs.current.get(cursor)?.scrollIntoView({ block: 'nearest' })
    const link = linkRefs.current.get(`${cursor}-${col}`)
    if (link) {
      link.focus({ preventScroll: true })
    } else {
      // No link on this line: hand focus back to the buffer, otherwise the
      // link we just left keeps the focus style and stays in inverse video.
      document.activeElement?.blur?.()
      bodyRef.current?.focus({ preventScroll: true })
    }
  }, [cursor, col, screen, prompt, lines])

  /* --- rendering --- */

  // Highlight whatever part of a slice the current search match covers.
  // `from` is the slice's offset inside the full line.
  const withHighlight = (text, from, hit) => {
    if (!hit) return text
    const start = Math.max(hit.start - from, 0)
    const end = Math.min(hit.end - from, text.length)
    if (start >= end) return text
    return (
      <>
        {text.slice(0, start)}
        <mark>{text.slice(start, end)}</mark>
        {text.slice(end)}
      </>
    )
  }

  // Roving tabindex: only the link under the cursor is tabbable, so Tab moves
  // past the whole buffer while the arrows move inside it.
  const linkProps = (i, k) => ({
    ref: (el) => {
      if (el) linkRefs.current.set(`${i}-${k}`, el)
      else linkRefs.current.delete(`${i}-${k}`)
    },
    tabIndex: i === cursor && k === col ? 0 : -1,
    onFocus: () => {
      setCursor(i)
      setCol(k)
    },
  })

  // `searchable` is false for the pieces of a footer: search offsets are into
  // the whole line's text, not into one of its rows.
  // A panel line (most played, footer): logo on the left, text rows on the
  // right. With i = -1 it is drawn outside the buffer (in the help screen):
  // not a cursor target, and its links stay out of the arrow keys' reach.
  // The help screen shows the footer too, ending on its own file name.
  const helpFooter = useMemo(() => footerLine(FILES.help, lang), [lang])

  const renderPanel = (line, i, isCursor = false) => {
    const Panel = { footer: 'footer', intro: 'header' }[line.type] || 'section'
    const inBuffer = i >= 0
    return (
      <Panel
        key={i}
        ref={inBuffer ? (el) => el && lineRefs.current.set(i, el) : undefined}
        className={`line panel panel-${line.type}${line.logoRight ? ' logo-right' : ''}${
          isCursor ? ' cursor-line' : ''
        }`}
        onClick={inBuffer ? () => goToLine(i) : undefined}
      >
        <div
          className="panel-logo"
          aria-hidden="true"
          style={line.logoSize ? { fontSize: `${line.logoSize}em` } : undefined}
        >
          {line.pixel ? (
            <PixelArt rows={line.logo} shimmer={line.shimmer} />
          ) : (
            line.logo.map((row, r) => (
              <div key={r} className="panel-logo-row">
                {renderText(row, i, false)}
              </div>
            ))
          )}
        </div>
        <div className="panel-text">
          {line.rows.map((row, r) => (
            <div
              key={r}
              className={line.dimLast && r === line.rows.length - 1 ? 'dim' : undefined}
              style={lineStyle(row)}
            >
              {renderText(row, i, false)}
            </div>
          ))}
        </div>
        {line.under?.length > 0 && (
          <div className="panel-under">
            {line.under.map((row, r) => (
              <div key={r}>{renderText(row, i, false)}</div>
            ))}
          </div>
        )}
      </Panel>
    )
  }

  const renderText = (line, i, searchable = true) => {
    const hit = searchable && match && match.line === i ? match : null
    // During a language change the text is drawn scrambled, then decoded.
    const shown = scrambled(line.text)
    const links = line.links || []
    const gradients = line.gradients || []

    if (!links.length && !gradients.length) {
      return line.text ? withHighlight(shown, 0, hit) : '\u00a0'
    }

    // A link keeps its index among links only: that is what the keyboard
    // focus ring counts.
    const spans = [
      ...links.map((link, k) => ({ ...link, kind: 'link', k: link.k ?? k })),
      ...gradients.map((g) => ({ ...g, kind: 'gradient' })),
    ].sort((a, b) => a.start - b.start)

    const pieces = []
    let at = 0
    let pushAt = -1

    spans.forEach((span, n) => {
      if (span.start > at) {
        const slice = shown.slice(at, span.start)
        pieces.push(<span key={`t${n}`}>{withHighlight(slice, at, hit)}</span>)
      }

      const body = withHighlight(
        shown.slice(span.start, span.end),
        span.start,
        hit,
      )

      if (span.kind === 'gradient') {
        pieces.push(
          <GradientText
            key={`g${n}`}
            text={shown.slice(span.start, span.end)}
            start={span.start}
            span={span}
            hit={hit}
          />,
        )
      } else {
        const name = span.target.startsWith('action:')
          ? span.target.slice('action:'.length)
          : null
        // Language buttons: rebuild the page in that language.
        const langCode = name?.startsWith('lang:') ? name.slice('lang:'.length) : null
        const action = !name
          ? null
          : langCode
            ? () => switchLanguage(langCode)
            : name.startsWith('menu:')
              ? () => openMenuEntry(name.slice('menu:'.length))
              : name.startsWith('toggle:')
                ? () => toggleLines(name.slice('toggle:'.length))
                : ACTIONS[name]

        const link =
          action ? (
            <button
              key={`l${n}`}
              className={
                langCode
                  ? `nano-link lang-button${langCode === lang ? ' active' : ''}`
                  : 'nano-link'
              }
              aria-pressed={langCode ? langCode === lang : undefined}
              onClick={() => action(say)}
              {...linkProps(i, span.k)}
            >
              {langCode ? <LangLabel code={langCode} /> : body}
            </button>
          ) : (
            <a
              key={`l${n}`}
              className="nano-link"
              href={span.target}
              {...linkProps(i, span.k)}
              {...(/^https?:|\.pdf$/i.test(span.target)
                ? { target: '_blank', rel: 'noreferrer' }
                : {})}
            >
              {body}
            </a>
          )
        // A link flagged `sparkle` on its line gets a spinner on each side.
        const piece =
          line.sparkle === span.target ? (
            <span key={`s${n}`} className="sparkled">
              <Sparkle kind={line.spinner} /> {link}{' '}
              <Sparkle kind={line.spinner} second />
            </span>
          ) : (
            link
          )
        // From the `pushFrom` link on, the rest of the line goes to the right.
        if (line.pushFrom === span.target) pushAt = pieces.length
        pieces.push(piece)
      }
      at = span.end
    })

    if (at < line.text.length) {
      pieces.push(<span key="tail">{withHighlight(shown.slice(at), at, hit)}</span>)
    }
    if (pushAt === -1) return pieces
    // Two blocks: the left part, and the right part that stays in one piece
    // (it moves under the left one as a whole when the line is too narrow).
    return [
      <span key="left">{pieces.slice(0, pushAt)}</span>,
      <span key="right" className="push-from">
        {pieces.slice(pushAt)}
      </span>,
    ]
  }

  // The gate asks how to read the CV. The menu is a terminal screen either
  // way, so it opens without asking; the question waits until an entry leads
  // somewhere that has two versions.
  if (view === 'gate' && page !== 'menu') {
    return <Gate onChoose={setView} />
  }

  if (view === 'standard' && page !== 'menu') {
    return <StandardView lang={lang} onLanguage={switchLanguage} onExit={() => setView('nano')} />
  }

  return (
    <div className="nano">
      {qrOpen && <QrOverlay onClose={() => setQrOpen(false)} />}
      <div className="nano-titlebar">
        <div className="bar-inner">
          <span className="version">GNU nano 8.4</span>
          <span className="file">
            ~/{screen === 'help' ? FILES.help : page === 'menu' ? FILES.menu : FILES.buffer}
            {modified && screen !== 'help' ? ' *' : ''}
          </span>
          {/* Where real nano says "Modified". */}
          <span className="signature">{'uid=0(elxss)'}</span>
          {/* Takes the signature's place on phones (see nano.css). */}
          <WallClock className="wall-clock" />
        </div>
      </div>

      <div className="nano-view">
      {screen === 'help' && (
        <div className="nano-body help" ref={bodyRef} tabIndex={-1}>
          <HelpScreen />
          <Rule />
          {renderPanel(helpFooter, -1)}
        </div>
      )}

      {screen === 'exited' && (
        <div className="nano-body exited" ref={bodyRef} tabIndex={-1}>
          <p>[ Buffer closed ]</p>
          <p className="dim">Press ^R to read the file back in.</p>
        </div>
      )}

      {screen === 'buffer' && (
        <div className="nano-body" ref={bodyRef} tabIndex={-1}>
          {lines.map((line, i) => {
            const isCursor = i === cursor
            if (line.type === 'nav') {
              return (
                <div
                  key={i}
                  ref={(el) => el && lineRefs.current.set(i, el)}
                  className={`line nav${isCursor ? ' cursor-line' : ''}`}
                >
                  <span className="path">elxss/index.jsx</span>
                  {navItems.map((item, k) =>
                    item.href ? (
                      <a
                        key={item.label}
                        className="nano-link"
                        href={item.href}
                        {...linkProps(i, k)}
                      >
                        [ {scrambled(item.label)} ]
                      </a>
                    ) : (
                      <button
                        key={item.label}
                        className={`nano-link${item.standout ? ' standout' : ''}`}
                        onClick={item.onClick}
                        {...linkProps(i, k)}
                      >
                        {item.gradient ? (
                          <GradientText
                            text={`[ ${item.label} ]`}
                            start={0}
                            span={parseGradient(item.gradient)}
                            hit={null}
                          />
                        ) : (
                          <>[ {scrambled(item.label)} ]</>
                        )}
                      </button>
                    ),
                  )}
                </div>
              )
            }
            if (line.type === 'drawing') {
              return (
                <div
                  key={i}
                  ref={(el) => el && lineRefs.current.set(i, el)}
                  className={`line drawing${isCursor ? ' cursor-line' : ''}`}
                  onClick={() => goToLine(i)}
                >
                  <div
                    className="panel-logo"
                    aria-hidden="true"
                    style={line.size ? { fontSize: `${line.size}em` } : undefined}
                  >
                    <PixelArt rows={line.rows} shimmer={line.shimmer} />
                  </div>
                </div>
              )
            }
            if (line.type === 'activity') {
              return (
                <div
                  key={i}
                  ref={(el) => el && lineRefs.current.set(i, el)}
                  className={`line activity${isCursor ? ' cursor-line' : ''}`}
                  onClick={() => goToLine(i)}
                >
                  <div className="activity-grid" aria-hidden="true">
                    {line.days.map((level, d) => (
                      <span
                        key={d}
                        className="activity-cell"
                        style={{ background: ACTIVITY_LEVELS[level] || ACTIVITY_LEVELS[0] }}
                      />
                    ))}
                  </div>
                </div>
              )
            }
            if (line.type === 'rule') return <Rule key={i} />
            if (line.logo) {
              return renderPanel(line, i, isCursor)
            }
            return (
              <div
                key={i}
                ref={(el) => el && lineRefs.current.set(i, el)}
                className={`line${line.art ? ' art' : ''}${line.centred ? ' centred' : ''}${
                  line.pushFrom ? ' push-split' : ''
                }${isCursor ? ' cursor-line' : ''}`}
                style={lineStyle(line)}
                onClick={() => goToLine(i)}
              >
                {renderText(line, i)}
              </div>
            )
          })}
        </div>
      )}
      <ScrollBar targetRef={bodyRef} watch={`${screen}:${lines.length}`} />
      </div>

      <div className="nano-prompt">
        {prompt ? (
          <label className="prompt-line">
            <span className="prompt-label">{PROMPT_LABELS[prompt.mode]}: </span>
            <input
              ref={promptInput}
              value={prompt.value}
              onChange={(e) => setPrompt({ ...prompt, value: e.target.value })}
              spellCheck="false"
              autoComplete="off"
            />
          </label>
        ) : (
          status && <div className="status">{status}</div>
        )}

        {track && !prompt && (
          <Marquee
            className="now-playing"
            still={song.busy}
            onContextMenu={copySongColors}
            title="Right-click to copy the gradient colors"
          >
            <GradientText
              text={song.text}
              start={0}
              span={{ gradient: songGradient, speed: 0 }}
              hit={null}
            />
          </Marquee>
        )}
      </div>

      <div className="nano-shortcuts">
        {shortcuts.map((s, k) => (
          <button
            key={s.key}
            className="nano-link"
            onClick={s.run}
            {...linkProps(barRow, k)}
          >
            [ <span className="key">{s.key}</span> {scrambled(s.label)} ]
          </button>
        ))}
      </div>
    </div>
  )
}
