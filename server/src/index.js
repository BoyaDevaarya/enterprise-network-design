import app from './app.js';
import { getJwtSecret } from './middleware/auth.js';
import { closeAllSSEConnections } from './services/sse.js';
import { stopExpiryTimer } from './services/timer.js';
import { saveDb } from './repo/db.js';

const PORT = process.env.PORT || 4000;

// Resolve JWT secret on startup (will exit in production if missing)
getJwtSecret();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` EnterpriseNet Access Portal Server Running`);
  console.log(` Listening on: 0.0.0.0:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

const handleShutdown = (signal) => {
  console.log(`\n[SERVER] ${signal} received: initiating graceful shutdown...`);
  closeAllSSEConnections();
  stopExpiryTimer();
  saveDb();
  server.close(() => {
    console.log('[SERVER] HTTP server closed gracefully.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
