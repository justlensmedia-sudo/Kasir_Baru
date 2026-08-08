// API Service for Justlens Client POS

const DEFAULT_SERVER_URL = 'http://localhost:5000/api';

export const getServerUrl = () => {
  return localStorage.getItem('justlens_server_url') || DEFAULT_SERVER_URL;
};

export const setServerUrl = (url) => {
  let formattedUrl = url.trim();
  // Strip trailing slash if present
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }
  // Ensure /api path is present if missing
  if (!formattedUrl.endsWith('/api') && !formattedUrl.includes('/api/')) {
    formattedUrl = `${formattedUrl}/api`;
  }
  localStorage.setItem('justlens_server_url', formattedUrl);
  return formattedUrl;
};

export const checkServerHealth = async (customUrl = null) => {
  const url = customUrl || getServerUrl();
  const rootUrl = url.replace(/\/api\/?$/, '');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    }).catch(async () => {
      // Fallback check root /
      return await fetch(`${rootUrl}/`, { signal: controller.signal });
    });

    clearTimeout(timeoutId);

    if (response && response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: true, data, url };
    }
    return { success: false, message: 'Server tidak merespons OK', url };
  } catch (error) {
    return { success: false, message: error.message || 'Gagal terhubung ke server', url };
  }
};

export const syncMasterData = async () => {
  const baseUrl = getServerUrl();
  try {
    const response = await fetch(`${baseUrl}/products/sync`);
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
    throw new Error(result.message || 'Gagal mengambil data produk.');
  } catch (error) {
    console.error('Error syncing master data:', error);
    throw error;
  }
};

export const createTransaction = async (payload) => {
  const baseUrl = getServerUrl();
  try {
    const response = await fetch(`${baseUrl}/transactions/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal memproses transaksi.');
    }
    return result.data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const getOrders = async (statusFilter = '') => {
  const baseUrl = getServerUrl();
  try {
    const queryParam = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    const response = await fetch(`${baseUrl}/orders/status${queryParam}`);
    
    if (!response.ok) {
      // Fallback to GET /transactions
      const txResponse = await fetch(`${baseUrl}/transactions`);
      if (txResponse.ok) {
        const txResult = await txResponse.json();
        return txResult.data || [];
      }
      throw new Error(`HTTP Error ${response.status}`);
    }
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, payload) => {
  const baseUrl = getServerUrl();
  try {
    const response = await fetch(`${baseUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal menginstal pembaruan status order.');
    }
    return result.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};
