// Stencil passes only count faces; colour is never written.
#include <clipping_planes_pars_fragment>

void main() {
  #include <clipping_planes_fragment>
  gl_FragColor = vec4(0.0);
}
