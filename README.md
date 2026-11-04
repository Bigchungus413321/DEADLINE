# DEADLINE — Netlify + Render multiplayer deployment

This version is prepared for:
- Netlify: static website (HTML/CSS/JS)
- Render: persistent Node.js + Socket.IO multiplayer server

No database is required for the current game. Room state, player positions, timer, and chat are held in the server's memory and reset when the server restarts.

## 1. Put the project on GitHub
Upload the contents of this folder to a GitHub repository. Keep `server.js`, `package.json`, `build.js`, `netlify.toml`, and the `public` folder at the repository root.

## 2. Deploy the multiplayer server on Render
Create a new **Web Service** and connect the GitHub repository.
- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Instance type: choose an available plan

After deployment, copy the service URL, for example:
`https://your-deadline-server.onrender.com`

## 3. Set the Netlify environment variable
In Netlify: Site configuration → Environment variables → Add a variable.

Enter:
- Key: `DEADLINE_SERVER_URL`
- Value: your Render service URL, with no trailing slash
- Contains secret values: OFF (this URL is public and is sent to players' browsers)
- Scope: Builds (or All scopes if that is the available option)
- Deploy contexts: use the same value for all contexts

Save the variable.

## 4. Deploy the website on Netlify
Import the same GitHub repository into Netlify.
The included `netlify.toml` sets:
- Build command: `npm run build`
- Publish directory: `public`

Trigger a deploy after setting `DEADLINE_SERVER_URL`. The build creates `public/config.js`, which tells the browser where the Render Socket.IO server lives.

## 5. Play
Open the Netlify website. Create a room and share its code with 1–3 friends.

## Local testing
Run `npm install` and `npm start`, then open `http://localhost:3000`.
The local client falls back to the same origin if no server URL is configured.

## Notes
- The current game does not save accounts, progress, or leaderboards. Add a database such as Supabase only when you want persistent player data.
- This server stores active rooms in memory. Deploy one server instance for this prototype; multiple instances would need shared room state (for example Redis) and Socket.IO scaling support.
- The puzzles are fictional pattern/logic minigames, not real-world explosive-device instructions.
