import { create } from 'zustand'
import { INITIAL_CAMERA, nextCameraPose, type CameraPose, type Vec3 } from './cameraPose'
import { MAX_WEEK, advanceWeek, clampWeek, stepWeek } from './timeline'

// Shared app state (PRD: Zustand): week, playback and the shared camera.
export interface ViewerState {
  week: number // 0..20, fractional while playing
  playing: boolean
  setWeek: (week: number) => void
  step: (direction: 1 | -1) => void
  togglePlay: () => void
  tick: (dtSeconds: number) => void // called every animation frame while playing
  camera: CameraPose // shared by view A and B
  setCamera: (position: Vec3, target: Vec3) => void
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
  camera: INITIAL_CAMERA,
  setCamera: (position, target) => {
    const camera = nextCameraPose(get().camera, position, target)
    if (camera !== get().camera) set({ camera })
  },
}))
