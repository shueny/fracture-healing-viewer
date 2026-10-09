import { expect, type Page } from '@playwright/test'

// Shared helpers for the harness tests: open the app and read its state the
// way a user sees it (labels, ARIA roles), not through internals.

export interface AppPage {
  page: Page
  consoleErrors: string[]
}

export async function openApp(page: Page): Promise<AppPage> {
  const consoleErrors: string[] = []
  page.on('console', (m) => {
    // favicon.ico 404 is the browser's own request, not the app's.
    if (m.type() === 'error' && !m.text().includes('404')) consoleErrors.push(m.text())
  })
  page.on('pageerror', (e) => consoleErrors.push(e.message))
  await page.goto('/')
  await expect(page.locator('canvas')).toBeVisible()
  await page.waitForTimeout(2000) // model load + first frames on a software renderer
  return { page, consoleErrors }
}

export async function currentWeek(page: Page): Promise<number> {
  const text = await page.getByText(/第 \d+ 週 \//).innerText()
  return Number(text.match(/第 (\d+) 週/)![1])
}

export async function pressTimes(page: Page, key: string, times: number) {
  for (let i = 0; i < times; i++) await page.keyboard.press(key)
}

export const chart = (page: Page, index: number) => page.locator('figure').nth(index)

// Click a chart at a fraction of its plot width. Recharts picks the week from
// the last pointer position, so hover first like a real mouse does.
export async function clickChartAt(page: Page, index: number, fraction: number) {
  const box = (await chart(page, index).boundingBox())!
  const x = box.x + 40 + (box.width - 56) * fraction
  const y = box.y + box.height / 2
  await page.mouse.move(x - 8, y)
  await page.mouse.move(x, y, { steps: 3 })
  await page.mouse.down()
  await page.mouse.up()
}

export async function cursorXs(page: Page): Promise<number[]> {
  return page
    .locator('.recharts-reference-line line')
    .evaluateAll((lines) => lines.map((l) => Math.round(Number(l.getAttribute('x1')))))
}

export const selected = (page: Page, slot: 'A' | 'B') =>
  page.locator(`[aria-label^="方案 ${slot}"] [aria-checked="true"]`).allInnerTexts()

// The two 3D panels, below the controls overlay, as screenshot clip areas.
// Panel A ends with a 1 px divider line, so both clips stop 1 px short of
// the panel width: then A and B cover exactly the same part of their scene.
export async function viewClips(page: Page) {
  const views = (await page.locator('main > div').last().boundingBox())!
  const half = Math.floor(views.width / 2)
  const width = half - 1
  const top = views.y + 100
  const height = views.height - 110
  return {
    A: { x: views.x, y: top, width, height },
    B: { x: views.x + half, y: top, width, height },
  }
}
