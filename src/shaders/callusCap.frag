// Colours the cut face. The callus is squashed by callusGrowth() along Y, so
// undo that to find each pixel's distance from the fracture line.
varying vec3 vWorld;

void main() {
  float g = max(callusGrowth(uConsolidation), 1e-3);
  float d = clamp(abs(vWorld.y) / (g * uHalfLength), 0.0, 1.0);
  gl_FragColor = vec4(tissueColor(callusMaturity(uConsolidation, d)), 1.0);
  #include <colorspace_fragment>
}
