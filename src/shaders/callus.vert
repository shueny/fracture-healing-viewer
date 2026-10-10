// Shrinks the full-size callus to the current week. Geometry is never
// rebuilt: only uConsolidation changes (performance rule 9).

// Per vertex (callusGeometry.ts): the point on the bone surface this vertex
// grows out of, and whether it belongs to the outer bulge (1) or the gap
// filling / inner wall (0).
attribute vec3 aBase;
attribute float aExternal;

varying float vDistance; // 0 at the fracture line, 1 at the callus end
varying vec3 vNormalView;
#include <clipping_planes_pars_vertex>

void main() {
  float c = uConsolidation;
  float g = callusGrowth(c);
  // Outer bulge grows then remodels; the gap filling only grows.
  float radialScale = mix(g, g * callusRemodel(c), aExternal);
  vec3 p = position;
  p.xz = aBase.xz + (position.xz - aBase.xz) * radialScale;
  p.y = position.y * g;

  vDistance = clamp(abs(position.y) / uHalfLength, 0.0, 1.0);
  vNormalView = normalize(normalMatrix * normal);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
}
