// Shared callus maths. Line-by-line copy of src/scene/callusModel.ts (tested
// there); change both together.

uniform float uConsolidation; // C(t) / 100
uniform float uBoneRadius; // mm
uniform float uHalfLength; // mm, callus reach from the fracture line
uniform vec3 uTissueColors[4]; // fibrous, cartilage, woven, mature

float callusGrowth(float c) { return smoothstep(0.0, 0.5, c); }
float callusRemodel(float c) { return 1.0 - 0.35 * smoothstep(0.7, 1.0, c); }
float callusMaturity(float c, float d) { return clamp(1.6 * c - 0.6 * (1.0 - d), 0.0, 1.0); }

// Four bands with a soft +/-0.05 edge at maturity 0.25, 0.5, 0.75.
vec3 tissueColor(float m) {
  vec3 col = uTissueColors[0];
  col = mix(col, uTissueColors[1], smoothstep(0.20, 0.30, m));
  col = mix(col, uTissueColors[2], smoothstep(0.45, 0.55, m));
  col = mix(col, uTissueColors[3], smoothstep(0.70, 0.80, m));
  return col;
}
