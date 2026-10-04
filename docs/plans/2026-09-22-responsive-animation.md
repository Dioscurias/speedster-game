# Responsive character animation

**Goal:** Make the existing character react clearly and promptly to movement, boost, steering, braking, jumping, landing and impacts.
**Design:** Blend the downloaded Idle, Walk and Run clips by measured speed. Layer procedural spine, limb and body offsets over those clips for action-specific reactions. Use immediate input anticipation, measured acceleration and momentum for lean; separate takeoff/airborne/landing poses prevent air-running. Smooth transitions use simulation time so slow motion and pause stay consistent. Do not change movement physics or controls.
**Validation:** Test animation transitions and pause, clip weight normalization, opposite turns, braking/boost differences, landing recovery, slow-motion timing, and no cumulative bone offsets. Verify in browser with action screenshots and diagnostic animation state, then run existing tests/build.
