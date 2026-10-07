import { toast } from 'sonner';

let eventSource = null;
let reconnectDelay = 1000;
let isConnected = false;
const listeners = new Set();

export function subscribeSSEStatus(callback) {
  listeners.add(callback);
  callback(isConnected);
  return () => listeners.delete(callback);
}

function updateStatus(status) {
  isConnected = status;
  for (const listener of listeners) {
    try {
      listener(isConnected);
    } catch (e) {}
  }
}

export function setupSSEListener(queryClient) {
  if (eventSource) return;

  function connect() {
    eventSource = new EventSource('/api/events', { withCredentials: true });

    eventSource.addEventListener('connected', () => {
      updateStatus(true);
      reconnectDelay = 1000; // reset delay on successful connection
    });

    eventSource.addEventListener('policy-changed', (event) => {
      try {
        const data = JSON.parse(event.data || '{}');
        toast.info('Network policy updated live', { description: data.reason || 'ACL rules recalculated' });
      } catch (e) {}

      queryClient.invalidateQueries({ queryKey: ['policy-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['policy-score'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['network'] });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    });

    eventSource.addEventListener('rule-expired', (event) => {
      try {
        const data = JSON.parse(event.data || '{}');
        toast.warning('Temporary access expired', { description: data.rule?.comment || 'Access window ended' });
      } catch (e) {}

      queryClient.invalidateQueries({ queryKey: ['policy-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['rules'] });
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

    eventSource.addEventListener('user-changed', () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    });

    eventSource.onerror = () => {
      updateStatus(false);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      // Reconnect with exponential backoff (capped at 16s)
      setTimeout(() => {
        reconnectDelay = Math.min(16000, reconnectDelay * 2);
        queryClient.invalidateQueries(); // refetch on reconnect
        connect();
      }, reconnectDelay);
    };
  }

  connect();
}

export function closeSSEListener() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  updateStatus(false);
}
