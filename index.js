// Minimaler Proxy-Server für Rate My Idea
//
// Warum das nötig ist:
// Der Aufruf an api.anthropic.com aus dem Browser heraus funktioniert nur,
// solange rate-my-idea.html in der Claude.ai-Vorschau läuft (dort wird die
// Anfrage automatisch autorisiert). Öffnest du die HTML-Datei selbst im
// Browser oder hostest du sie auf einer eigenen Domain, brauchst du dieses
// kleine Backend: Es hält deinen echten Anthropic-API-Key sicher auf dem
// Server (niemals im Frontend!) und leitet die Anfragen weiter.
//
// Setup:
//   1. npm install
//   2. Kopiere .env.example zu .env und trage deinen echten API-Key ein
//   3. npm start
//   4. In rate-my-idea.html die Konstante API_ENDPOINT auf die URL dieses
//      Servers ändern, z. B. "https://dein-server.de/api/claude"
//
// Deployment: lässt sich z. B. auf Render, Railway, Fly.io oder einem
// eigenen vServer betreiben. Für Vercel/Netlify müsste man daraus eine
// Serverless Function machen (Struktur ist fast identisch).

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
// ALLOWED_ORIGIN als Umgebungsvariable setzen (z. B. https://deine-domain.de),
// sobald das Frontend eine feste Adresse hat. Ohne gesetzte Variable bleibt
// der Proxy offen für alle Origins, damit lokales Testen weiterhin funktioniert.
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json({ limit: "2mb" }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("Fehler: ANTHROPIC_API_KEY ist nicht gesetzt (siehe .env).");
  process.exit(1);
}

// Einfaches Rate Limiting, damit niemand deinen API-Key über deinen Server
// missbrauchen kann. Für echten Schutz zusätzlich z. B. IP-Limits oder
// einen Cloudflare-Proxy davor schalten.
const requestLog = new Map(); // ip -> [timestamps]
const MAX_REQUESTS_PER_MINUTE = 12;

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = (requestLog.get(ip) || []).filter(t => now - t < windowMs);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > MAX_REQUESTS_PER_MINUTE;
}

app.post("/api/claude", async (req, res) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Zu viele Anfragen, bitte kurz warten." });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(req.body)
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    console.error("Proxy-Fehler:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy läuft auf Port ${PORT}`));
