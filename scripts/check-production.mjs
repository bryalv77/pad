#!/usr/bin/env node
/**
 * Production readiness checks for Pad.
 *
 *   npm run check:prod            build + verify local dist artifacts/config
 *   npm run check:live            additionally verify the deployed site
 *   node scripts/check-production.mjs --url https://example.com
 */
import { readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const urlArg = process.argv.indexOf('--url')
const site = urlArg !== -1 ? process.argv[urlArg + 1]?.replace(/\/$/, '') : undefined

let failures = 0
let checks = 0

function record(label, ok, detail = '') {
  checks++
  if (ok) {
    console.log(`  \x1b[32mPASS\x1b[0m ${label}`)
  } else {
    failures++
    console.log(`  \x1b[31mFAIL\x1b[0m ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

function section(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`)
}

function read(relative) {
  const path = resolve(root, relative)
  return { path, text: readFileSync(path, 'utf8') }
}

function contains(text, needle) {
  return text.includes(needle)
}

// ---------------------------------------------------------------- local build
section('Build output')

let html = ''
try {
  html = read('dist/index.html').text
  record('dist/index.html exists', true)
} catch {
  record('dist/index.html exists', false, 'run npm run build first')
}

const requiredAssets = [
  'favicon.ico',
  'favicon.svg',
  'favicon-16.png',
  'favicon-32.png',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'og-image.png',
  'manifest.json',
  'robots.txt',
  'sitemap.xml',
]
for (const asset of requiredAssets) {
  try {
    const { path } = read(`dist/${asset}`)
    const size = statSync(path).size
    record(`dist/${asset}`, size > 0, `${size} bytes`)
  } catch {
    record(`dist/${asset}`, false, 'missing or empty')
  }
}

section('SEO / metadata')
const metaChecks = [
  ['lang attribute', '<html lang="en">'],
  ['title', '<title>'],
  ['meta description', 'name="description"'],
  ['viewport', 'name="viewport"'],
  ['canonical URL', 'rel="canonical"'],
  ['theme color', 'name="theme-color"'],
  ['robots directive', 'name="robots"'],
  ['Open Graph title', 'property="og:title"'],
  ['Open Graph image', 'property="og:image"'],
  ['Twitter card', 'name="twitter:card"'],
  ['PNG favicon 32', 'rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=2"'],
  ['PNG favicon 16', 'rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png?v=2"'],
  ['apple-touch-icon', 'rel="apple-touch-icon"'],
  ['web app manifest', 'href="/manifest.json?v=2"'],
]
for (const [label, needle] of metaChecks) {
  record(label, contains(html, needle))
}

section('Security / hosting config')
let firebase = ''
try {
  firebase = read('firebase.json').text
  record('firebase.json exists', true)
} catch {
  record('firebase.json exists', false)
}
const configChecks = [
  ['SPA rewrite to index.html', '"destination": "/index.html"'],
  ['Content-Security-Policy', 'Content-Security-Policy'],
  ['nosniff enabled', '"X-Content-Type-Options"'],
  ['HSTS enabled', 'Strict-Transport-Security'],
  ['immutable asset caching', 'immutable'],
]
for (const [label, needle] of configChecks) {
  record(label, contains(firebase, needle))
}

section('Bundled safeguards')
try {
  const entry = read('dist/index.html').text.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1]
  if (!entry) throw new Error('entry chunk not found in index.html')
  const js = read(`dist${entry}`).text
  record('stale-chunk auto-recovery bundled', contains(js, 'vite:preloadError'))
} catch (e) {
  record('stale-chunk auto-recovery bundled', false, e instanceof Error ? e.message : String(e))
}

// ------------------------------------------------------------------ live site
async function fetchChecked(path, expectedType) {
  const res = await fetch(`${site}${path}`, { redirect: 'manual' })
  const type = res.headers.get('content-type') ?? ''
  const body = await res.text()
  record(`${path} returns 200`, res.status === 200, `status ${res.status}`)
  if (expectedType) record(`${path} content-type`, type.includes(expectedType), type || 'none')
  return { body, type, headers: res.headers }
}

if (site) {
  section(`Live site — ${site}`)
  try {
    const home = await fetchChecked('/', 'text/html')
    const needles = [
      'name="description"',
      'rel="canonical"',
      'property="og:image"',
      'href="/favicon-32.png?v=2"',
      'href="/manifest.json?v=2"',
    ]
    for (const needle of needles) record(`home has ${needle}`, contains(home.body, needle))

    const entry = home.body.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1]
    if (entry) {
      // The exact regression from before: a missing chunk was served index.html (text/html).
      await fetchChecked(entry, 'javascript')
    } else {
      record('entry chunk referenced', false)
    }

    for (const asset of ['/favicon.ico', '/favicon-32.png?v=2', '/apple-touch-icon.png', '/icon-192.png', '/manifest.json', '/og-image.png']) {
      await fetchChecked(asset)
    }

    const robots = await fetchChecked('/robots.txt')
    record('robots allows landing page', contains(robots.body, 'Allow: /$'))
    record('robots blocks pad pages', contains(robots.body, 'Disallow: /'))
    record('robots references sitemap', contains(robots.body, '/sitemap.xml'))

    const sitemap = await fetchChecked('/sitemap.xml')
    record('sitemap points to site', contains(sitemap.body, site))

    section('Live security headers')
    record('nosniff', (home.headers.get('x-content-type-options') ?? '') === 'nosniff')
    record('CSP present', Boolean(home.headers.get('content-security-policy')))
    record('HSTS present', Boolean(home.headers.get('strict-transport-security')))
    record('X-Frame-Options', Boolean(home.headers.get('x-frame-options')))
  } catch (e) {
    record('live site reachable', false, e instanceof Error ? e.message : String(e))
  }
}

console.log(`\n${failures === 0 ? '\x1b[32mAll checks passed\x1b[0m' : `\x1b[31m${failures} check(s) failed\x1b[0m`} (${checks} total)`)
process.exit(failures === 0 ? 0 : 1)
