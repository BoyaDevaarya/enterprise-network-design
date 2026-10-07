import { WebSocketServer } from 'ws';
import { dbRepository } from '../repo/db.js';

let wss = null;
let telemetryInterval = null;

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    // Send initial handshake state & active telemetry
    const initialPayload = {
      type: 'INIT_STATE',
      data: {
        activeVlans: 12,
        activeSessions: 8432,
        coreHealth: 99.98,
        firewallSyncMs: 12,
        packetsBlockedPerSec: 14289,
        timestamp: new Date().toISOString()
      }
    };
    ws.send(JSON.stringify(initialPayload));

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        } else if (parsed.type === 'SIMULATE_RBAC') {
          broadcastWebSocket('RBAC_STATE_CHANGED', {
            department: parsed.department,
            simulatedBy: parsed.user || 'Admin',
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('[WS] Invalid client message:', e.message);
      }
    });
  });

  // Heartbeat ping/pong interval
  const pingInterval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // High-frequency dual-channel Telemetry stream tick
  telemetryInterval = setInterval(() => {
    if (!wss || wss.clients.size === 0) return;
    
    // Simulate high-frequency VLAN session fluctuations around 8,432 sessions across 12 VLANs
    const sessionDelta = Math.floor(Math.random() * 21) - 10;
    const baseSessions = 8432 + sessionDelta;
    const packetsBlocked = 14200 + Math.floor(Math.random() * 180);
    const latency = 11 + Math.floor(Math.random() * 4);

    const telemetryPayload = {
      type: 'TELEMETRY_TICK',
      channel: 'high_freq_metrics',
      data: {
        activeVlans: 12,
        activeSessions: baseSessions,
        coreHealth: (99.95 + Math.random() * 0.04).toFixed(2),
        firewallSyncMs: latency,
        packetsBlockedPerSec: packetsBlocked,
        vlanStats: Array.from({ length: 12 }, (_, i) => ({
          vlanId: (i + 1) * 10,
          name: `VLAN_${(i + 1) * 10}`,
          loadPct: Math.floor(35 + Math.random() * 50),
          activeSessions: Math.floor(baseSessions / 12) + Math.floor(Math.random() * 30 - 15)
        })),
        timestamp: new Date().toISOString()
      }
    };

    broadcastWebSocket('TELEMETRY_TICK', telemetryPayload.data);
  }, 3000);

  if (telemetryInterval.unref) telemetryInterval.unref();
  if (pingInterval.unref) pingInterval.unref();

  console.log('[WEBSOCKET] Dual-channel WebSocket server initialized on /ws');
}

export function broadcastWebSocket(type, payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type, data: payload, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  });
}

export function closeWebSocketServer() {
  if (telemetryInterval) clearInterval(telemetryInterval);
  if (wss) wss.close();
}
