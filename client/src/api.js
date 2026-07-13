const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function request(url, options) {
  return fetch(url, { ...options, credentials: 'include' }).then(handle);
}

export const api = {
  login: (phone, password) => request(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, password })
  }),
  logout: () => request(`${BASE}/auth/logout`, { method: 'POST' }),
  getMe: () => request(`${BASE}/auth/me`),
  changePassword: (currentPassword, newPassword) => request(`${BASE}/auth/change-password`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword })
  }),
  updateProfile: (phone, currentPassword) => request(`${BASE}/auth/profile`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, currentPassword })
  }),

  getIngredients: () => request(`${BASE}/ingredients`),
  addIngredient: (data) => request(`${BASE}/ingredients`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  updateIngredient: (id, data) => request(`${BASE}/ingredients/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  restockIngredient: (id, amount, amountUnit, totalPaid) => request(`${BASE}/ingredients/${id}/restock`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, amountUnit, totalPaid })
  }),
  deleteIngredient: (id) => request(`${BASE}/ingredients/${id}`, { method: 'DELETE' }),

  getWastageReasons: () => request(`${BASE}/wastage/reasons`),
  logWastage: (data) => request(`${BASE}/wastage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  getWastageHistory: ({ from, to } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return request(`${BASE}/wastage/history${query ? `?${query}` : ''}`);
  },
  deleteWastageHistory: (id) => request(`${BASE}/wastage/history/${id}`, { method: 'DELETE' }),

  getMenuItems: () => request(`${BASE}/menu-items`),
  addMenuItem: (data) => request(`${BASE}/menu-items`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  updateMenuItem: (id, data) => request(`${BASE}/menu-items/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  }),
  deleteMenuItem: (id) => request(`${BASE}/menu-items/${id}`, { method: 'DELETE' }),

  processTally: (entries) => request(`${BASE}/tally/process`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries })
  }),
  getHistory: ({ from, to } = {}) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return request(`${BASE}/tally/history${query ? `?${query}` : ''}`);
  },
  deleteHistory: (id) => request(`${BASE}/tally/history/${id}`, { method: 'DELETE' })
};