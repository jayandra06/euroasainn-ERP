import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';
import { RefreshToken } from '../models/refresh-token.model';
import { testUtils } from '../tests/setup';
// import mongoose from 'mongoose';
describe('AuthService', () => {
    let authService;
    beforeEach(() => {
        authService = new AuthService();
    });
    describe('hashPassword', () => {
        it('should hash a password successfully', async () => {
            const password = 'TestPassword123!';
            const hashedPassword = await authService.hashPassword(password);
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(0);
        });
        it('should produce different hashes for the same password', async () => {
            const password = 'TestPassword123!';
            const hash1 = await authService.hashPassword(password);
            const hash2 = await authService.hashPassword(password);
            expect(hash1).not.toBe(hash2);
        });
    });
    describe('comparePassword', () => {
        it('should return true for matching passwords', async () => {
            const password = 'TestPassword123!';
            const hashedPassword = await authService.hashPassword(password);
            const isMatch = await authService.comparePassword(password, hashedPassword);
            expect(isMatch).toBe(true);
        });
        it('should return false for non-matching passwords', async () => {
            const password = 'TestPassword123!';
            const wrongPassword = 'WrongPassword123!';
            const hashedPassword = await authService.hashPassword(password);
            const isMatch = await authService.comparePassword(wrongPassword, hashedPassword);
            expect(isMatch).toBe(false);
        });
    });
    describe('generateAccessToken', () => {
        it('should generate a valid JWT token', () => {
            const payload = {
                userId: '123',
                email: 'test@example.com',
                organizationId: '456',
                portalType: 'tech',
                role: 'tech_admin',
            };
            const token = authService.generateAccessToken(payload);
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.').length).toBe(3); // JWT has 3 parts
        });
    });
    describe('generateRefreshToken', () => {
        it('should generate a UUID refresh token', () => {
            const token = authService.generateRefreshToken();
            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            // UUID v4 format check
            expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });
    });
    describe('login', () => {
        it('should successfully login a user with valid credentials', async () => {
            // Create a test user
            const user = await testUtils.createTestUser({
                email: 'test@example.com',
                password: await authService.hashPassword('TestPassword123!'),
            });
            // Login
            const result = await authService.login('test@example.com', 'TestPassword123!', 'tech');
            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user.email).toBe('test@example.com');
            expect(result.user.id).toBe(user._id.toString());
        });
        it('should throw error for invalid email', async () => {
            await expect(authService.login('nonexistent@example.com', 'Password123!', 'tech')).rejects.toThrow('Invalid credentials');
        });
        it('should throw error for invalid password', async () => {
            await testUtils.createTestUser({
                email: 'test@example.com',
                password: await authService.hashPassword('CorrectPassword123!'),
            });
            await expect(authService.login('test@example.com', 'WrongPassword123!', 'tech')).rejects.toThrow('Invalid credentials');
        });
        it('should update last login timestamp', async () => {
            const user = await testUtils.createTestUser({
                email: 'test@example.com',
                password: await authService.hashPassword('TestPassword123!'),
            });
            const beforeLogin = user.lastLogin;
            await authService.login('test@example.com', 'TestPassword123!', 'tech');
            const updatedUser = await User.findById(user._id);
            expect(updatedUser?.lastLogin).toBeDefined();
            if (beforeLogin) {
                expect(updatedUser?.lastLogin?.getTime()).toBeGreaterThan(beforeLogin.getTime());
            }
        });
    });
    describe('refreshAccessToken', () => {
        it('should generate new access token with valid refresh token', async () => {
            const user = await testUtils.createTestUser();
            const refreshTokenString = authService.generateRefreshToken();
            // Create refresh token in database
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await RefreshToken.create({
                userId: user._id.toString(),
                token: refreshTokenString,
                organizationId: user.organizationId.toString(),
                portalType: user.portalType,
                expiresAt,
                isRevoked: false,
            });
            const result = await authService.refreshAccessToken(refreshTokenString);
            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(result.user.email).toBe(user.email);
        });
        it('should throw error for invalid refresh token', async () => {
            await expect(authService.refreshAccessToken('invalid-token')).rejects.toThrow('Invalid or expired refresh token');
        });
        it('should throw error for revoked refresh token', async () => {
            const user = await testUtils.createTestUser();
            const refreshTokenString = authService.generateRefreshToken();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await RefreshToken.create({
                userId: user._id.toString(),
                token: refreshTokenString,
                organizationId: user.organizationId.toString(),
                portalType: user.portalType,
                expiresAt,
                isRevoked: true, // Revoked
            });
            await expect(authService.refreshAccessToken(refreshTokenString)).rejects.toThrow('Invalid or expired refresh token');
        });
    });
    describe('logout', () => {
        it('should revoke refresh token on logout', async () => {
            const user = await testUtils.createTestUser();
            const { accessToken, refreshToken } = await testUtils.getAuthTokens(user);
            // Create refresh token in database
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await RefreshToken.create({
                userId: user._id.toString(),
                token: refreshToken,
                organizationId: user.organizationId.toString(),
                portalType: user.portalType,
                expiresAt,
                isRevoked: false,
            });
            await authService.logout(accessToken, refreshToken);
            const revokedToken = await RefreshToken.findOne({ token: refreshToken });
            expect(revokedToken?.isRevoked).toBe(true);
            expect(revokedToken?.revokedAt).toBeDefined();
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map