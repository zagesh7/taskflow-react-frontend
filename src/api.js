const configuredApi = globalThis.TASKFLOW_CONFIG?.apiUrl || import.meta.env.VITE_API_URL
const API = import.meta.env.DEV
  ? configuredApi || 'http://localhost:8000/api'
  : configuredApi && !/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(configuredApi)
    ? configuredApi
    : 'https://taskflow-laravel-api.wasmer.app/api'

export async function api(path, options = {}) {
  const token = localStorage.getItem('taskflow_token')
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = body.message || body.error?.message || Object.values(body.errors || {})[0]?.[0] || 'Something went wrong.'
    throw new Error(message)
  }
  if (!body || typeof body !== 'object' || !Object.hasOwn(body, 'data')) {
    throw new Error(`API response from ${API}${path} is missing the expected data field. Check that Laravel is running at this URL and inspect its response.`)
  }
  return body.data
}
