import { AxiosRequestConfig } from 'axios';
export declare class ApiClient {
    private client;
    private baseURL;
    private accessToken;
    constructor(baseURL?: string);
    setAccessToken(token: string | null): void;
    getAccessToken(): string | null;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
}
export declare const apiClient: ApiClient;
//# sourceMappingURL=client.d.ts.map