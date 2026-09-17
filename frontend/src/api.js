export async function api(path, options = {}) {
 const method = options.method || 'GET';
 if (method !== 'GET') await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
 const token = document.cookie.split('; ').find(c => c.startsWith('XSRF-TOKEN='))?.slice(11);
 const response = await fetch(`/api/v1/${path}`, { ...options, credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}), ...options.headers }, body: options.body ? JSON.stringify(options.body) : undefined });
 const data = await response.json();
 if (!response.ok) { const error = new Error(Object.values(data.errors || {}).flat()[0] || data.message || 'Something went wrong. Please try again.'); error.status = response.status; throw error; }
 return data;
}
