import { create } from 'zustand'
import { MAX_WEEK, advanceWeek, clampWeek, stepWeek } from './timeline'

// Shared app state (PRD: Zustand). Day 3 adds the A/B scenario parameters.
export interface ViewerState {
  week: number // 0..20, fractional while playing
  playing: boolean
  setWeek: (week: number) => void
  step: (direction: 1 | -1) => void
  togglePlay: () => void
  tick: (dtSeconds: number) => void // called every animation frame while playing
}

export const useViewerStore = create<ViewerState>()((set, get) => ({
  week: 0,
  playing: false,
  // Dragging or clicking a week pauses playback, so the user stays in control.
  setWeek: (week) => set({ week: clampWeek(week), playing: false }),
  step: (direction) => set({ week: stepWeek(get().week, direction), playing: false }),
  togglePlay: () => {
    const { playing, week } = get()
    if (playing) return set({ playing: false })
    // Pressing play at the end starts again from week 0.
    set({ playing: true, week: week >= MAX_WEEK ? 0 : week })
  },
  tick: (dt) => {
    const week = advanceWeek(get().week, dt)
    set({ week, playing: week < MAX_WEEK })
  },
}))
