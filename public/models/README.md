# 3D Model Directory

## Naming convention

- Product: `{brand-id}-{model-id}-{part-id}.glb`
  Example: `atlas-copco-hb3000-chisel.glb`
- Hero: `featured/{name}.glb`
  Example: `featured/hb3000-chisel.glb`

## Size limit

- Target: **< 1 MB** per file (optimized)
- Max: 2.5 MB

## DWG → GLB pipeline

1. **DWG → STEP** in Fusion 360 (free personal licence):
   File → Open → DWG → Body → Export → STEP (.step / .stp)

2. **STEP → Blender** (free):
   Install STEPper addon
   File → Import → STEP
   Check units (mm)
   Material: PBR Principled BSDF
   - Base Color: `#6b7280` (steel)
   - Metallic: 0.9
   - Roughness: 0.35

3. **Blender → Animation** (optional, Level 3):
   Object → keyframe at frame 1
   Frame 250 → Y rotation 360° → keyframe
   Graph Editor → Linear interpolation
   Cycle modifier for seamless loop

4. **Blender → GLB export**:
   File → Export → glTF 2.0 (.glb)
   Format: GLB Binary
   Transform: +Y Up
   Geometry: Apply Modifiers, UVs, Normals
   Animation: All actions (if any)

5. **Optimize**:
   ```bash
   npm i -g @gltf-transform/cli
   gltf-transform optimize raw.glb final.glb \
     --texture-compress webp --texture-size 1024 \
     --compress meshopt --simplify 0.8 --simplify-error 0.001
   ```

## Production priority

### Phase A (first 5 GLBs — 1 week):

1. `atlas-copco-hb3000-chisel.glb` ⭐ featured
2. `furukawa-hb30g-chisel.glb`
3. `soosan-sb81-chisel.glb`
4. `atlas-copco-hb3000-piston.glb`
5. `featured/chisel-lineup.glb` (3-lineup hero)

### Phase B (top 15 — 3 weeks):

- Top 5 brand chisels
- Top 5 pistons
- Top 5 through-bolts

### Phase C (long tail, popular only):

- Dimensional variants as a single GLB + DB metadata
- Seasonal featured rotation

## Placeholder GLB for testing

Google sample GLBs for smoke tests:

- `https://modelviewer.dev/shared-assets/models/Astronaut.glb`
- `https://modelviewer.dev/shared-assets/models/Horse.glb`

For local testing: `curl -L -o placeholder.glb https://modelviewer.dev/shared-assets/models/Astronaut.glb`
