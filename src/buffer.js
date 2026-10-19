// The page content modelled as a nano buffer: an array of lines.
// Line indexes are what ^C (location), ^/ (go to line) and ^F (where is) work on.
//
// The buffer text is GENERATED from cv.js, so the terminal view and the
// standard view cannot drift apart. Only the free-form lines below (intro,
// contact, footer) are written by hand here.
//
// Inline links use `[ label ](target)`. Only `[ label ]` is displayed; the
// target is stripped out at parse time so it never shows up on the page and
// never matches a ^F search. A target is either:
//   - a URL / path / mailto / #anchor  -> rendered as an <a>
//   - `action:name`                    -> rendered as a <button>, see actions.js

import { SECTIONS, contentFor, formatPeriod, sectionsFor } from './cv.js'
import { ui } from './i18n.js'
import { EMAIL, LINKS } from './actions.js'
import { colors, colorsFromText } from './gradients.js'
import { GLOBE, PALETTE, PORTFOLIO, SHIELD, TREE } from './icons.js'

// The sections the nav line jumps to; their labels are in i18n.js (nav).
export const NAV_LINKS = ['projects', 'competitions', 'interests']

// The language the buffer is being built in, set by setLanguage() at the start
// of buildLines() and footerLine(): the CV (P, S) and the site's words (T).
// Everything below reads them while it builds, synchronously.
let P
let S
let T

function setLanguage(lang) {
  ;({ PROFILE: P, SECTIONS: S } = contentFor(lang))
  T = ui(lang)
}

const RULE = '-'.repeat(30)

// Parts of the role line (under the name) that get an animated gradient:
// { text: gradient spec }. The role itself stays plain text in cv.js.
const ROLE_HIGHLIGHTS = {
  'Ecole 2600': 'cyan_to_purple!decrypt',
}

/** `text` with each name of `names` wrapped in its gradient spec. */
function highlight(text, names) {
  return Object.entries(names).reduce(
    (out, [name, spec]) => out.replace(name, `{{${name}}}(${spec})`),
    text,
  )
}

// Name line, shared by the top of the page and the footer.
const nameLine = () => `{{${P.name}}}(purple_to_blue) aka {{${P.alias}}}(purple_to_blue)`

/**
 * The line under the role depends on the visitor's clock, read when the page
 * loads: from 18:00 to 08:00 (NIGHT) the night one, in red to pastel red; the rest
 * of the day the day one, in the tree's dark to light green. Both slide.
 */
const blurbs = () => ({
  // One glint for the line and its note below (!shine.night).
  night: { text: P.blurb, gradient: '#ef4444>#fca5a5*16~6!shine.night' },
  day: { text: T.dayBlurb, gradient: '#008000>#00ff00*16~6' },
})

// ?hour=11 in the URL pretends it is that hour, to preview either version.
function visitorHour() {
  const forced = Number.parseInt(new URLSearchParams(globalThis.location?.search).get('hour'), 10)
  return forced >= 0 && forced < 24 ? forced : new Date().getHours()
}

// The night runs from NIGHT.from:00 to NIGHT.to:00, across midnight.
const NIGHT = { from: 18, to: 8 }
const clock = (hour) => `${String(hour).padStart(2, '0')}:00`

/** The line (or lines) under the role, for the visitor's hour. */
function blurbLines(hour = visitorHour()) {
  const night = hour >= NIGHT.from || hour < NIGHT.to
  const { text, gradient } = night ? blurbs().night : blurbs().day
  // A blurb may be given as several rows (the day one is, to break a long
  // saying where it reads best); each row gets the gradient of its own.
  const lines = (Array.isArray(text) ? text : [text]).map((row) => `{{${row}}}(${gradient})`)
  // The night line says it is one, in its own colours, so a daytime revisit
  // is no surprise.
  if (night) {
    const note = T.nightNote(clock(NIGHT.from), clock(NIGHT.to))
    lines.push(`{{${note}}}(${gradient})`)
  }
  return lines
}

// Beside the tree (see introLine).
// The role's parts (split on ' - ') each get their own line.
// The language switch under the intro. Buttons only for now: the actions
// (action:lang:<code>) do nothing yet, see App.jsx.
export const LANGUAGES = [
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'en', label: 'English' },
]

const intro = () => [
  nameLine(),
  ...P.role.split(' - ').map((part) => highlight(part, ROLE_HIGHLIGHTS)),
  '',
  ...blurbLines(),
  '',
  LANGUAGES.map(({ code, label }) => `[ ${label} ](action:lang:${code})`).join('  '),
]

// Under the intro, centred (see introLine).
const contact = () => [
  `${T.contact} ${EMAIL} [ ${T.copy} ](action:copy-email)`,
  `GitHub [ ${T.here} ](${LINKS.github})`,
  // The resume gets its own twinkle, so it reads as a second thing worth
  // clicking rather than an echo of the letter's spinners.
  {
    raw: `[ ${T.resume} ${T.here} ](/documents/cv_elias.pdf)`,
    sparkle: '/documents/cv_elias.pdf',
    spinner: 'twinkle',
  },
]

// A few accents on what matters, and nothing else: section titles get the
// site gradient, entry titles and skill groups one soft colour, results
// (places, prizes) another. Dates, places and details stay plain.
const ACCENT = {
  heading: 'purple_to_blue',
  title: '#c4b5fd',
  result: '#e7be55',
}
// Sections whose details are results worth pointing out (`results` in cv.js).
const RESULT_SECTIONS = new Set(SECTIONS.filter((s) => s.results).map((s) => s.id))
// Names that get an animated gradient where they appear as a place, per
// section: { section id: { name: gradient spec } }.
const PLACE_HIGHLIGHTS = {
  education: { 'Ecole 2600': 'cyan_to_purple!glitch' },
}

/** A place, with any highlighted name in it wrapped in its gradient. */
function placeText(place, sectionId) {
  return highlight(place, PLACE_HIGHLIGHTS[sectionId] || {})
}

/** `text` in one solid colour, through the gradient syntax. */
const paint = (text, color) => `{{${text}}}(${color}>${color})`

function headLine(entry, placement) {
  const period = formatPeriod(entry)
  const title = paint(entry.title, ACCENT.title)

  if (placement === 'inline') {
    const head = entry.place ? `${title} @ ${entry.place}` : title
    return period ? `- ${head}: ${period}` : `- ${head}`
  }

  if (placement === 'meta') {
    const head = entry.meta ? `${title} (${entry.meta})` : title
    return period ? `- ${head} : ${period}` : `- ${head}`
  }

  return period ? `- ${title} : ${period}` : `- ${title}`
}

function entryLines(entry, placement, sectionId) {
  const lines = [headLine(entry, placement)]
  const detail = (text) => {
    if (!RESULT_SECTIONS.has(sectionId)) return text
    // `shine` in cv.js: this entry's result also gets a glint (!shine).
    const shine = entry.shine ? '!shine' : ''
    return `{{${text}}}(${ACCENT.result}>${ACCENT.result}${shine})`
  }

  if (entry.place && placement !== 'inline') {
    lines.push(`  @ ${placeText(entry.place, sectionId)}`)
  }
  if (entry.link) lines.push(`  [ ${T.open} ](${entry.link})`)
  if (entry.summary) lines.push(`  ${entry.summary}`)
  for (const item of entry.details || []) lines.push(`  * ${detail(item)}`)
  if (entry.footer) lines.push(`  ${entry.footer}`)

  return lines
}

/**
 * Entries of a section. As soon as one of them spans several lines, they are
 * separated by a blank line so the block stays readable.
 */
function entriesBlock(section) {
  const blocks = section.entries.map((entry) =>
    entryLines(entry, section.placement, section.id),
  )
  const airy = blocks.some((block) => block.length > 1)
  return blocks.flatMap((block, i) => (airy && i > 0 ? ['', ...block] : block))
}

/** A recommendation: the quote, who said it, and the full letter if any. */
function quoteLines(quote, n) {
  // A translated quote says so, since the words are not the author's own.
  const note = quote.translated ? ` ${T.translatedFrom(quote.translated)}` : ''
  const byline = `  -- ${paint(quote.author, ACCENT.title)}, ${quote.role}${note}`
  // The buttons sit at the far right of the author's line (`pushFrom`: the
  // link from which everything goes right); the letter link is framed by two
  // spinners (Sparkle.jsx) to catch the eye.
  const letter = quote.pdf ? `   [ ${T.viewLetter} ](${quote.pdf})` : ''
  const flags = quote.pdf ? { pushFrom: quote.pdf, sparkle: quote.pdf } : {}

  // Lines are kept raw ({ raw, ...flags }): the parser is defined further
  // down this file and cannot run yet while text() is being built.
  if (!quote.full) {
    return [`"${quote.text}"`, letter ? { raw: byline + letter, ...flags } : byline]
  }

  // With the full letter available, both lines have a second version (`alt`)
  // that the "read it all" / "show less" button swaps in: see toggleLines in
  // App.jsx. The paragraphs share one buffer line, split by blank lines.
  const group = `letter-${n}`
  const toggle = (label) => `  [ ${label} ](action:toggle:${group})`
  return [
    { raw: `"${quote.text}"`, alt: `"${quote.full.join('\n\n')}"`, toggle: group },
    {
      // The arrow says which way the text goes: down to unfold, up to fold.
      raw: byline + toggle(T.readAll) + letter,
      alt: byline + toggle(T.showLess) + letter,
      toggle: group,
      ...flags,
      // Both buttons sit together at the right edge, the toggle first.
      pushFrom: `action:toggle:${group}`,
    },
  ]
}

// Sections whose body is drawn beside a pixel icon (icons.js), on its right,
// and the icon's size in em.
const SECTION_ICONS = {
  // `shimmer`: the corner its animated gradient starts from (PixelArt.jsx).
  skills: { icon: PORTFOLIO, size: 0.2 },
  competitions: { icon: SHIELD, size: 0.2 },
  // `caption`: rows drawn under the icon (see .panel-under in nano.css).
  interests: { icon: GLOBE, size: 0.2, caption: () => T.globeQuote },
}

/**
 * A section body as one panel line: its rows on the left, the section's icon
 * on their right. Kept as { panel: ... } until buildLines, where the
 * parser can run.
 */
function iconBlock(section, rows) {
  const { icon, size, shimmer, caption } = SECTION_ICONS[section.id]
  return [
    {
      panel: {
        type: section.id,
        icon,
        rows,
        options: {
          dimLast: false,
          logoSize: size,
          logoRight: true,
          pixel: true,
          shimmer,
          underRows: caption ? caption() : [],
        },
      },
    },
  ]
}

function sectionLines(section) {
  const body = section.quotes?.length
    ? section.quotes.flatMap((quote, i) =>
        i > 0 ? ['', ...quoteLines(quote, i)] : quoteLines(quote, i),
      )
    : section.groups?.length
    ? section.groups.map((group) => `- ${paint(group.label, ACCENT.title)}: ${group.items}`)
    : section.inline
      ? [section.entries.map((entry) => entry.title).join(', ')]
      : entriesBlock(section)

  // Bodies of plain text lines can sit beside the section's icon.
  const iconic = SECTION_ICONS[section.id] && body.every((line) => typeof line === 'string')

  return [
    // The heading knows its section, for the nav line's jumps (App.jsx).
    { raw: `{{*${section.nano}}}(${ACCENT.heading})`, section: section.id },
    RULE,
    ...(section.notes || []).flatMap((note, i) => (i === 0 ? [note] : ['', note])),
    ...(section.notes?.length && body.length ? [''] : []),
    ...(iconic ? iconBlock(section, body) : body),
    '',
  ]
}

// Logo shown under the footer, drawn in a small font (see .line.art).
// A line's `art` is its font size in em.
const LOGO = [
  '          ███████████████████████████████                   ███████████████               ',
  '        ███████████████████████████████████               ███████████████                 ',
  '      █████████████████████████████████████             ███████████████                   ',
  '    ███████████████████████████████████████           ███████████████                     ',
  '  ████████████████████████████████████████          ███████████████       ███████████     ',
  '███████████             ████████████████          ███████████████      ████████████████   ',
  '███████████           ████████████████          ███████████████      ████████████████████ ',
  '███████████         ████████████████           ██████████████      ███████████████████████',
  '███████████       ████████████████             ████████████      █████████████████████████',
  '███████████     ████████████████               ███████████     ███████████████████████████',
  '███████████   ████████████████                 ███████████   ████████████████  ███████████',
  '            ████████████████    ███████████    ███████████ ████████████████    ███████████',
  '          ████████████████      ███████████    ██████████████████████████      ███████████',
  '        ████████████████        ███████████    ████████████████████████        ███████████',
  '      ████████████████          ███████████    ██████████████████████          ███████████',
  '    ████████████████            ███████████    ████████████████████            ███████████',
  '  █████████████████████████████████████████    ███████████████████████████████████████████',
  ' ████████████████████████████████████████      ███████████████████████████████████████████',
  '███████████████████████████████████████        ██████████████████████████████████████████ ',
  '█████████████████████████████████████          █████████████████████████████████████████  ',
  ' ██████████████████████████████████            ███████████████████████████████████████    ',
  '   ██████████████████████████████              ███████████████████████████████████        ',
  '',
  '        ███████████████████████████████████    █████████████████████           ███████████',
  '    ███████████████████████████████████████    █████████████████████           ███████████',
  '  █████████████████████████████████████████    █████████████████████           ███████████',
  ' ██████████████████████████████████████████    █████████████████████           ███████████',
  '███████████████████████████████████████████    █████████████████████           ███████████',
  '███████████████████████████████████████████    █████████████████████           ███████████',
  '███████████            ████████████████████    ███████████          ███████████           ',
  '███████████          ██████████████████████    ███████████          ███████████           ',
  '███████████        ████████████████████████    ███████████          ███████████           ',
  '███████████      ██████████████████████████    ███████████          ███████████           ',
  '███████████    ████████████████ ███████████    ███████████          ███████████           ',
  '███████████  ████████████████   ███████████    ███████████                     ███████████',
  '███████████████████████████     ███████████    ███████████                     ███████████',
  '█████████████████████████       ███████████    ███████████                     ███████████',
  '███████████████████████         ███████████    ███████████                     ███████████',
  '█████████████████████           ███████████    ███████████                     ███████████',
  '███████████████████             ███████████    ███████████                     ███████████',
  '███████████████████████████████████████████              █████████████████████████████████',
  ' ██████████████████████████████████████████              █████████████████████████████████',
  '  ████████████████████████████████████████               █████████████████████████████████',
  '   █████████████████████████████████████                 █████████████████████████████████',
  '      ███████████████████████████████                    █████████████████████████████████',
]

// The intro is not in here: it is a panel beside the tree, see introLine.
// The intro panel comes first, see buildLines.
const text = () => ['', ...sectionsFor('nano', S).flatMap(sectionLines)]

// The page footer: the logo on the left, a few lines of text on the right.
// Text rows take the usual buffer syntax ([ links ](...), {{gradients}}(...)).
// The last row names the file being shown (whoami.txt, help.txt).
// "Made with love <3" hides next to the name, black on the black page: it
// only shows when selected, or under the grey band of the cursor.
const footerText = (file) => [
  `${nameLine()}  {{${P.footer}}}(#000000>#000000)`,
  `GitHub [ ${T.here} ](${LINKS.github})  ${T.mail} [ ${T.copy} ](action:copy-email)`,
  T.built(new Date().getFullYear(), P.alias),
  T.endOf(file),
]

const LINK_RE = /\[\s*([^\]\n]+?)\s*\]\(([^)\n]+)\)/g
// {{text}}(preset) spans the text once; {{text}}(preset*12) repeats the
// gradient every 12 characters. /N cuts the text into N equal runs of letters
// that each get one colour: {{text}}(preset/8) is an 8-step ramp, and
// {{text}}(preset*4/8) repeats every 4 runs. ~N makes the gradient move N
// units a second: {{text}}(preset*12~6). +N only matters in gradientBlock:
// horizontally, each line starts the ramp N letters further right than the
// one above; from a corner, it sets the slope (one line = N letters).
// Instead of a preset, the colours can be given directly: #ff0000>#0000ff.
// !name adds an animation from effects.js: !shine, !pulse, !glitch, !decrypt.
// !shine.name chains spans across lines: one glint runs through all the
// spans of that name in order (see chainGradients).
const GRADIENT_RE =
  /\{\{([^}\n]+?)\}\}\(([a-z_]+|#[0-9a-fA-F]{3,6}(?:>#[0-9a-fA-F]{3,6})+)(?:\*(\d+))?(?:\/(\d+))?(?:~(\d+(?:\.\d+)?))?(?:\+(\d+))?(?:!([a-z]+)(?:\.([a-z0-9_-]+))?)?\)/g

/**
 * The options of a gradient spec ('fire*8/4~2+1' or '#aaa>#bbb*8'), as the
 * span object GradientText takes, for gradients set outside the buffer text.
 */
export function parseGradient(spec) {
  return parseLine(`{{x}}(${spec})`).gradients[0] || { gradient: spec, speed: 0 }
}

/**
 * Split a raw line into the text actually shown and the ranges inside that
 * text which are clickable. Offsets are into the *displayed* string, so search
 * highlighting and ^C character counts stay correct.
 */
export function parseLine(raw) {
  const links = []
  const gradients = []

  // Gradients first, so the link offsets are computed on the final text.
  GRADIENT_RE.lastIndex = 0
  let stripped = ''
  let last = 0
  let m
  while ((m = GRADIENT_RE.exec(raw)) !== null) {
    stripped += raw.slice(last, m.index)
    gradients.push({
      start: stripped.length,
      end: stripped.length + m[1].length,
      gradient: m[2],
      cycle: m[3] ? Number(m[3]) : 0,
      groups: m[4] ? Number(m[4]) : 0,
      speed: m[5] ? Number(m[5]) : 0,
      skew: m[6] ? Number(m[6]) : 0,
      effect: m[7] || '',
      chainName: m[8] || '',
    })
    stripped += m[1]
    last = m.index + m[0].length
  }
  stripped += raw.slice(last)

  let text = ''
  last = 0
  LINK_RE.lastIndex = 0
  while ((m = LINK_RE.exec(stripped)) !== null) {
    text += stripped.slice(last, m.index)
    const label = `[ ${m[1]} ]`
    links.push({ start: text.length, end: text.length + label.length, target: m[2] })
    text += label
    last = m.index + m[0].length
  }
  text += stripped.slice(last)

  return { type: 'text', text, links, gradients }
}

/**
 * Colour a multi-line drawing as one piece. `spec` is what goes in the
 * parentheses of {{text}}(spec), e.g. 'fire*8/4' or 'fire/8~2+1'; `direction` is
 * 'horizontal', 'vertical', or the corner a diagonal starts from: 'top-left',
 * 'top-right', 'bottom-left', 'bottom-right'. Lines are padded to the same width
 * so a column keeps its colour from one line to the next.
 */
function gradientBlock(rows, spec, direction = 'horizontal') {
  const width = Math.max(...rows.map((raw) => raw.length))
  return rows.map((raw, row) => {
    if (!raw.trim()) return parseLine(raw)
    const line = parseLine(`{{${raw.padEnd(width)}}}(${spec})`)
    const gradient = line.gradients[0]
    gradient.block = { direction, row, rows: rows.length, skew: gradient.skew }
    return line
  })
}

/**
 * A panel: one buffer line (the cursor treats it as a block) holding a logo
 * on the left and text rows on the right. Its links are numbered across all
 * the text rows, so the arrows walk through them in order; its `text` is the
 * text rows joined, which is what ^F searches. The last row is drawn dim.
 */
/**
 * Gives every gradient span named with !effect.name its place in its chain:
 * { offset, total } in letters, counted across the rows in order. An effect
 * that knows its chain (shine) then runs through them as one text.
 */
function chainGradients(rows) {
  const chains = {}
  for (const row of rows) {
    for (const span of row.gradients || []) {
      if (!span.chainName) continue
      const chain = (chains[span.chainName] ||= { total: 0, spans: [] })
      span.chain = { offset: chain.total }
      chain.total += span.end - span.start
      chain.spans.push(span)
    }
  }
  for (const { total, spans } of Object.values(chains)) {
    for (const span of spans) span.chain.total = total
  }
  return rows
}

/** A panel row: a raw string, or { raw, ...flags } as buffer lines may be. */
const parseRow = (row) =>
  typeof row === 'string' ? parseLine(row) : { ...parseLine(row.raw), ...row }

function panelLine(
  type,
  logo,
  textRows,
  {
    dimLast = true,
    logoSize,
    logoRight = false,
    pixel = false,
    shimmer = 'top-left',
    underRows = [],
  } = {},
) {
  const rows = chainGradients(textRows.map(parseRow))
  const under = underRows.map(parseRow)
  const links = []
  // Each link also knows which text row it sits on (`row`), so the up and
  // down arrows can go from one row of links to the next inside the panel.
  ;[...rows, ...under].forEach((row, r) => {
    row.links = row.links.map((link) => {
      const numbered = { ...link, k: links.length, row: r }
      links.push(numbered)
      return numbered
    })
  })
  return {
    type,
    text: [...rows, ...under].map((row) => row.text).join(' '),
    links,
    logo,
    rows,
    // Rows under the drawing and the text.
    under,
    dimLast,
    logoSize,
    logoRight,
    // `logo` is pixel runs (pixelRows) rather than text rows.
    pixel,
    // Where the pixel logo's animated gradient starts (PixelArt.jsx).
    shimmer,
  }
}

/**
 * Pixel rows (one letter per pixel, '.' transparent) as runs of one colour:
 * [[{ n, color }]], color null for transparent. PixelArt.jsx draws each
 * pixel as a true square, whatever the font's proportions.
 */
function pixelRows(rows, palette) {
  return rows.map((row) =>
    [...row.matchAll(/(.)\1*/g)].map(([run, key]) => ({
      n: run.length,
      color: key === '.' ? null : palette[key],
    })),
  )
}

/**
 * The top of the page, neofetch style: the favicon tree beside the intro,
 * and the contact lines centred under both.
 */
function introLine() {
  return panelLine('intro', pixelRows(TREE, PALETTE), intro(), {
    dimLast: false,
    logoSize: 0.28,
    pixel: true,
    underRows: contact(),
  })
}

// File names shown in the title bar and at the end of the footer.
export const FILES = { buffer: 'whoami.txt', help: 'help.txt', menu: 'menu.txt' }

export function footerLine(file = FILES.buffer, lang = 'en') {
  setLanguage(lang)
  return panelLine(
    'footer',
    gradientBlock(LOGO, 'purple_to_blue*10/12~3+1', 'bottom-left'),
    footerText(file),
  )
}

// Logo of the "most played" panel. A copy of the footer logo for now, meant
// to be swapped for a more fitting drawing.
const TOP_LOGO = LOGO
// Which Last.fm period the ranking covers, and how it is worded on the page.
export const TOP_PERIOD = { id: '1month', label: 'this month' }

/**
 * The "most played" panel, from the tracks fetched in useTopTracks.js:
 * [{ artist, title, plays }] (null while loading). Each song is drawn in the
 * same two colours as when it shows up in the now-playing line.
 */
export function topTracksLine(tracks) {
  const body = !tracks
    ? ['loading...']
    : !tracks.length
      ? ['nothing played yet']
      : tracks.map((track, n) => {
          const name = `${track.artist} - ${track.title}`
          const safe = name.replace(/[{}]/g, '')
          return `${n + 1}. {{${safe}}}(${colors(...colorsFromText(name))})  ${track.plays} plays`
        })

  return panelLine('top', gradientBlock(TOP_LOGO, 'purple_to_blue*10/12~3+1', 'bottom-left'), [
    `{{Most played}}(purple_to_blue) ${TOP_PERIOD.label}`,
    ...body,
    '-- from Last.fm --',
  ])
}

/** The whole buffer, in `lang` ('en', 'fr'...). */
export function buildLines(lang = 'en') {
  setLanguage(lang)
  return [
    { type: 'nav', text: 'elxss/index.jsx', links: [] },
    { type: 'rule', text: '', links: [] },
    introLine(),
    // Most lines are raw strings; a few are { raw, ...layout flags }, and a few
    // { panel } for a block beside an icon.
    ...text().map((line) =>
      typeof line === 'string'
        ? parseLine(line)
        : line.panel
          ? panelLine(
              line.panel.type,
              pixelRows(line.panel.icon, PALETTE),
              line.panel.rows,
              line.panel.options,
            )
          : { ...parseLine(line.raw), ...line },
    ),
    // "Most played" panel, switched off for now. To bring it back, uncomment
    // these two lines and the useTopTracks block in App.jsx.
    // { type: 'rule', text: '', links: [] },
    // topTracksLine(null),
    { type: 'rule', text: '', links: [] },
    footerLine(FILES.buffer, lang),
  ]
}

// The menu page (menu.txt, served at /menu). `to` is the path an entry opens;
// an entry without one is not written yet and says so when picked. Order is
// the order on screen, and the number each entry answers to.
export const MENU = [
  { key: 'whoami', to: '/' },
  { key: 'about' },
  { key: 'blog' },
  { key: 'resources' },
  { key: 'stats' },
]

// The banner over the menu: the title between two runs of the same pattern.
const BANNER = '-_-_-'

// The activity grid under the menu: 30 days, ten a row, oldest first. A day's
// value is how busy it was, 0 to 4; the scale runs from a spent purple through
// a pale one to white, so a full day is the brightest square on the page.
// The grid is drawn by App.jsx rather than written as text, so it can centre
// itself and follow the width of the window.
export const ACTIVITY_LEVELS = ['#2e1065', '#5b21b6', '#8b5cf6', '#c4b5fd', '#ffffff']
export const ACTIVITY_COLUMNS = 10

// Sample data, only so the scale can be seen while the grid is being drawn.
// Nothing reads it from anywhere yet: replace it with real counts (GitHub,
// Root-Me, ...), thirty values from 0 to 4, oldest first, before this goes
// anywhere public.
export const ACTIVITY = [
  0, 1, 0, 2, 3, 1, 0, 0, 2, 4,
  1, 0, 3, 2, 2, 0, 1, 4, 3, 1,
  0, 2, 1, 0, 3, 4, 2, 1, 0, 2,
]

/** The whole menu buffer, in `lang`. */
export function buildMenuLines(lang = 'en') {
  setLanguage(lang)
  const M = T.menu
  return [
    { type: 'rule', text: '', links: [] },
    parseLine(''),
    // The favicon tree over the menu, as on the CV page but on its own and
    // centred (see .line.drawing in nano.css).
    { type: 'drawing', rows: pixelRows(TREE, PALETTE), size: 0.28, text: '', links: [] },
    parseLine(''),
    { ...parseLine(`{{${BANNER} ${M.title} ${BANNER}}}(purple_to_blue*24~4)`), centred: true },
    parseLine(''),
    // The number is inside the button: centred, a number hanging off to the
    // left of the bracket would not line up with anything.
    ...MENU.map((item, i) => ({
      ...parseLine(`[ ${i + 1} - ${M.entries[item.key]} ](action:menu:${item.key})`),
      centred: true,
    })),
    parseLine(''),
    { ...parseLine(`{{${M.hint}}}(#6b7280>#6b7280)`), centred: true },
    parseLine(''),
    // Centred like the grid it labels (see .line.centred in nano.css).
    { ...parseLine(`{{${M.activity}}}(#6b7280>#6b7280)`), centred: true },
    { type: 'activity', days: ACTIVITY, text: '', links: [] },
    { type: 'rule', text: '', links: [] },
    footerLine(FILES.menu, lang),
  ]
}

export const charCount = (lines) =>
  lines.reduce((n, l) => n + l.text.length + 1, 0)
