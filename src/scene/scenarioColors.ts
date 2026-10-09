// Scenario colours (owner: A blue, B orange), used by 3D labels and charts.
export const SCENARIO_COLORS = { A: '#2563eb', B: '#c2410c' } as const
export type ScenarioSlot = keyof typeof SCENARIO_COLORS
