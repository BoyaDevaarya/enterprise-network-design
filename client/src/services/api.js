import { useAuthStore } from '../store/authStore';

export async function apiRequest(endpoint, options = {}) {
  const previewDept = useAuthStore.getState().previewDept;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (previewDept) {
    headers['X-Preview-Dept'] = previewDept;
  }

  const config = {
    credentials: 'include',
    ...options,
    headers
  };

  const response = await fetch(endpoint, config);

  if (response.status === 401) {
    // Session expired or unauthenticated
    useAuthStore.getState().clearUser();
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/plain')) {
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || `Request failed with status ${response.status}`);
    }
    return text;
  }

  const data = await response.json();
  if (!response.ok) {
    const errorObj = new Error(data?.error?.message || `Request failed with status ${response.status}`);
    errorObj.status = response.status;
    errorObj.code = data?.error?.code;
    errorObj.matchedRuleId = data?.matchedRuleId;
    throw errorObj;
  }

  return data;
}
