// Lagometer — frame-rate stats for the devtools console.
//
//   lag()        sample 3s and print a report
//   lag(10)      sample 10 seconds instead
//   lag.live()   one updating line per second until lag.stop()
//   lag.stop()   stop whatever is running
//   lag.last     the raw numbers of the last sample
//
// Nothing runs until asked: the rAF loop only exists while a sample is open.

const JANK = 33 // a frame this long is visible hitching, whatever the display
const COMMON_RATES = [60, 75, 90, 100, 120, 144, 165, 240]

const css = {
  dim: 'color:#8a8a8a',
  label: 'color:#8a8a8a',
  good: 'color:#3fb950;font-weight:600',
  warn: 'color:#d29922;font-weight:600',
  bad: 'color:#f85149;font-weight:600',
  head: 'color:#58a6ff;font-weight:600',
  plain: 'color:inherit',
}

const pct = (sorted, p) => {
  if (!sorted.length) return 0
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))
  return sorted[i]
}

const ms = (n) => `${n.toFixed(1)}ms`

/** Guess the display refresh rate from the quickest frames of the sample. */
function refreshRate(sorted) {
  if (!sorted.length) return 60
  const fastest = pct(sorted, 5) || sorted[0]
  const raw = 1000 / fastest
  let best = COMMON_RATES[0]
  for (const rate of COMMON_RATES) {
    if (Math.abs(rate - raw) < Math.abs(best - raw)) best = rate
  }
  return best
}

/* --- long tasks & layout shifts, observed only while sampling --- */

function observe(type, buffered = false) {
  const entries = []
  // Firefox ignores an unsupported entry type instead of throwing, so asking
  // the browser first is the only way to tell "none happened" from "never
  // measured" — otherwise the report quietly claims a clean zero.
  const supported = PerformanceObserver.supportedEntryTypes?.includes(type) ?? false
  if (!supported) return { entries, stop: () => {}, supported: false }
  const observer = new PerformanceObserver((list) => entries.push(...list.getEntries()))
  observer.observe({ type, buffered })
  return { entries, stop: () => observer.disconnect(), supported: true }
}

/**
 * How late a plain timer runs. A timer can only be late when the main thread
 * is busy, so this separates slow JS from slow painting: frames over budget
 * with the timer on time means the work is in style, layout, paint or the
 * GPU, not in our own script.
 */
function probeMainThread(every = 20) {
  let late = 0
  let ticks = 0
  let worst = 0
  let due = performance.now() + every
  const timer = setInterval(() => {
    const now = performance.now()
    const delay = Math.max(0, now - due)
    due = now + every
    ticks += 1
    late += delay
    if (delay > worst) worst = delay
  }, every)
  return {
    stop: () => clearInterval(timer),
    read: () => ({ late, ticks, worst }),
  }
}

/* --- the sampler --- */

let running = null // { raf, stop }

function start(onFrame) {
  if (running) running.stop()

  const deltas = []
  const tasks = observe('longtask')
  const shifts = observe('layout-shift')
  const probe = probeMainThread()
  const t0 = performance.now()
  let previous = t0
  let hidden = document.visibilityState === 'hidden'
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') hidden = true
  }
  document.addEventListener('visibilitychange', onVisibility)

  const tick = (now) => {
    const delta = now - previous
    previous = now
    // A tab coming back from the background reports one enormous frame; it is
    // not lag, so it never makes it into the numbers.
    if (delta < 2000) deltas.push(delta)
    if (onFrame) onFrame(collect())
    running.raf = requestAnimationFrame(tick)
  }

  const collect = () => {
    const elapsed = performance.now() - t0
    const sorted = [...deltas].sort((a, b) => a - b)
    const rate = refreshRate(sorted)
    const budget = 1000 / rate
    const fps = deltas.length / (elapsed / 1000)
    const janky = deltas.filter((d) => d > JANK)
    const dropped = deltas.reduce((n, d) => n + Math.max(0, Math.round(d / budget) - 1), 0)
    const taskTime = tasks.entries.reduce((n, e) => n + e.duration, 0)
    const shiftScore = shifts.entries
      .filter((e) => !e.hadRecentInput)
      .reduce((n, e) => n + e.value, 0)
    return {
      seconds: elapsed / 1000,
      frames: deltas.length,
      fps,
      rate,
      budget,
      p50: pct(sorted, 50),
      p95: pct(sorted, 95),
      p99: pct(sorted, 99),
      worst: sorted[sorted.length - 1] || 0,
      janky: janky.length,
      dropped,
      longTasks: tasks.entries.length,
      taskTime,
      longestTask: tasks.entries.reduce((n, e) => Math.max(n, e.duration), 0),
      tasksSupported: tasks.supported,
      blocked: probe.read().late,
      worstBlock: probe.read().worst,
      cls: shiftScore,
      hidden,
      memory: performance.memory
        ? {
            used: performance.memory.usedJSHeapSize / 1048576,
            limit: performance.memory.jsHeapSizeLimit / 1048576,
          }
        : null,
    }
  }

  running = {
    raf: requestAnimationFrame(tick),
    collect,
    stop() {
      cancelAnimationFrame(running.raf)
      document.removeEventListener('visibilitychange', onVisibility)
      tasks.stop()
      shifts.stop()
      probe.stop()
      running = null
    },
  }
  return running
}

/* --- scoring & printing --- */

/** 0–100: how close the page stayed to its display's own refresh rate. */
function score(s) {
  if (!s.frames) return 0
  const smoothness = Math.min(1, s.fps / (s.rate * 0.95))
  const hitching = Math.max(0, 1 - (s.janky / Math.max(1, s.frames)) * 12)
  const stability = Math.min(1, s.budget * 2 / Math.max(s.budget, s.p95))
  return Math.round(100 * (smoothness * 0.5 + hitching * 0.3 + stability * 0.2))
}

function verdict(value) {
  if (value >= 85) return ['smooth', css.good]
  if (value >= 60) return ['occasional hitching', css.warn]
  return ['laggy', css.bad]
}

function bar(value, width = 24) {
  const filled = Math.round((Math.max(0, Math.min(100, value)) / 100) * width)
  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`
}

function line(s) {
  const value = score(s)
  const [word, style] = verdict(value)
  return [
    `%c${bar(value, 16)}%c ${s.fps.toFixed(0)} fps%c · p95 ${ms(s.p95)} · ${s.janky} janky · %c${word}`,
    style,
    css.plain,
    css.dim,
    style,
  ]
}

function report(s) {
  const value = score(s)
  const [word, style] = verdict(value)

  console.log(
    `%c⏱ lagometer%c  ${s.seconds.toFixed(1)}s · ${s.frames} frames`,
    css.head,
    css.dim,
  )
  console.log(`%c${bar(value)}%c ${value}/100 · %c${word}`, style, css.dim, style)
  console.log(
    `%cfps   %c${s.fps.toFixed(1)}%c avg · display ~${s.rate}Hz · ${s.dropped} dropped frames`,
    css.label,
    s.fps >= s.rate * 0.9 ? css.good : s.fps >= s.rate * 0.6 ? css.warn : css.bad,
    css.dim,
  )
  console.log(
    `%cframe %cp50 ${ms(s.p50)} · p95 ${ms(s.p95)} · p99 ${ms(s.p99)} · worst ${ms(s.worst)}%c (budget ${ms(s.budget)})`,
    css.label,
    css.plain,
    css.dim,
  )
  console.log(
    `%cjank  %c${s.janky} frames over ${JANK}ms%c (${((s.janky / Math.max(1, s.frames)) * 100).toFixed(1)}% of frames)`,
    css.label,
    s.janky ? css.warn : css.good,
    css.dim,
  )
  if (s.tasksSupported) {
    console.log(
      `%ctasks %c${s.longTasks} long tasks · ${ms(s.taskTime)} blocked · longest ${ms(s.longestTask)}`,
      css.label,
      s.longTasks ? css.warn : css.good,
    )
  } else {
    console.log('%ctasks %cno long-task API in this browser', css.label, css.dim)
  }
  // Share of the sample the main thread spent unable to run a timer.
  const busy = (s.blocked / (s.seconds * 1000)) * 100
  console.log(
    `%cthread%c ${busy.toFixed(0)}% busy · worst block ${ms(s.worstBlock)} · %c${
      busy > 20 ? 'the lag is in JS on the main thread' : 'main thread is free — look at style, paint or GPU'
    }`,
    css.label,
    busy > 20 ? css.warn : css.good,
    css.dim,
  )
  if (s.cls > 0.001) {
    console.log(`%cshift %c${s.cls.toFixed(3)} layout shift`, css.label, css.warn)
  }
  if (s.memory) {
    console.log(
      `%cheap  %c${s.memory.used.toFixed(1)} MB used of ${s.memory.limit.toFixed(0)} MB`,
      css.label,
      css.plain,
    )
  }
  if (s.hidden) {
    console.log('%cnote  the tab was in the background — numbers are unreliable', css.warn)
  }
  console.log('%crun lag.live() for a running meter, lag.stop() to stop it', css.dim)
}

/* --- public API --- */

export function lag(seconds = 3) {
  return new Promise((resolve) => {
    console.log(`%c⏱ sampling ${seconds}s…`, css.dim)
    const session = start()
    setTimeout(() => {
      const snapshot = session.collect()
      session.stop()
      lag.last = snapshot
      report(snapshot)
      resolve(snapshot)
    }, seconds * 1000)
  })
}

lag.last = null

/** A single line, refreshed once a second, until lag.stop(). */
lag.live = (every = 1) => {
  let next = performance.now() + every * 1000
  const session = start((snapshot) => {
    const now = performance.now()
    if (now < next) return
    next = now + every * 1000
    lag.last = snapshot
    console.log(...line(snapshot))
  })
  console.log('%c⏱ live lagometer — lag.stop() to stop', css.dim)
  return session
}

lag.report = () => {
  const snapshot = running ? running.collect() : lag.last
  if (!snapshot) return console.log('%cnothing sampled yet — run lag()', css.dim)
  report(snapshot)
  return snapshot
}

lag.stop = () => {
  if (!running) return console.log('%cnothing running', css.dim)
  const snapshot = running.collect()
  running.stop()
  lag.last = snapshot
  report(snapshot)
  return snapshot
}

/** Attach the meter to the page and say so, once. */
export function installLagometer() {
  if (globalThis.lag) return
  globalThis.lag = lag
  console.log(
    '%c⏱ lagometer ready%c — lag() to sample 3s, lag.live() for a running meter',
    css.head,
    css.dim,
  )
}

export default lag
