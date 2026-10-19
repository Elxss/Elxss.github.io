import { useCallback, useEffect, useRef, useState } from 'react'

// Last.fm scrobbles whatever Spotify plays, and reading a user's recent tracks
// only needs a read-only API key. That key ships in the bundle, which is fine
// here: it unlocks nothing that is not already public on your Last.fm profile.
// Spotify's own API would need a client secret, which a static site cannot keep.
const USER = import.meta.env.VITE_LASTFM_USER
const KEY = import.meta.env.VITE_LASTFM_KEY
const ENDPOINT = 'https://ws.audioscrobbler.com/2.0/'
const POLL_MS = 15_000

/** Whether a Last.fm user and key were given at build time. */
export const LASTFM_READY = Boolean(USER && KEY)

/** One read-only Last.fm API call for the configured user, as parsed JSON. */
export async function lastfm(method, params = {}) {
  const query = new URLSearchParams({
    method,
    user: USER,
    api_key: KEY,
    format: 'json',
    ...params,
  })
  const response = await fetch(`${ENDPOINT}?${query}`)
  if (!response.ok) throw new Error(`Last.fm answered ${response.status}`)
  return response.json()
}

async function fetchTrack() {
  const data = await lastfm('user.getrecenttracks', { limit: 1 })
  const track = data?.recenttracks?.track?.[0]
  if (!track) return null

  return {
    artist: track.artist?.['#text'] || '',
    title: track.name || '',
    url: track.url || '',
    playing: track['@attr']?.nowplaying === 'true',
  }
}

/**
 * The track currently scrobbling, or the last one played. Returns null when
 * it is not configured or the service is unreachable — a personal page has no
 * business showing an error because a music API is down.
 */
export default function useNowPlaying() {
  const [track, setTrack] = useState(null)
  const pending = useRef(false)
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  // No AbortController here on purpose. These requests are tiny and read-only,
  // so letting one finish costs nothing, while cancelling it logs
  // NS_BINDING_ABORTED in Firefox every time React re-runs an effect.
  const refresh = useCallback(async () => {
    if (!USER || !KEY || pending.current) return
    pending.current = true
    try {
      const next = await fetchTrack()
      if (alive.current) setTrack(next)
    } catch {
      // Keep whatever was showing: a blip should not blank the line.
    } finally {
      pending.current = false
    }
  }, [])

  useEffect(() => {
    if (!USER || !KEY) return undefined

    let timer = null

    const tick = () => {
      // A hidden tab polls nothing: no point paying for a request nobody sees.
      if (!document.hidden) refresh()
      timer = setTimeout(tick, POLL_MS)
    }

    const onVisible = () => {
      if (!document.hidden) refresh()
    }

    tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return { track, refresh }
}
