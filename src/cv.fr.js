// French text for cv.js. Only the words change: everything else (dates as
// data, links, order, flags such as `results` or `show`) comes from cv.js,
// merged by section id and then by position (see contentFor in cv.js).
// Proper names stay as they are: schools, companies, contests, degrees'
// official names where they have one.

export const PROFILE_FR = {
  role:
    'Étudiant en M1 à Ecole 2600 - Développeur Full Stack en alternance à ESSEC Business School',
  blurb: 'Full stack par métier, sécurité par obsession.',
  footer: 'Fait avec amour <3',
}

export const SECTIONS_FR = {
  skills: {
    nano: 'Compétences',
    heading: 'Compétences',
    groups: [
      { label: 'DevSecOps', blurb: 'Des pipelines CI/CD qui testent, analysent et livrent le code.' },
      {
        label: 'Infrastructure',
        blurb: 'Un homelab Proxmox, segmenté en VLAN, accessible en WireGuard.',
      },
      {
        label: 'Programmation',
        blurb: 'Des API REST en Java au front en JavaScript, et du C en concours.',
      },
      {
        label: 'Langues',
        blurb: 'De quoi travailler en anglais et me débrouiller en espagnol.',
        items: 'Français courant, Anglais C1, Espagnol B1, Arabe (bases), Russe (bases)',
      },
    ],
  },
  education: {
    nano: 'Formation',
    heading: 'Formation',
    entries: [
      {
        title: 'MSc Cybersécurité (label ANSSI SecNumedu)',
        from: 'Septembre 2026',
        to: 'Juillet 2028',
        details: [
          'Offensif : vulnérabilités et exploits web, exploitation bas niveau, sécurité Windows et Active Directory',
          'Défensif : détection des intrusions, durcissement des systèmes, analyse de risques',
          'Développement : Python, C, assembleur x86, développement sécurisé full stack',
          "Alternance : 2 semaines à l'école, 4 semaines à l'ESSEC",
          'Titre RNCP niveau 7 : Expert de la sécurité des données, des réseaux et des systèmes',
        ],
      },
      {
        title: 'Licence Informatique',
        place: "Université d'Artois, Jean Perrin, Lens",
        from: 'Septembre 2023',
        to: 'Juillet 2026',
        details: [
          'Algorithmique et programmation : Python, C, assembleur x86, Java, JavaScript, PHP, Haskell',
          'Systèmes, bases de données, conception objet, réseaux, compilation',
          'Mathématiques : logique, algèbre linéaire, probabilités, statistiques',
          'Stage de fin de licence chez EathVentum',
        ],
      },
    ],
  },
  work: {
    nano: 'Expériences professionnelles',
    heading: 'Expérience',
    entries: [
      {
        title: 'Développeur Full Stack en alternance',
        from: 'Septembre 2026',
        to: "Actuellement",
        details: [
          "Participation à la conception et au développement de solutions à destination du personnel de l'établissement et des étudiants",
        ],
      },
      {
        title: 'Stage développeur et DevOps',
        from: 'Mars 2026',
        to: 'Juin 2026',
        details: [
          "Outil de gestion logistique mis en production, de l'API à l'application sur terminal mobile",
          'API REST en Java, front React, application Electron, portée sur terminaux Zebra',
          'Pipeline CI/CD GitHub Actions',
          "Limitation de débit au niveau de l'application",
          'Supervision Grafana des métriques applicatives',
          'Conteneurisation Docker et déploiements automatisés',
        ],
        footer:
          'Stack : Java, Python, React, Docker, GitHub Actions, SonarQube, Grafana, Linux, Proxmox',
      },
    ],
  },
  competitions: {
    nano: 'Compétitions',
    heading: 'Compétitions',
    entries: [
      {
        meta: 'concours de programmation C et Java',
        place: "Université d'Artois, Jean Perrin, Lens",
        date: '5 décembre 2025',
        details: ['4e place'],
        rank: '4e',
      },
      {
        meta: 'concours de cybersécurité',
        date: '13 avril 2025',
        details: ['6e place'],
        rank: '6e',
      },
      {
        meta: 'projet technique pluridisciplinaire',
        place: 'Université de Lille',
        date: '21 octobre 2023',
        details: ['Prix de bronze et prix du public'],
        rank: 'Bronze',
      },
      {
        meta: 'concours académique de mathématiques',
        place: "Lycée d'Excellence Edgar Morin",
        date: '14 mars 2023',
        details: ['Vainqueur'],
        rank: '1er',
      },
    ],
  },
  projects: {
    nano: 'Projets',
    heading: 'Projets',
    entries: [
      {
        meta: 'JavaScript, automatisation web',
        from: 'Août 2023',
        to: 'en cours',
        footer: 'Compétences : DOM, scripts navigateur, débogage',
      },
      {
        title: "Solveur de CAPTCHA d'images",
        meta: "Python, automatisation et traitement d'image",
        date: 'Octobre 2025',
        footer:
          "Compétences : Python, Flask, traitement d'image, automatisation, logique backend, conception d'algorithmes",
      },
      {
        meta: 'Infrastructure auto-hébergée',
        date: 'En cours',
        footer: 'Virtualisation Proxmox, réseau segmenté en VLAN, accès distant WireGuard, scripts Bash',
      },
      {
        title: 'Ce site',
        meta: 'React, Vite',
        date: 'Septembre 2026',
        footer: 'CV bilingue à deux vues : un éditeur façon nano dans le terminal et cette page standard',
      },
    ],
  },
  references: {
    nano: 'Références',
    heading: 'Références',
    quotes: [
      {
        // The letter is in French: quoted as written, nothing translated.
        text: "M. AIT BAHID est un étudiant sérieux, rigoureux et impliqué dans son travail, il fait preuve d'une réelle motivation pour approfondir ses connaissances et développer ses compétences.",
        full: [
          'À qui de droit,',
          "J'ai eu l'occasion d'accueillir Elias AIT BAHID au sein d'EathVentum dans le cadre de son stage de Licence.",
          "M. AIT BAHID est un étudiant sérieux, rigoureux et impliqué dans son travail, il fait preuve d'une réelle motivation pour approfondir ses connaissances et développer ses compétences.",
          "Je recommande donc Monsieur Elias Ait Bahid pour toute opportunité de stage, d'alternance ou d'emploi dans le domaine de l'informatique et lui souhaite pleine réussite dans la suite de son parcours.",
        ],
        translated: null,
        role: "Président @ EathVentum",
      },
    ],
  },
  interests: {
    nano: "Centres d'intérêt",
    heading: "Centres d'intérêt",
    notes: ['voici ce que j’aime le plus :'],
    entries: [
      { title: 'Homelab' },
      { title: 'Modélisation 3D' },
      { title: 'Judo' },
      { title: 'Musculation' },
      { title: "Découvrir d'autres cultures" },
      { title: 'Apprendre des langues' },
    ],
  },
}
