// Single source of truth. The nano buffer and the standard view are both
// rendered from this — nothing is parsed back out of the text.
//
// Visibility: any section, entry, group or note may carry `show`.
//   (nothing)          shown everywhere            <- the default
//   show: 'nano'       terminal only, hidden from the standard CV
//   show: 'standard'   standard CV only, hidden from the terminal
// It hides, it does not secure: everything here ships in the JavaScript
// bundle either way. Anything that must stay private stays out of this file —
// which is why the phone number from the PDF is not here.

import { PROFILE_FR, SECTIONS_FR } from './cv.fr.js'

export const PROFILE = {
  name: 'Elias Ait Bahid',
  alias: 'Elxss',
  role: 'M1 student at Ecole 2600 - Full Stack Developer apprentice at ESSEC Business School',
  blurb: 'Full stack by trade, security by obsession.', // terminal, and the standard view's opening line
  footer: 'Made with love <3',
}

/**
 * Sections carry either `groups` (a label and its items) or `entries`.
 * An entry may have: title, meta, place, country, from/to or date, link,
 * summary, details (bullet points) and footer (a closing line such as a
 * stack). `country` follows the city in the standard view's Location.
 *
 * `placement` says how an entry's heading is laid out in the buffer:
 *   'below'  the place goes on its own indented line
 *   'inline' the place goes before the dates
 *   'meta'   the subtitle goes in parentheses after the title
 */
export const SECTIONS = [
  {
    id: 'skills',
    nano: 'Skills',
    heading: 'Skills',
    groups: [
      // `blurb`: one line under the label, standard view only.
      {
        label: 'DevSecOps',
        blurb: 'CI/CD pipelines that test, scan and ship the code.',
        items: 'GitHub Actions, Docker, SonarQube, Grafana',
      },
      {
        label: 'Infrastructure',
        blurb: 'A Proxmox homelab, split into VLANs, reached over WireGuard.',
        items: 'Linux, Proxmox, VLAN, WireGuard, Bash',
      },
      {
        label: 'Programming',
        blurb: 'From Java REST APIs to JavaScript front ends, plus C in contests.',
        items: 'Python, JavaScript, Java, PHP, SQL, C',
      },
      {
        label: 'Languages',
        blurb: 'Enough to work in English and get by in Spanish.',
        items: 'French fluent, English C1, Spanish B1, Arabic basics, Russian basics',
      },
    ],
    entries: [],
  },
  {
    id: 'education',
    nano: 'Education',
    heading: 'Education',
    placement: 'below',
    entries: [
      {
        title: 'MSc Cybersecurity (ANSSI SecNumedu)',
        place: 'Ecole 2600, Montigny-le-Bretonneux',
        country: 'France',
        from: 'September 2026',
        to: 'July 2028',
        // From the school's programme page (first year).
        details: [
          'Offensive: web vulnerabilities and exploits, low-level exploitation, Windows and Active Directory security',
          'Defensive: intrusion detection, OS hardening, risk analysis',
          'Development: Python, C, x86 assembly, secure full stack development',
          'Work-study: 2 weeks at school, 4 weeks at ESSEC',
          'Level 7 RNCP title: Data, network and systems security expert',
        ],
      },
      {
        title: 'BSc Computer Science',
        place: "Universite d'Artois, Jean Perrin, Lens",
        country: 'France',
        from: 'September 2023',
        to: 'July 2026',
        // From the university's programme sheet (RNCP 40116).
        details: [
          'Algorithms and programming: Python, C, x86 assembly, Java, JavaScript, PHP, Haskell',
          'Operating systems, databases, object-oriented design, networking, compilers',
          'Mathematics: logic, linear algebra, probability, statistics',
          'Final-year internship at EathVentum',
        ],
      },
    ],
  },
  {
    id: 'work',
    nano: 'Work Experiences',
    heading: 'Experience',
    placement: 'inline',
    entries: [
      {
        title: 'Full Stack Developer Apprentice',
        place: 'ESSEC Business School, Cergy-Pontoise',
        country: 'France',
        from: 'September 2026',
        to: 'NOW',
      },
      {
        title: 'Developer and DevOps Intern',
        place: 'EathVentum, Saint-Nicolas',
        country: 'France',
        from: 'March 2026',
        to: 'June 2026',
        details: [
          'Logistics management tool shipped to production, from API to handheld app',
          'Java REST API, React frontend, Electron app, ported to Zebra terminals',
          'GitHub Actions CI/CD pipeline',
          'Application-level rate limiting',
          'Grafana monitoring on application metrics',
          'Docker containerisation and automated deployments',
        ],
        footer:
          'Stack: Java, Python, React, Docker, GitHub Actions, SonarQube, Grafana, Linux, Proxmox',
      },
    ],
  },
  {
    id: 'competitions',
    nano: 'Competitions',
    heading: 'Competitions',
    placement: 'meta',
    // Entry details here are results (places, prizes): both views set them
    // apart from ordinary bullet points. `rank`: the result in a word or two,
    // set large on the standard view.
    results: true,
    entries: [
      {
        title: 'JERC',
        meta: 'C and Java programming contest',
        place: "Universite d'Artois, Jean Perrin, Lens",
        date: '5 December 2025',
        details: ['4th place'],
        rank: '4th',
      },
      {
        title: 'Junior CTF',
        meta: 'Cybersecurity contest',
        place: 'Ecole 2600, Montigny-le-Bretonneux',
        date: '13 April 2025',
        details: ['6th place'],
        rank: '6th',
      },
      {
        title: 'XPERIUM Challenge',
        meta: 'Multidisciplinary technical project',
        place: 'Universite de Lille',
        date: '21 October 2023',
        details: ['Bronze prize and Audience prize'],
        rank: 'Bronze',
        shine: true, // its result gets a glint in the terminal view
      },
      {
        title: 'Pi Day',
        meta: 'Academic mathematics contest',
        place: "Lycee d'Excellence Edgar Morin",
        date: '14 March 2023',
        details: ['Winner'],
        rank: '1st',
        shine: true,
      },
    ],
  },
  {
    id: 'projects',
    nano: 'Projects',
    heading: 'Projects',
    placement: 'meta',
    entries: [
      {
        // Terminal only: on the recruiter-facing page these two read as
        // "bypasses protections", whatever the intent.
        title: 'MegaUp.net Auto Downloader',
        show: 'nano',
        meta: 'JavaScript, web automation',
        from: 'August 2023',
        to: 'ongoing',
        footer: 'Skills: DOM, browser scripting, debugging',
      },
      {
        title: 'Image CAPTCHA Solver',
        show: 'nano',
        meta: 'Python, automation and image processing',
        date: 'October 2025',
        footer:
          'Skills: Python, Flask, image processing, automation, backend logic, algorithm design',
      },
      {
        title: 'Homelab',
        meta: 'Self-hosted infrastructure',
        date: 'Ongoing',
        show: 'standard',
        footer: 'Proxmox virtualisation, VLAN-segmented network, WireGuard remote access, Bash scripts',
      },
      {
        title: 'This website',
        meta: 'React, Vite',
        date: 'September 2026',
        show: 'standard',
        footer: 'Bilingual CV with two views: a nano-style terminal editor and this standard page',
      },
    ],
  },
  {
    id: 'references',
    nano: 'References',
    heading: 'References',
    // One quote per recommendation. The section stays hidden while empty.
    // Ask the author before publishing, and keep their private details
    // (phone, personal email, signature) out of here and out of the PDF.
    //   {
    //     text: 'One or two sentences from the letter.',
    //     author: 'First Last',
    //     role: 'CTO @ Company',
    //     pdf: '/documents/recommendation.pdf',   // optional, file in public/documents/
    //   },
    quotes: [
      {
        // From the letter of 15 June 2026, translated. The original reads:
        // "M. AIT BAHID est un étudiant sérieux, rigoureux et impliqué dans son
        // travail, il fait preuve d'une réelle motivation pour approfondir ses
        // connaissances et développer ses compétences."
        text:
          'Mr. AIT BAHID is a serious, rigorous student who is committed to his work, and he shows genuine motivation to deepen his knowledge and develop his skills.',
        // The whole letter, translated, for the "read it all" toggle.
        full: [
          'To whom it may concern,',
          "I had the opportunity to welcome Elias AIT BAHID at EathVentum for his Bachelor's degree internship.",
          'Mr. AIT BAHID is a serious, rigorous student who is committed to his work, and he shows genuine motivation to deepen his knowledge and develop his skills.',
          'I therefore recommend Mr. Elias Ait Bahid for any internship, work-study or job opportunity in the field of computer science, and wish him every success in the rest of his studies and career.',
        ],
        translated: 'French',
        author: 'Abdelfattah Hadji',
        role: 'President @ EathVentum',
        // Flattened copy with his email and signature blacked out.
        pdf: '/documents/recommendation.pdf',
      },
    ],
  },
  {
    id: 'interests',
    nano: 'Interests',
    heading: 'Interests',
    notes: [
      { text: 'here are some of the things I enjoy the most:', show: 'nano' },
    ],
    entries: [
      { title: 'Homelabbing' },
      { title: '3D modelling' },
      { title: 'Judo' },
      { title: 'Weight training' },
      { title: 'New cultures' },
      { title: 'Learning languages' },
    ],
  },
]

/** A section, entry, group or note is shown unless `show` names the other view. */
export function inView(item, view) {
  const show = (typeof item === 'object' && item?.show) || 'both'
  return show === 'both' || show === view
}

const noteText = (note) => (typeof note === 'string' ? note : note.text)

/** The sections for one view, with everything hidden from it removed. */
export function sectionsFor(view, sections = SECTIONS) {
  return sections
    .filter((section) => inView(section, view))
    .map((section) => ({
      ...section,
      notes: (section.notes || []).filter((n) => inView(n, view)).map(noteText),
      groups: (section.groups || []).filter((g) => inView(g, view)),
      entries: (section.entries || []).filter((e) => inView(e, view)),
      quotes: section.quotes?.filter((q) => inView(q, view)),
    }))
    // A quotes section with nothing to quote is left out entirely.
    .filter((section) => !section.quotes || section.quotes.length > 0)
}

// Other languages: their text laid over this file's (see cv.fr.js).
const TRANSLATIONS = {
  fr: { profile: PROFILE_FR, sections: SECTIONS_FR },
}

/** Items of `base` with the ones of `over` merged in, position by position. */
const mergeList = (base, over) =>
  base?.map((item, i) =>
    over?.[i] === undefined
      ? item
      : typeof item === 'string'
        ? over[i]
        : typeof over[i] === 'string'
          ? { ...item, text: over[i] }
          : { ...item, ...over[i] },
  )

/**
 * The CV in one language: { PROFILE, SECTIONS }, English (this file) with the
 * language's translated text laid over it. Unknown languages give English.
 */
export function contentFor(lang) {
  const t = TRANSLATIONS[lang]
  if (!t) return { PROFILE, SECTIONS }
  return {
    PROFILE: { ...PROFILE, ...t.profile },
    SECTIONS: SECTIONS.map((section) => {
      const over = t.sections[section.id]
      if (!over) return section
      return {
        ...section,
        ...(over.nano && { nano: over.nano }),
        ...(over.heading && { heading: over.heading }),
        notes: mergeList(section.notes, over.notes),
        groups: mergeList(section.groups, over.groups),
        entries: mergeList(section.entries, over.entries),
        quotes: mergeList(section.quotes, over.quotes),
      }
    }),
  }
}

/** Years join tight (2023-2026), written months breathe (March 2026 - July 2026). */
export function formatPeriod(entry) {
  if (entry.date) return entry.date
  if (!entry.from) return ''
  if (!entry.to) return String(entry.from)
  const tight = typeof entry.from === 'number' && typeof entry.to === 'number'
  return tight ? `${entry.from}-${entry.to}` : `${entry.from} - ${entry.to}`
}
