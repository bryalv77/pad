/**
 * Every deploy replaces the content-hashed files in dist, and Firebase Hosting only
 * serves the current release. A tab that was opened before a deploy keeps running the
 * old entry chunk, whose lazy route imports (e.g. the /:id pad page) point at file
 * names that no longer exist. The SPA rewrite then answers those requests with
 * index.html ("text/html"), which the browser refuses to execute as a module script.
 *
 * Vite emits `vite:preloadError` for exactly this case. Reload once so the tab picks
 * up the current index.html and its new chunk names. A short session guard prevents
 * an endless reload loop when a deploy is genuinely broken.
 */
const RELOAD_AT_KEY = 'pad:chunk-recovery-at'
const RELOAD_COOLDOWN_MS = 30_000

function lastReloadAt(): number {
  try {
    return Number(sessionStorage.getItem(RELOAD_AT_KEY) ?? 0)
  } catch {
    return 0
  }
}

function recordReload(now: number) {
  try {
    sessionStorage.setItem(RELOAD_AT_KEY, String(now))
  } catch {
    // Storage can be unavailable (e.g. privacy mode); the reload still proceeds.
  }
}

export function installChunkRecovery() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()

    const now = Date.now()
    if (now - lastReloadAt() < RELOAD_COOLDOWN_MS) {
      console.error('[pad] A required chunk is still missing after reloading.', event.payload)
      return
    }

    recordReload(now)
    window.location.reload()
  })
}
