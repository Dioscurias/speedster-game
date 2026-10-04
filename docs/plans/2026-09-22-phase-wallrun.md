# Phasing and wall running

Goal: Hold Q or Phase to cross buildings and traffic; jump into a building at speed to run up its wall, jump off, and reach rooftops.

Architecture: Extend fixed-step physics with building contact metadata, roof support, phasing safe-exit state, and wall attachment. Keep water/map bounds solid. Drive character orientation and animation from physical wall state. Keep arrow camera controls.

1. Add failing physics tests for phasing, safe exit, boundaries, fast airborne wall entry, low-speed rejection, wall jump, and rooftop support.
2. Implement collision filtering and wall traversal in game.js and Austin collider adapter.
3. Add Q and pointer control, visual phasing, wall-oriented run animation, HUD and guide instructions.
4. Run unit/build/browser checks and inspect traversal visually.
