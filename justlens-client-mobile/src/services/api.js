const DEFAULT_SERVER_URL = 'http://192.168.1.100:5000/api';

export function getServerUrl() {
  return localStorage.getItem('justlens_mobile_server_url') || DEFAULT_SERVER_URL;
}

export function setServerUrl(url) {
  let cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl += '/api';
  }
  localStorage.setItem('justlens_mobile_server_url', cleanUrl);
  return cleanUrl;
}

export async function checkServerHealth() {
  try {
    const baseUrl = getServerUrl();
    const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
    const data = await res.json();
    return { success: res.ok && data.status === 'OK', data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function syncMasterData() {
  const baseUrl = getServerUrl();
  const res = await fetch(`${baseUrl}/products/sync`, { method: 'GET' });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal sinkronisasi data dari server');
  }
  return data.data;
}

export async function createTransaction(payload) {
  const baseUrl = getServerUrl();
  const token = localStorage.getItem('justlens_jwt_token');

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/transactions/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal memproses transaksi');
  }

  return data;
}

export async function getDailyShiftReport(dateStr) {
  const baseUrl = getServerUrl();
  const token = localStorage.getItem('justlens_jwt_token');

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}/reports/daily-shift?date=${dateStr}`, {
    method: 'GET',
    headers
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Gagal memuat laporan harian');
  }

  return data.data;
}
