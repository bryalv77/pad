import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
})

// App Check proves requests come from this app (reCAPTCHA Enterprise), not scripts or bots.
const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
if (siteKey) {
  if (import.meta.env.DEV) {
    // Bypasses reCAPTCHA locally. A token from the console can be pinned; unset mints a new one per session.
    const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined
    ;(self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
      debugToken === 'false' ? false : !debugToken || debugToken === 'true' ? true : debugToken
  }
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true })
} else {
  console.error(
    '[pad] VITE_RECAPTCHA_SITE_KEY is missing, so App Check is disabled. Enforced Firebase services will reject requests.',
  )
}

/** App Check failures hide the real cause behind a Firebase error code; name the likely culprit. */
function explainAppCheckFailure(error: unknown) {
  const code = (error as { code?: string })?.code ?? ''
  if (!/app-?check/i.test(code)) return
  console.error(
    `[pad] App Check could not verify ${location.origin}. ` +
      'Add this domain to the allowed domains of the reCAPTCHA Enterprise key set in VITE_RECAPTCHA_SITE_KEY ' +
      '(Google Cloud console → reCAPTCHA Enterprise → Keys).',
    error,
  )
}

export const auth = getAuth(app)
export const db = getDatabase(app)

let session: Promise<string> | undefined

/** Signs in anonymously (once) and resolves with the user's uid. */
export function ensureUser(): Promise<string> {
  session ??= (async () => {
    await auth.authStateReady()
    const user = auth.currentUser ?? (await signInAnonymously(auth)).user
    return user.uid
  })().catch((e) => {
    session = undefined
    explainAppCheckFailure(e)
    throw e
  })
  return session
}
