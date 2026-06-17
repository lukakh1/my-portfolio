"use client";

import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Vignette,
} from "@react-three/postprocessing";
import * as THREE from "three";

/**
 * Cinematic post stack: bloom makes the additive particles glow, a whisper of
 * chromatic aberration adds a lens feel, and a soft vignette frames the field.
 * Mounted on the "high" tier only.
 */
export function PostFx() {
  return (
    // multisampling 0: the scene is soft additive sprites that bloom blurs
    // anyway — the default 8x MSAA buffer was pure cost.
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.4}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={0.6}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0004, 0.0004)}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.3} darkness={0.58} />
    </EffectComposer>
  );
}
