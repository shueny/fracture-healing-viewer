import { describe, expect, it } from 'vitest'
import { MAX_WEEK, PLAYBACK_SECONDS, advanceWeek, displayWeek, stepWeek } from './timeline'

describe('timeline maths', () => {
  it('plays week 0 to 20 in 10 seconds, frame-rate independent', () => {
    let w = 0
    for (let i = 0; i < PLAYBACK_SECONDS * 60; i++) w = advanceWeek(w, 1 / 60)
    expect(w).toBeCloseTo(MAX_WEEK)
    expect(advanceWeek(0, 5)).toBeCloseTo(10) // same result with one big step
  })

  it('never goes past week 20', () => {
    expect(advanceWeek(19.9, 1)).toBe(MAX_WEEK)
  })

  it('steps to the next / previous whole week from a fractional week', () => {
    expect(stepWeek(8.4, 1)).toBe(9)
    expect(stepWeek(8.4, -1)).toBe(8)
    expect(stepWeek(8, 1)).toBe(9)
    expect(stepWeek(8, -1)).toBe(7)
    expect(stepWeek(0, -1)).toBe(0)
    expect(stepWeek(20, 1)).toBe(20)
  })

  it('labels the whole week reached so far', () => {
    expect(displayWeek(8.99)).toBe(8)
    expect(displayWeek(9)).toBe(9)
  })
})
