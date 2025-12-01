/**
 * API utility with automatic token refresh
 */

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return null;
      }

      const baseUrl = API_URL || 'http://localhost:3000';
      const url = `${baseUrl}/api/v1/auth/refresh`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      if (data.success && data.data?.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        return data.data.accessToken;
      }

      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens on refresh failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Make an authenticated API request with automatic token refresh
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = localStorage.getItem('accessToken');

  // Build full URL - always use absolute URL to avoid proxy issues
  const baseUrl = API_URL || 'http://localhost:3000';
  const fullUrl = `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;

  // Make initial request
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
    Authorization: `Bearer ${token}`,
  };
  
  // Only set Content-Type if not already set and body is not FormData
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // If token expired, try to refresh
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry the request with new token
      const retryHeaders: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
        Authorization: `Bearer ${newToken}`,
      };
      
      if (!retryHeaders['Content-Type'] && !(options.body instanceof FormData)) {
        retryHeaders['Content-Type'] = 'application/json';
      }

      response = await fetch(fullUrl, {
        ...options,
        headers: retryHeaders,
      });
    } else {
      // Refresh failed, redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
  }

  return response;
}




