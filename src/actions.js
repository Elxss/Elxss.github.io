// Targets written as `action:name` in the buffer resolve to these.
// Each one gets a `say` callback so it can report back in the nano status bar.

export const EMAIL = 'elxssgitcontact@gmail.com'

export const LINKS = {
  github: 'https://github.com/Elxss',
  site: 'https://elxss.me',
  mail: `mailto:${EMAIL}`,
}

/**
 * Open a URL in a new tab from a real click. Uses a synthetic <a> rather than
 * window.open(url, '_blank', features), whose feature string makes the browser
 * treat the call as a popup request.
 */
export function openExternal(url) {
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export const ACTIONS = {
  'copy-email': async (say) => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      say(`Copied ${EMAIL} to the clipboard`)
    } catch {
      say(`Clipboard blocked — the address is ${EMAIL}`)
    }
  },
}
