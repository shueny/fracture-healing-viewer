import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { clickChartAt, openApp, pressTimes } from './app'

// Self-review: checks nobody asked for feature by feature, but that catch
// problems a reviewer would flag (accessibility, errors, layout, size).

test('audit: no accessibility violations of moderate impact or worse (axe)', async ({ page }) => {
  await openApp(page)
  // WCAG 2 A/AA plus axe best practices (landmarks, headings, ...).
  const result = await new AxeBuilder({ page }).analyze()
  const blocking = result.violations
    .filter((v) => v.impact !== 'minor')
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.help} -> ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
    )
  expect(blocking, blocking.join('\n')).toEqual([])
})

// axe cannot measure contrast for SVG text or text over a canvas and leaves
// it "incomplete". This check resolves the real colours itself: the text's
// colour (CSS color, or SVG fill) against the first opaque background found
// up the tree. WCAG AA: 4.5:1 for normal text, 3:1 for large (>= 24 px, or
// >= 18.66 px bold).
test('audit: all visible text meets WCAG AA contrast, SVG chart text included', async ({
  page,
}) => {
  await openApp(page)
  const failures = await page.evaluate(() => {
    // Let the browser convert any CSS colour (rgb, oklch, lab, ...) to RGBA:
    // paint it on a 1x1 canvas and read the pixel back.
    const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
    const parse = (c: string): number[] | null => {
      if (!c || c === 'none' || c === 'transparent') return null
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = c
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return [r, g, b, a / 255]
    }
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => {
        const s = v / 255
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const ratio = (a: number[], b: number[]) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
      return (hi + 0.05) / (lo + 0.05)
    }
    const background = (el: Element): number[] => {
      for (let e: Element | null = el; e; e = e.parentElement) {
        const c = parse(getComputedStyle(e).backgroundColor)
        if (c && c[3] >= 0.99) return c
      }
      return [255, 255, 255, 1]
    }
    const out: string[] = []
    const seen = new Set<string>()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement
      const text = n.textContent?.trim()
      if (!el || !text) continue
      const style = getComputedStyle(el)
      if (!el.getBoundingClientRect().width || style.visibility === 'hidden') continue
      const inSvg = el instanceof SVGElement
      const fg = parse(inSvg ? style.fill : style.color)
      if (!fg) continue
      const size = parseFloat(style.fontSize)
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700)
      const need = large ? 3 : 4.5
      const r = ratio(fg, background(el))
      const key = `${text.slice(0, 20)}|${r.toFixed(2)}`
      if (r < need && !seen.has(key)) {
        seen.add(key)
        out.push(
          `"${text.slice(0, 30)}" ${r.toFixed(2)}:1 < ${need}:1 (${inSvg ? style.fill : style.color})`,
        )
      }
    }
    return out
  })
  expect(failures, failures.join('\n')).toEqual([])
})

test('audit: no console errors through a full session', async ({ page }) => {
  const app = await openApp(page)
  await page.getByRole('button', { name: '播放' }).click()
  await page.waitForTimeout(1500)
  await page.keyboard.press('Space')
  await page.getByRole('radiogroup', { name: '方案 A 負重' }).getByText('完全負重').click()
  await page.getByRole('radiogroup', { name: '方案 B 釘子直徑' }).getByText('11 mm').click()
  await clickChartAt(page, 1, 0.5)
  await pressTimes(page, 'ArrowRight', 3)
  expect(app.consoleErrors).toEqual([])
})

for (const [width, height] of [
  [1280, 800],
  [1440, 900],
  [1920, 1080],
]) {
  test(`audit: one screen without scrolling at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await openApp(page)
    const size = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      scrollH: document.documentElement.scrollHeight,
      w: innerWidth,
      h: innerHeight,
    }))
    expect(size.scrollW).toBeLessThanOrEqual(size.w)
    expect(size.scrollH).toBeLessThanOrEqual(size.h)
  })
}

test('audit: every control can be reached and named by keyboard users', async ({ page }) => {
  await openApp(page)
  const unnamed = await page
    .locator('button, input, [role="radio"], [role="slider"]')
    .evaluateAll((els) =>
      els
        .filter((el) => !(el.getAttribute('aria-label') || el.textContent?.trim()))
        .map((el) => el.outerHTML.slice(0, 80)),
    )
  expect(unnamed).toEqual([])
})

test('audit: download budget (JS <= 500 KB gzip, femur.glb <= 2 MB)', async () => {
  const assets = join(process.cwd(), 'dist', 'assets')
  const js = readdirSync(assets).filter((f) => f.endsWith('.js'))
  const gzipBytes = js.reduce((sum, f) => sum + gzipSync(readFileSync(join(assets, f))).length, 0)
  expect(gzipBytes / 1024).toBeLessThanOrEqual(500)
  expect(statSync(join(process.cwd(), 'dist', 'models', 'femur.glb')).size).toBeLessThanOrEqual(
    2 * 1024 * 1024,
  )
})
