// Shrinks the full-size callus to the current week. Geometry is never
// rebuilt: only uConsolidation changes (performance rule 9).

varying float vDistance; // 0 at the fracture line, 1 at the callus end
varying vec3 vNormalView;
#include <clipping_planes_pars_vertex>

void main() {
  float c = uConsolidation;
  float r = length(position.xz);
  float g = callusGrowth(c);
  // Outer bulge grows then remodels; the gap filling only grows.
  float radialScale = r > uBoneRadius ? g * callusRemodel(c) : g;
  float newR = uBoneRadius + (r - uBoneRadius) * radialScale;
  vec2 dir = r > 0.0 ? position.xz / r : vec2(0.0);
  vec3 p = vec3(dir.x * newR, position.y * g, dir.y * newR);

  vDistance = clamp(abs(position.y) / uHalfLength, 0.0, 1.0);
  vNormalView = normalize(normalMatrix * normal);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}
