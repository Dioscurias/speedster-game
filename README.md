# Speedster Game

Independent source repository and Vercel deployment.

Run `npm ci`, then `npm run dev`. Use `npm test`, `npm run build`, and `npm run preview` for validation.

Speedster owns both game maps, HUD, physics, game assets and `/api/room`. The root `/` starts the game directly. Manta Ray is maintained in its own repository and hosting project. Configure `VITE_MANTA_ORIGIN` to authorize a different lab host for embedded map changes and resume messages. Multiplayer storage environment variables stay on this Vercel project.

Production: https://speedster-game.vercel.app

Repository: https://github.com/Dioscurias/speedster-game
