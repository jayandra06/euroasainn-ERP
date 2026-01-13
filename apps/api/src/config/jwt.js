import jwt from 'jsonwebtoken';
import { config } from './environment';
export function generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.accessTokenExpiry,
    });
}
export function generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.refreshTokenExpiry,
    });
}
export function verifyToken(token) {
    try {
        return jwt.verify(token, config.jwt.secret);
    }
    catch {
        throw new Error('Invalid or expired token');
    }
}
//# sourceMappingURL=jwt.js.map