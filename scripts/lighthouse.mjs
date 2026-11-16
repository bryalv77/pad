#!/usr/bin/env node
/** Run a Lighthouse audit against a deployed Pad URL and write an HTML report. */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const chrome = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((candidate) => candidate && existsSync(candidate))

if (!chrome) {
  console.error('Could not find Chrome. Set CHROME_PATH to your Chrome/Chromium binary.')
  process.exit(1)
}

const url = process.argv[2] ?? 'https://pad.bryanalvarado.com/'
const report = resolve(import.meta.dirname, '..', 'lighthouse-report.html')

const args = [
  resolve(import.meta.dirname, '..', 'node_modules', 'lighthouse', 'cli', 'index.js'),
  url,
  '--only-categories=performance,accessibility,best-practices,seo',
  '--output=html',
  `--output-path=${report}`,
  '--quiet',
  '--chrome-flags=--headless=new --no-sandbox',
]

const result = spawnSync(process.execPath, args, {
  cwd: resolve(import.meta.dirname, '..'),
  env: { ...process.env, CHROME_PATH: chrome },
  stdio: 'inherit',
})

if (result.status !== 0) process.exit(result.status ?? 1)
console.log(`\nReport: ${report}`)
