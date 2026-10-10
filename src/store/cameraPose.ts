// The camera pose shared by both views (PRD: "共用一組相機參數").
// Kept as plain numbers so it can live in the store and be compared.

export type Vec3 = [number, number, number]

export interface CameraPose {
  position: Vec3
  target: Vec3 // the point the camera orbits around
  version: number // bumps on every real change, so views know to follow
}

export const CAMERA_FOV_DEG = 35 // vertical field of view

// Distance at which a perspective camera shows `halfHeightMm` above and below
// its target: tan(fov / 2) = halfHeight / distance.
export function framingDistance(halfHeightMm: number, fovDeg = CAMERA_FOV_DEG): number {
  return halfHeightMm / Math.tan(((fovDeg / 2) * Math.PI) / 180)
}

// Owner: start close on the fracture. Show 60 mm above and below the
// fracture line: the whole callus (+/-25 mm) with room for its bulge and
// some intact bone. Zoom out with the mouse wheel to see the whole femur.
export const INITIAL_FRAME_HALF_HEIGHT_MM = 60

// Looking at the coronal cut from the front, centred on the fracture line.
export const INITIAL_CAMERA: CameraPose = {
  position: [0, 0, framingDistance(INITIAL_FRAME_HALF_HEIGHT_MM)],
  target: [0, 0, 0],
  version: 0,
}

const EPSILON = 1e-4
const same = (a: Vec3, b: Vec3) => a.every((v, i) => Math.abs(v - b[i]) < EPSILON)

// Returns the next pose, or the same object if nothing really moved. This
// stops the two views from echoing each other's updates forever.
export function nextCameraPose(current: CameraPose, position: Vec3, target: Vec3): CameraPose {
  if (same(current.position, position) && same(current.target, target)) return current
  return { position, target, version: current.version + 1 }
}
