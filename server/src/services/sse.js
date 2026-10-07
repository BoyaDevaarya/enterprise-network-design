/**
 * Server-Sent Events (SSE) Manager
 */

const clients = new Set();
let heartbeatInterval = null;

export function initSSEService() {
  if (!heartbeatInterval) {
    heartbeatInterval = setInterval(() => {
      broadcastPing();
    }, 20000);
    // Prevent unref error in tests
    if (heartbeatInterval.unref) {
      heartbeatInterval.unref();
    }
  }
}

export function handleSSEConnection(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if proxied

  // Send initial connection message
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'SSE stream established' })}\n\n`);

  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
}

export function broadcastSSE(eventType, payload) {
  const dataString = JSON.stringify(payload || {});
  const message = `event: ${eventType}\ndata: ${dataString}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch (err) {
      clients.delete(client);
    }
  }
}

function broadcastPing() {
  for (const client of clients) {
    try {
      client.write(': ping\n\n');
    } catch (err) {
      clients.delete(client);
    }
  }
}

export function closeAllSSEConnections() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  for (const client of clients) {
    try {
      client.end();
    } catch (e) {}
  }
  clients.clear();
}
