// scripts/update-status.js
// Fetches the GitHub profile status (emoji + message) via the GraphQL API
// and writes it into README.md between the STATUS_START / STATUS_END markers.

const fs = require("fs");

const TOKEN = process.env.STATUS_TOKEN;
const README_PATH = "README.md";
const FALLBACK_TEXT = "🕹️ Developing applications";

async function fetchStatus() {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `{ viewer { status { emoji message } } }`,
    }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const status = json?.data?.viewer?.status;

  if (!status || !status.message) {
    return FALLBACK_TEXT;
  }

  // GitHub returns emoji as a shortcode like ":video_game:" — convert to the
  // actual emoji character for display, or fall back to leaving it as-is.
  const emojiMap = {
    ":video_game:": "🕹️",
    ":computer:": "💻",
    ":rocket:": "🚀",
    ":bulb:": "💡",
    ":zap:": "⚡",
    ":books:": "📚",
    ":coffee:": "☕",
    ":sleeping:": "😴",
    ":house:": "🏠",
    ":palm_tree:": "🌴",
  };

  const emoji = status.emoji ? (emojiMap[status.emoji] || status.emoji) : "";
  return `${emoji} ${status.message}`.trim();
}

async function main() {
  const statusText = await fetchStatus();

  const readme = fs.readFileSync(README_PATH, "utf8");
  const updated = readme.replace(
    /<!--STATUS_START-->[\s\S]*?<!--STATUS_END-->/,
    `<!--STATUS_START-->\n${statusText}\n<!--STATUS_END-->`
  );

  fs.writeFileSync(README_PATH, updated);
  console.log(`Updated status to: "${statusText}"`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});