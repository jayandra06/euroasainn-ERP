export declare const config: {
    port: number;
    apiPrefix: string;
    nodeEnv: string;
    mongoUri: string;
    redis: {
        host: string;
        port: number;
        password: string | undefined;
    };
    jwt: {
        secret: string;
        accessTokenExpiry: string;
        refreshTokenExpiry: string;
    };
    cors: {
        origin: (origin: any, callback: any) => any;
        credentials: boolean;
    };
    jira: {
        domain: string;
        email: string;
        apiToken: string;
    };
};
//# sourceMappingURL=environment.d.ts.map