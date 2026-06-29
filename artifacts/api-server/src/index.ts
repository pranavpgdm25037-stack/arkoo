import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];
const port = rawPort ? Number(rawPort) : 3002;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // ─── Keep-Alive Self-Ping (Render Free Tier) ───────────────────────────────
  // Render's free tier spins down services after 15 min of inactivity, showing
  // a "SERVICE WAKING UP" cold-start page to users. This loop pings the health
  // endpoint every 14 minutes to keep the server permanently awake at no cost.
  if (process.env.NODE_ENV === "production") {
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `https://arkoo-u8sx.onrender.com`;
    const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

    const keepAlive = async () => {
      try {
        const res = await fetch(`${RENDER_URL}/api/health`);
        logger.info(`[Keep-Alive] Ping successful — status ${res.status}`);
      } catch (err: any) {
        logger.warn(`[Keep-Alive] Ping failed: ${err.message}`);
      }
    };

    // Start pinging after 1 minute (let server fully boot first)
    setTimeout(() => {
      keepAlive();
      setInterval(keepAlive, PING_INTERVAL_MS);
    }, 60 * 1000);

    logger.info(`[Keep-Alive] Self-ping loop started — pinging ${RENDER_URL}/api/health every 14 min`);
  }
  // ───────────────────────────────────────────────────────────────────────────
});
