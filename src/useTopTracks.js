import { useEffect, useState } from 'react'
import { LASTFM_READY, lastfm } from './useNowPlaying.js'

// A ranking moves slowly: one fetch on load, then every 10 minutes.
const POLL_MS = 10 * 60_000

/**
 * The user's most played tracks on Last.fm over `period` ('7day', '1month',
 * 'overall', ...), as [{ artist, title, plays, url }]. null until the first
 * answer; [] when Last.fm is not configured or unreachable.
 */
export default function useTopTracks(period, limit = 5) {
  const [tracks, setTracks] = useState(LASTFM_READY ? null : [])

  useEffect(() => {
    if (!LASTFM_READY) return undefined
    let alive = true

    const load = async () => {
      try {
        const data = await lastfm('user.gettoptracks', { period, limit })
        const list = data?.toptracks?.track || []
        if (!alive) return
        setTracks(
          list.slice(0, limit).map((track) => ({
            artist: track.artist?.name || '',
            title: track.name || '',
            plays: Number(track.playcount) || 0,
            url: track.url || '',
          })),
        )
      } catch {
        // Keep whatever was showing; the first failure shows an empty list.
        if (alive) setTracks((current) => current ?? [])
      }
    }

    load()
    const timer = setInterval(load, POLL_MS)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [period, limit])

  return tracks
}
