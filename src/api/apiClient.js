/**
 * API Client
 * Centralized HTTP client with authentication and error handling
 */
import API_CONFIG from './config';

/**
 * Get authentication headers
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Handle API response
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  
  let data;
  if (isJson) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const error = new Error(data?.message || data || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return {
    ok: true,
    status: response.status,
    data: data,
  };
}

/**
 * API Client
 */
const apiClient = {
  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
        ...options,
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('GET request failed:', endpoint, error);
      return {
        ok: false,
        error: error.message,
        message: error.message,
      };
    }
  },

  /**
   * POST request
   */
  async post(endpoint, body, options = {}) {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
        ...options,
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('POST request failed:', endpoint, error);
      return {
        ok: false,
        error: error.message,
        message: error.message,
      };
    }
  },

  /**
   * PUT request
   */
  async put(endpoint, body, options = {}) {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
        ...options,
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('PUT request failed:', endpoint, error);
      return {
        ok: false,
        error: error.message,
        message: error.message,
      };
    }
  },

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        ...options,
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('DELETE request failed:', endpoint, error);
      return {
        ok: false,
        error: error.message,
        message: error.message,
      };
    }
  },
};

export default apiClient;
