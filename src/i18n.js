// The site's own words, outside the CV itself (that is cv.js / cv.fr.js):
// links, buttons, the day and night lines, the footer. One object per
// language; a missing language falls back to English (see ui()).

export const UI = {
  en: {
    nav: { projects: 'projects', competitions: 'competitions', interests: 'interests' },
    notDev: 'Not a dev? Standard View',
    contact: 'Contact me at',
    copy: 'copy',
    here: 'here',
    resume: 'PDF Resume',
    mail: 'Mail',
    // Two rows, broken by hand: "$ fortune \u2192 " is 12 columns wide, so the
    // padding puts the second `if` under the first.
    dayBlurb: [
      '$ fortune → if you want to go fast, go alone;',
      '            if you want to go far, go together',
    ],
    nightNote: (from, to) => `this message only shows up between ${from} and ${to}`,
    readAll: '↓ read it all',
    showLess: '↑ show less',
    viewLetter: 'view the letter',
    translatedFrom: (language) => `(translated from ${language})`,
    open: 'open',
    // The scrolling line under the buffer (Marquee).
    nowPlaying: 'now listening to: ',
    lastPlayed: 'last listened to: ',
    built: (year, alias) => `(c) ${year} ${alias}, built with React + Vite, dressed as GNU nano`,
    endOf: (file) => `-- End of ${file} --`,
    shortcuts: { search: 'Where Is', github: 'GitHub', mail: 'Mail', qr: 'QR code' },
    soon: (language) => `${language}: coming soon`,
    // Under the globe, in Interests.
    globeQuote: ['"You live a new life for every new language you speak. If you know only one language, you live only once."', '-- Czech proverb'],
    // The menu page (menu.txt, at /menu).
    menu: {
      title: 'whoami ~ get to know me a bit',
      hint: 'press a number, or move with the arrows and press Enter',
      entries: {
        whoami: 'Who I am',
        about: 'What is this website',
        blog: 'Blog',
        resources: 'Resources',
        stats: 'Statistics',
      },
      unwritten: (name) => `${name}: not written yet`,
      activity: 'what I have been up to, last 30 days',
    },
    // Standard view.
    std: {
      nav: { path: 'Experience', skills: 'Skills', projects: 'Projects', contact: 'Contact' },
      // Under PROFILE.blurb, one line each.
      lede: ['Apprentice developer at ESSEC Business School.', 'MSc Cybersecurity student at Ecole 2600.'],
      meta: ['Full stack developer', 'Heading for DevSecOps', 'Île-de-France, France'],
      marquee: ['Full stack', 'DevSecOps', 'Cybersecurity', 'Homelab'],
      period: 'Period',
      place: 'Location',
      stack: 'Stack',
      resume: 'Resume',
      copyEmail: 'Copy email',
      emailCopied: 'Copied',
      viewLetter: 'Read the letter',
      terminal: 'Terminal view',
      footerTerminal: 'Check out the terminal view',
      now: 'now',
    },
  },
  fr: {
    nav: { projects: 'projets', competitions: 'compétitions', interests: 'intérêts' },
    notDev: 'Non Tech ? Vue standard',
    contact: 'Contactez-moi via',
    copy: 'copier',
    here: 'ici',
    resume: 'Telecharger mon CV PDF',
    mail: 'Mail',
    dayBlurb: '$ fortune → seul on va plus vite, ensemble on va plus loin',
    nightNote: (from, to) => `ce message ne s'affiche qu'entre ${from} et ${to}`,
    readAll: '↓ lire toute la lettre',
    showLess: '↑ réduire',
    viewLetter: 'voir la lettre',
    translatedFrom: (language) => `(traduit du ${language})`,
    open: 'ouvrir',
    nowPlaying: `j'ecoute maintenant : `,
    lastPlayed: 'dernière écoute : ',
    built: (year, alias) => `(c) ${year} ${alias}, fait avec React + Vite`,
    endOf: (file) => `-- Fin de ${file} --`,
    shortcuts: { search: 'Chercher', github: 'GitHub', mail: 'Mail', qr: 'QR code' },
    soon: (language) => `${language} : bientôt disponible`,
    globeQuote: [
      `« Pour chaque langue que l'on parle, on vit une nouvelle vie ; celui qui ne connaît qu'une langue ne vit qu'une seule fois »`,
      '-- proverbe tchèque',
    ],
    menu: {
      title: 'whoami ~ fais connaissance',
      hint: 'tape un chiffre, ou déplace-toi avec les flèches et appuie sur Entrée',
      entries: {
        whoami: 'Qui je suis',
        about: 'Ce site, c’est quoi',
        blog: 'Blog',
        resources: 'Ressources',
        stats: 'Statistiques',
      },
      unwritten: (name) => `${name} : pas encore écrit`,
      activity: 'ce que j’ai fait ces 30 derniers jours',
    },
    std: {
      nav: { path: 'Parcours', skills: 'Compétences', projects: 'Projets', contact: 'Contact' },
      lede: ["Développeur en alternance à l'ESSEC Business School.", "Étudiant en M1 cybersécurité à l'Ecole 2600."],
      meta: ['Développeur full stack', 'Cap sur le DevSecOps', 'Île-de-France, France'],
      marquee: ['Full stack', 'DevSecOps', 'Cybersécurité', 'Homelab'],
      period: 'Période',
      place: 'Lieu',
      stack: 'Stack',
      resume: 'CV',
      copyEmail: "Copier l'email",
      emailCopied: 'Copié',
      viewLetter: 'Lire la lettre',
      terminal: 'Vue terminal',
      footerTerminal: 'Découvrir la vue terminal',
      now: 'auj.',
    },
  },
}

/** Languages the site is actually written in. */
export const READY = Object.keys(UI)

/** The words for `lang`, English for a language not written yet. */
export const ui = (lang) => UI[lang] || UI.en
