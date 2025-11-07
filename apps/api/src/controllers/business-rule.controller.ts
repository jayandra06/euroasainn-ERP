import { Request, Response } from 'express';
import { businessRuleService } from '../services/business-rule.service';

export class BusinessRuleController {
  /**
   * Create a new business rule
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        type,
        status,
        organizationId,
        portalType,
        config,
        tags,
        category,
        author,
      } = req.body;

      if (!name || !type || !config) {
        res.status(400).json({
          success: false,
          error: 'Name, type, and config are required',
        });
        return;
      }

      // Validate config
      const validation = await businessRuleService.validateRuleConfig(config);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid rule configuration',
          details: validation.errors,
        });
        return;
      }

      const rule = await businessRuleService.createRule({
        name,
        description,
        type,
        status,
        organizationId,
        portalType,
        config,
        tags,
        category,
        author,
      });

      res.status(201).json({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create business rule',
      });
    }
  }

  /**
   * Get all business rules
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        organizationId,
        portalType,
        type,
        status,
        category,
        tags,
      } = req.query;

      const filters: any = {};

      if (organizationId) filters.organizationId = organizationId as string;
      if (portalType) filters.portalType = portalType as string;
      if (type) filters.type = type as string;
      if (status) filters.status = status as string;
      if (category) filters.category = category as string;
      if (tags) {
        filters.tags = Array.isArray(tags) ? tags : [tags as string];
      }

      const rules = await businessRuleService.getRules(filters);

      res.status(200).json({
        success: true,
        data: rules,
        count: rules.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get business rules',
      });
    }
  }

  /**
   * Get a business rule by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const rule = await businessRuleService.getRuleById(id);

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'Business rule not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get business rule',
      });
    }
  }

  /**
   * Update a business rule
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate config if provided
      if (updates.config) {
        const validation = await businessRuleService.validateRuleConfig(updates.config);
        if (!validation.valid) {
          res.status(400).json({
            success: false,
            error: 'Invalid rule configuration',
            details: validation.errors,
          });
          return;
        }
      }

      const rule = await businessRuleService.updateRule(id, updates);

      if (!rule) {
        res.status(404).json({
          success: false,
          error: 'Business rule not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: rule,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update business rule',
      });
    }
  }

  /**
   * Delete a business rule
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await businessRuleService.deleteRule(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Business rule not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Business rule deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete business rule',
      });
    }
  }

  /**
   * Execute a business rule
   */
  async execute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { facts } = req.body;

      if (!facts || typeof facts !== 'object') {
        res.status(400).json({
          success: false,
          error: 'Facts are required and must be an object',
        });
        return;
      }

      const result = await businessRuleService.executeRule(id, facts);

      res.status(200).json({
        success: result.success,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to execute business rule',
      });
    }
  }

  /**
   * Validate rule configuration
   */
  async validate(req: Request, res: Response): Promise<void> {
    try {
      const { config } = req.body;

      if (!config) {
        res.status(400).json({
          success: false,
          error: 'Config is required',
        });
        return;
      }

      const validation = await businessRuleService.validateRuleConfig(config);

      res.status(200).json({
        success: validation.valid,
        data: validation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to validate rule configuration',
      });
    }
  }
}

export const businessRuleController = new BusinessRuleController();







