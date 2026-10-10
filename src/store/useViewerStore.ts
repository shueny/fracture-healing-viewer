import { create } from 'zustand'
import type { ScenarioParams } from '../data/healingModel'
import type { ScenarioSlot } from '../scene/scenarioColors'
import { INITIAL_CAMERA, nextCameraPose, type CameraPose, type Vec3 } from './cameraPose'
import { MAX_WEEK, advanceWeek, clampWeek, stepWeek } from './timeline'

// Shared app state (PRD: Zustand): week, playback, A/B scenario parameters
// and the shared camera.

// Default comparison (owner): best case vs delayed healing.
export const DEFAULT_SCENARIOS: Record<ScenarioSlot, ScenarioParams> = {
  A: { nailDiameterMm: 11, loading: 'partial' },
  B: { nailDiameterMm: 10, loading: 'full' },
}
export interface ViewerState {
  week: number // 0..20, fractional while playing
  playing: boolean
  setWeek: (week: number) => void
  step: (direction: 1 | -1) => void
  togglePlay: () => void
  tick: (dtSeconds: number) => void // called every animation frame while playing
  scenarios: Record<ScenarioSlot, ScenarioParams>
  setScenario: (slot: ScenarioSlot, change: Partial<ScenarioParams>) => void
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
  scenarios: DEFAULT_SCENARIOS,
  // Changing one view's scenario keeps the week and the other view as they are.
  setScenario: (slot, change) =>
    set((s) => ({ scenarios: { ...s.scenarios, [slot]: { ...s.scenarios[slot], ...change } } })),
  camera: INITIAL_CAMERA,
  setCamera: (position, target) => {
    const camera = nextCameraPose(get().camera, position, target)
    if (camera !== get().camera) set({ camera })
  },
}))
