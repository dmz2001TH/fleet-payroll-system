const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Drivers
  getDrivers: () => request('/drivers'),
  searchDrivers: (q) => request(`/drivers/search?q=${encodeURIComponent(q)}`),
  createDriver: (data) => request('/drivers', { method: 'POST', body: JSON.stringify(data) }),
  updateDriver: (id, data) => request(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDriver: (id) => request(`/drivers/${id}`, { method: 'DELETE' }),

  // Trips
  getTrips: (periodId) => request(`/trips${periodId ? `?period_id=${periodId}` : ''}`),
  createTrip: (data) => request('/trips', { method: 'POST', body: JSON.stringify(data) }),
  createTripsBatch: (trips) => request('/trips/batch', { method: 'POST', body: JSON.stringify({ trips }) }),
  updateTrip: (id, data) => request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrip: (id) => request(`/trips/${id}`, { method: 'DELETE' }),

  // Periods
  getPeriods: () => request('/periods'),
  createPeriod: (data) => request('/periods', { method: 'POST', body: JSON.stringify(data) }),
  updatePeriod: (id, data) => request(`/periods/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePeriod: (id) => request(`/periods/${id}`, { method: 'DELETE' }),

  // Summaries
  getSummary: (periodId) => request(`/summaries/${periodId}`),
  getDriverSummary: (periodId, driverId) => request(`/summaries/${periodId}/${driverId}`),
  recalculateSummary: (periodId) => request(`/summaries/${periodId}/recalculate`, { method: 'POST' }),

  // Adjustments
  getAdjustments: (periodId) => request(`/adjustments${periodId ? `?period_id=${periodId}` : ''}`),
  createAdjustment: (data) => request('/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  updateAdjustment: (id, data) => request(`/adjustments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdjustment: (id) => request(`/adjustments/${id}`, { method: 'DELETE' }),
};
