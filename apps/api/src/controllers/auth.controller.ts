import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password, portalType } = req.body;

      if (!email || !password || !portalType) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, and portalType are required',
        });
      }

      const result = await authService.login(email, password, portalType);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Login failed',
      });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed',
      });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '') || '';
      const { refreshToken } = req.body;

      // Refresh token is preferred but not strictly required - we can still logout
      // by just blacklisting the access token if refresh token is missing
      await authService.logout(token, refreshToken || '');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      logger.error('Logout error:', error);
      // Even if logout fails on backend, we should still return success
      // to allow frontend to clear local storage and redirect
      res.status(200).json({
        success: true,
        message: 'Logged out (some cleanup may have failed)',
        warning: error.message || 'Some logout operations failed',
      });
    }
  }

  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const user = await authService.getCurrentUser(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Get me error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user',
      });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required',
        });
      }

      const result = await authService.changePassword(userId, currentPassword, newPassword);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Change password error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change password',
      });
    }
  }

  async updatePreferences(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const preferences = req.body;
      const result = await authService.updatePreferences(userId, preferences);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update preferences error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update preferences',
      });
    }
  }

  async updateSecurityQuestion(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
      }

      const { question, answer } = req.body;

      if (!question || !answer) {
        return res.status(400).json({
          success: false,
          error: 'Security question and answer are required',
        });
      }

      const result = await authService.updateSecurityQuestion(userId, question, answer);

      res.status(200).json(result);
    } catch (error: any) {
      logger.error('Update security question error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update security question',
      });
    }
  }
}

export const authController = new AuthController();
