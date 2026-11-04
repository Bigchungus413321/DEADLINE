const fs = require("fs");

const serverUrl = (process.env.DEADLINE_SERVER_URL || "").trim().replace(/\\/+$/, "");
if (!serverUrl) {
  console.warn("WARNING: DEADLINE_SERVER_URL is not set. The deployed game will try to connect to its own origin.");
}
fs.writeFileSync(
  "public/config.js",
  `// Generated during the Netlify build.\\nwindow.DEADLINE_SERVER_URL = ${JSON.stringify(serverUrl)};\\n`,
  "utf8"
);
console.log("Generated public/config.js");
