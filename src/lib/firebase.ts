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
    ;(self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }
  initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(siteKey), isTokenAutoRefreshEnabled: true })
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
    throw e
  })
  return session
}
