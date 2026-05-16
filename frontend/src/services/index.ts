/* Camada de serviços, comunicação com o backend FastAPI */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = localStorage.getItem('token')
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`
    try {
      const errorJson = await res.json()
      if (errorJson && errorJson.detail) {
        errorMsg = errorJson.detail
      }
    } catch (_) {
      // Ignora erro ao decodificar JSON se o corpo não for JSON
    }
    throw new Error(errorMsg)
  }
  return res.json() as Promise<T>
}

export { BASE_URL }
