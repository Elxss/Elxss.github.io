import { useSyncExternalStore } from 'react'

// One shared animation clock for every moving gradient on the page, so there
// is a single requestAnimationFrame loop however many lines subscribe.

const FPS = 20
const listeners = new Set()
let now = 0
let frame = 0
let last = 0

function tick(t) {
  if (t - last >= 1000 / FPS) {
    last = t
    now = t / 1000
    listeners.forEach((listener) => listener())
  }
  frame = requestAnimationFrame(tick)
}

function subscribe(listener) {
  listeners.add(listener)
  if (listeners.size === 1) frame = requestAnimationFrame(tick)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) cancelAnimationFrame(frame)
  }
}

const reducedMotion = () =>
  typeof matchMedia === 'function' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches

const idle = () => () => {}

/**
 * Seconds since page load, updated FPS times a second; 0 when inactive.
 * `rate` rounds the time down to that many ticks a second: the value then
 * only changes `rate` times a second, and React skips the re-render in
 * between (a gradient that moves one step at a time needs nothing more).
 */
export default function useClock(active, rate = FPS) {
  const on = active && !reducedMotion()
  return useSyncExternalStore(on ? subscribe : idle, () =>
    on ? Math.floor(now * rate) / rate : 0,
  )
}
