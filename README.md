# Pad

A simple shared notepad. Built with React + Vite, backed by Firebase Realtime Database, Auth and App Check.

## Develop

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in the Firebase / reCAPTCHA values.

## Editor features

- **Fonts** — ten web-safe font stacks (Arial, Georgia, Verdana, Times, Courier, …). The choice applies to the whole pad and is saved with it.
- **Markdown** — the *Markdown* toggle switches between the rich editor and a raw Markdown source editor, converting content both ways. Inside Markdown mode, **Write / Preview** switches between the source and a sanitized rendered preview.

## Tests

```bash
npm test          # Vitest unit + component tests (TDD coverage for fonts, markdown, mode switching)
npm run test:e2e  # Playwright browser tests against a local harness + the live home page
```

## Production readiness

```bash
npm run check:prod   # build, then verify dist artifacts, SEO metadata, security config and bundled safeguards
npm run check:live   # verify the deployed site: headers, metadata, assets and MIME types
npm run lighthouse   # Lighthouse audit of https://pad.bryanalvarado.com/ → lighthouse-report.html
```

`check:prod` and `check:live` exit non-zero on any failure, so they can be used in CI.

### Lighthouse notes

Current scores: **Performance 100 · Accessibility 100 · Best Practices 73 · SEO 100**.

The remaining Best Practices deductions are all inherent to Firebase App Check with reCAPTCHA Enterprise, not app defects:

- `errors-in-console` — headless Chrome cannot obtain a valid reCAPTCHA token, so the App Check token exchange returns 403 during automated audits. The API key has no domain restriction and `pad.bryanalvarado.com` is in the reCAPTCHA key's allowed domains, so real browsers are unaffected.
- `third-party-cookies` / `inspector-issues` — reCAPTCHA sets its own `_GRECAPTCHA` cookie. Removing it would mean removing App Check.

## Deploy

```bash
npm run build
firebase deploy --only hosting,database --project pad-note
```
