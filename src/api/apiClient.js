
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://tickett-management-backend.onrender.com";

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/*Handle API response*/
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

  return data;
}
const api = {
  async get(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {}),
        },
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('GET request failed:', endpoint, error);
      throw error;
    }
  },

  /*POST request*/
  async post(endpoint, body, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {}),
        },
        body: JSON.stringify(body),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('POST request failed:', endpoint, error);
      throw error;
    }
  },

  /*PUT request*/
  async put(endpoint, body, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'PUT',
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {}),
        },
        body: JSON.stringify(body),
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('PUT request failed:', endpoint, error);
      throw error;
    }
  },

  /*DELETE request*/
  async delete(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        method: 'DELETE',
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {}),
        },
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('DELETE request failed:', endpoint, error);
      throw error;
    }
  },
};

export default api;
