# Multiplayer and powerhouse

Target: casual shared rooms of up to 20 players per map. Preserve the existing Speedster and parkour abilities; add a selectable original powerhouse, Atlas, inspired by superhero flight and strength.

Use a Cloudflare Durable Object for each room with WebSocket presence, server-assigned identities, bounded snapshots, reconnects, and shared impact events. Store recent impact scars in SQLite and retain connection state through hibernation. Keep the frontend on Vercel. Show actual connection status and room capacity.

Atlas: R toggles flight, Space climbs, C descends, Shift boosts, V punches, X dives for a heavy landing. Ground jumps produce dust and shockwave rings; heavy landings shake the camera unless reduced motion is enabled. Punches leave bounded visual craters and cracks, with flying rubble. Buildings remain structurally intact.

Austin: live expanded map and minimap peers; working pan/zoom/recenter; rooftop detail, water-crossing flight, altitude-aware culling. Parkour: independent presence, radar peers and an expanded course map, both characters available.

Validation: physics and impact-target tests, lifecycle/reconnect tests, concurrent WebSocket clients, room isolation/capacity and disconnect tests, browser checks with two independent contexts, desktop/mobile layout and both maps. Use an isolated checkout because the original directory contains unfinished mobile/parkour changes.
