# Rate My Idea – Backend-Proxy

Ohne dieses Backend funktionieren die KI-Funktionen von `rate-my-idea.html`
nur innerhalb der Claude.ai-Vorschau. Für einen eigenständigen Betrieb
(eigene Domain, Download der Datei, o. ä.) brauchst du diesen Proxy, weil
ein echter Anthropic-API-Key niemals im Frontend-Code stehen darf.

## Einrichtung

1. Node.js installieren (falls noch nicht vorhanden): https://nodejs.org
2. In diesem Ordner:
   ```
   npm install
   cp .env.example .env
   ```
3. In `.env` deinen echten Anthropic-API-Key eintragen
   (API-Key erstellen unter: https://console.anthropic.com/settings/keys)
4. Server starten:
   ```
   npm start
   ```
   Läuft standardmäßig auf `http://localhost:3000`

## Frontend anpassen

In `rate-my-idea.html` die Zeile

```js
const API_ENDPOINT = "https://api.anthropic.com/v1/messages";
```

ersetzen durch die URL deines Servers, z. B.

```js
const API_ENDPOINT = "https://dein-server.de/api/claude";
```

(lokal zum Testen: `http://localhost:3000/api/claude`)

## Live-Betrieb

Diesen Ordner z. B. bei Render.com, Railway.app oder Fly.io deployen
(alle haben kostenlose Einstiegsstufen). Wichtig: den API-Key dort als
Umgebungsvariable setzen, nicht im Code.

## Sicherheitshinweis

Dieses Beispiel ist bewusst einfach gehalten (Basis-Ratelimiting pro IP).
Für echten Produktivbetrieb zusätzlich empfehlenswert:
- Zugriff per CORS auf deine eigene Domain beschränken (aktuell offen für alle)
- Striktere Rate-Limits / Abuse-Schutz (z. B. Cloudflare davor)
- Monitoring der API-Kosten (jede Anfrage kostet über deinen Anthropic-Account)
