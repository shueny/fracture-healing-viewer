import { expect, test } from '@playwright/test'
import {
  chart,
  clickChartAt,
  currentWeek,
  cursorXs,
  openApp,
  pressTimes,
  selected,
  viewClips,
} from './app'

// One test per PRD MVP feature (F1-F7), driven like a user.

test('F1 case panel shows the fixed demo case', async ({ page }) => {
  await openApp(page)
  const panel = page.getByRole('region', { name: '案例資訊' })
  for (const text of ['股骨幹骨折', '3 mm', '髓內釘固定']) await expect(panel).toContainText(text)
})

test('F2 A/B views side by side with synced cameras', async ({ page }) => {
  await openApp(page)
  // Same scenario on both sides: if the cameras are synced, the pictures match.
  await page.getByRole('radiogroup', { name: '方案 B 釘子直徑' }).getByText('11 mm').click()
  await page.getByRole('radiogroup', { name: '方案 B 負重' }).getByText('部分負重').click()
  await pressTimes(page, 'ArrowRight', 10)
  const clips = await viewClips(page)
  // Rotate in A, zoom in B.
  await page.mouse.move(clips.A.x + clips.A.width / 2, clips.A.y + 200)
  await page.mouse.down()
  await page.mouse.move(clips.A.x + clips.A.width / 2 + 60, clips.A.y + 180, { steps: 8 })
  await page.mouse.up()
  await page.mouse.move(clips.B.x + clips.B.width / 2, clips.B.y + 200)
  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, 300)
    await page.waitForTimeout(150)
  }
  await page.mouse.move(5, 5)
  await page.waitForTimeout(600)
  const [a, b] = [
    await page.screenshot({ clip: clips.A }),
    await page.screenshot({ clip: clips.B }),
  ]
  expect(a.equals(b), 'left and right views should be pixel-identical').toBe(true)
})

test('F3 timeline: play / pause, keys, end and restart', async ({ page }) => {
  await openApp(page)
  expect(await currentWeek(page)).toBe(0)
  await page.getByRole('button', { name: '播放' }).click()
  await page.waitForTimeout(2500)
  await page.keyboard.press('Space')
  const played = await currentWeek(page)
  expect(played).toBeGreaterThan(0)
  await pressTimes(page, 'ArrowRight', 2)
  expect(await currentWeek(page)).toBe(played + 2)
  await page.keyboard.press('ArrowLeft')
  expect(await currentWeek(page)).toBe(played + 1)
  const slider = (await page.getByRole('slider', { name: '週數' }).boundingBox())!
  await page.mouse.click(slider.x + slider.width - 2, slider.y + slider.height / 2)
  expect(await currentWeek(page)).toBe(20)
  await page.getByRole('button', { name: '播放' }).click()
  await page.keyboard.press('Space')
  expect(await currentWeek(page)).toBeLessThanOrEqual(1) // restarted from week 0
})

test('F4 each view switches diameter and loading on its own', async ({ page }) => {
  await openApp(page)
  await pressTimes(page, 'ArrowRight', 6)
  expect(await selected(page, 'A')).toEqual(['11 mm', '部分負重'])
  expect(await selected(page, 'B')).toEqual(['10 mm', '完全負重'])
  await page.getByRole('radiogroup', { name: '方案 B 負重' }).getByText('部分負重').click()
  expect(await selected(page, 'B')).toEqual(['10 mm', '部分負重'])
  expect(await selected(page, 'A')).toEqual(['11 mm', '部分負重'])
  expect(await currentWeek(page)).toBe(6)
})

test('F5 three charts with A/B lines, synced cursor, click to jump', async ({ page }) => {
  await openApp(page)
  await expect(page.locator('figure')).toHaveCount(3)
  for (let i = 0; i < 3; i++) await expect(chart(page, i).locator('.recharts-line')).toHaveCount(2)
  await pressTimes(page, 'ArrowRight', 8)
  const before = await cursorXs(page)
  expect(new Set(before).size).toBe(1) // same x in all three charts
  await clickChartAt(page, 2, 0.75)
  await expect.poll(() => currentWeek(page)).toBe(15)
  const after = await cursorXs(page)
  expect(new Set(after).size).toBe(1)
  expect(after[0]).toBeGreaterThan(before[0])
})

test('F6 legend lists the four tissue states in healing order', async ({ page }) => {
  await openApp(page)
  const items = page.getByRole('region', { name: '骨痂組織狀態' }).getByRole('listitem')
  await expect(items).toHaveText(['纖維組織', '軟骨', '編織骨', '成熟骨'])
})

test('F7 disclaimer is always visible with the exact wording', async ({ page }) => {
  await openApp(page)
  const note = page.getByRole('note')
  await expect(note).toBeVisible()
  await expect(note).toContainText('示意模型，非醫療數據，不作臨床用途')
  await pressTimes(page, 'ArrowRight', 20)
  await expect(note).toBeVisible()
})
