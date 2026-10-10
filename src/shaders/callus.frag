varying float vDistance;
varying vec3 vNormalView;
#include <clipping_planes_pars_fragment>

void main() {
  #include <clipping_planes_fragment>
  vec3 base = tissueColor(callusMaturity(uConsolidation, vDistance));
  // Simple diffuse light so the outer surface reads as 3D.
  vec3 lightDir = normalize(vec3(0.4, 0.5, 0.8));
  float light = 0.6 + 0.4 * max(dot(normalize(vNormalView), lightDir), 0.0);
  gl_FragColor = vec4(base * light, 1.0);
  #include <colorspace_fragment>
}
