// The camera pose shared by both views (PRD: "共用一組相機參數").
// Kept as plain numbers so it can live in the store and be compared.

export type Vec3 = [number, number, number]

export interface CameraPose {
  position: Vec3
  target: Vec3 // the point the camera orbits around
  version: number // bumps on every real change, so views know to follow
}

// Looking at the coronal cut from the front; the whole femur fits.
export const INITIAL_CAMERA: CameraPose = { position: [0, 0, 700], target: [0, 0, 0], version: 0 }

const EPSILON = 1e-4
const same = (a: Vec3, b: Vec3) => a.every((v, i) => Math.abs(v - b[i]) < EPSILON)

// Returns the next pose, or the same object if nothing really moved. This
// stops the two views from echoing each other's updates forever.
export function nextCameraPose(current: CameraPose, position: Vec3, target: Vec3): CameraPose {
  if (same(current.position, position) && same(current.target, target)) return current
  return { position, target, version: current.version + 1 }
}
