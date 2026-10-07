import { toast } from 'sonner';

let eventSource = null;
let webSocket = null;
let reconnectAttempt = 0;
let isConnected = false;

const statusListeners = new Set();
const telemetryListeners = new Set();

export function subscribeSSEStatus(callback) {
  statusListeners.add(callback);
  callback(isConnected);
  return () => statusListeners.delete(callback);
}

export function subscribeTelemetry(callback) {
  telemetryListeners.add(callback);
  return () => telemetryListeners.delete(callback);
}

function updateStatus(status) {
  isConnected = status;
  for (const listener of statusListeners) {
    try {
      listener(isConnected);
    } catch (e) {}
  }
}

function notifyTelemetry(data) {
  for (const listener of telemetryListeners) {
    try {
      listener(data);
    } catch (e) {}
  }
}

export function setupSSEListener(queryClient) {
  if (webSocket || eventSource) return;

  function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      webSocket = new WebSocket(wsUrl);

      webSocket.onopen = () => {
        updateStatus(true);
        reconnectAttempt = 0;
      };

      webSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data || '{}');
          if (message.type === 'TELEMETRY_TICK') {
            notifyTelemetry(message.data);
          } else if (message.type === 'RBAC_STATE_CHANGED') {
            toast.info(`RBAC State Simulation Switched to ${message.data.department}`, {
              description: `Triggered by ${message.data.simulatedBy}`
            });
            invalidateAll(queryClient);
          }
        } catch (e) {}
      };

      webSocket.onerror = () => {
        // Fall back to SSE if WS fails
        if (webSocket) {
          webSocket.close();
          webSocket = null;
        }
        connectSSE();
      };

      webSocket.onclose = () => {
        updateStatus(false);
        webSocket = null;
        scheduleReconnect();
      };
    } catch (e) {
      connectSSE();
    }
  }

  function connectSSE() {
    if (eventSource) return;
    eventSource = new EventSource('/api/events', { withCredentials: true });

    eventSource.addEventListener('connected', () => {
      updateStatus(true);
      reconnectAttempt = 0;
    });

    eventSource.addEventListener('policy-changed', (event) => {
      try {
        const data = JSON.parse(event.data || '{}');
        toast.info('Network policy updated live', { description: data.reason || 'ACL rules recalculated' });
      } catch (e) {}
      invalidateAll(queryClient);
    });

    eventSource.addEventListener('rule-expired', (event) => {
      try {
        const data = JSON.parse(event.data || '{}');
        toast.warning('Temporary access expired', { description: data.rule?.comment || 'Access window ended' });
      } catch (e) {}
      invalidateAll(queryClient);
    });

    eventSource.addEventListener('access-request', (event) => {
      try {
        const data = JSON.parse(event.data || '{}');
        if (data.action === 'created') {
          toast.info('New access request received', { description: `${data.request?.userName} requested access` });
        }
      } catch (e) {}
      queryClient.invalidateQueries({ queryKey: ['access-requests'] });
    });

    eventSource.onerror = () => {
      updateStatus(false);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    reconnectAttempt++;
    const backoffMs = Math.min(30000, 1000 * Math.pow(1.5, reconnectAttempt) + Math.random() * 500);
    setTimeout(() => {
      invalidateAll(queryClient);
      connectWebSocket();
    }, backoffMs);
  }

  function invalidateAll(qc) {
    qc.invalidateQueries({ queryKey: ['policy-matrix'] });
    qc.invalidateQueries({ queryKey: ['policy-score'] });
    qc.invalidateQueries({ queryKey: ['resources'] });
    qc.invalidateQueries({ queryKey: ['network'] });
    qc.invalidateQueries({ queryKey: ['rules'] });
    qc.invalidateQueries({ queryKey: ['configs'] });
    qc.invalidateQueries({ queryKey: ['audit-logs'] });
  }

  connectWebSocket();
}

export function closeSSEListener() {
  if (webSocket) {
    webSocket.close();
    webSocket = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  updateStatus(false);
}
