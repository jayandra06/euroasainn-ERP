import axios from 'axios';
export class ApiClient {
    constructor(baseURL = 'http://localhost:3000/api/v1') {
        this.accessToken = null;
        this.baseURL = baseURL;
        this.client = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Request interceptor to add access token
        this.client.interceptors.request.use((config) => {
            // Try to get token from localStorage if not set
            let token = this.accessToken;
            if (!token && typeof window !== 'undefined') {
                token = localStorage.getItem('accessToken');
            }
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.status === 401) {
                // Token expired or invalid
                this.accessToken = null;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            }
            return Promise.reject(error);
        });
    }
    setAccessToken(token) {
        this.accessToken = token;
    }
    getAccessToken() {
        return this.accessToken;
    }
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data;
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data;
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data;
    }
    async patch(url, data, config) {
        const response = await this.client.patch(url, data, config);
        return response.data;
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data;
    }
}
export const apiClient = new ApiClient();
//# sourceMappingURL=client.js.map