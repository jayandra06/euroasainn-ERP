import { JwtPayload } from '../../../../packages/shared/src/types/index.ts';
export declare function generateAccessToken(payload: JwtPayload): string;
export declare function generateRefreshToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload;
//# sourceMappingURL=jwt.d.ts.map