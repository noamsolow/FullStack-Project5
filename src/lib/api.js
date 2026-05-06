const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";
const cacheStore = new Map();

function buildUrl(path) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request(path, options = {}) {
  const url = buildUrl(path);
  const method = options.method || "GET";
  const useCache = method === "GET" && options.cache !== false;
  const cacheKey = url;

  if (useCache && cacheStore.has(cacheKey)) {
    return cacheStore.get(cacheKey);
  }

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  const data = response.status === 204 ? null : await response.json();
  if (useCache) cacheStore.set(cacheKey, data);
  if (method !== "GET") cacheStore.clear();
  return data;
}

export const api = {
  get: (path, options = {}) => request(path, { ...options, method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
  clearCache: () => cacheStore.clear()
};

export function queryString(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });
  const result = search.toString();
  return result ? `?${result}` : "";
}
