import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { brandService } from '../services/brand.service';
import { categoryService } from '../services/category.service';
import { modelService } from '../services/model.service';
import { productHierarchyService } from '../services/product-hierarchy.service';
import { logger } from '../config/logger';

export class AdminPortalController {
  /* ===========================
     BRAND ROUTES
  =========================== */
  async getBrands(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const brands = await brandService.getBrands({
        status,
        skipPopulate: false,
      });
      res.status(200).json({
        success: true,
        data: brands,
      });
    } catch (error: any) {
      logger.error('Get brands error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get brands',
      });
    }
  }

  async createBrand(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const brand = await brandService.createBrand({
        name: req.body.name,
        description: req.body.description,
        createdBy: userId,
        isGlobal: true,
        status: 'active',
      });
      res.status(201).json({
        success: true,
        data: brand,
        message: 'Brand created successfully',
      });
    } catch (error: any) {
      logger.error('Create brand error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create brand',
      });
    }
  }

  async approveBrand(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const brand = await brandService.approveBrand(id);
      res.status(200).json({
        success: true,
        data: brand,
        message: 'Brand approved successfully',
      });
    } catch (error: any) {
      logger.error('Approve brand error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to approve brand',
      });
    }
  }

  async rejectBrand(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await brandService.rejectBrand(id);
      res.status(200).json({
        success: true,
        message: 'Brand rejected successfully',
      });
    } catch (error: any) {
      logger.error('Reject brand error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to reject brand',
      });
    }
  }

  async updateBrand(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const brand = await brandService.updateBrand(id, {
        name: req.body.name,
        description: req.body.description,
      });
      res.status(200).json({
        success: true,
        data: brand,
        message: 'Brand updated successfully',
      });
    } catch (error: any) {
      logger.error('Update brand error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update brand',
      });
    }
  }

  async deleteBrand(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await brandService.deleteBrand(id);
      res.status(200).json({
        success: true,
        message: 'Brand deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete brand error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete brand',
      });
    }
  }

  /* ===========================
     CATEGORY ROUTES
  =========================== */
  async getCategories(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const categories = await categoryService.getCategories({
        status,
        skipPopulate: false,
      });
      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error: any) {
      logger.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get categories',
      });
    }
  }

  async createCategory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const category = await categoryService.createCategory({
        name: req.body.name,
        description: req.body.description,
        createdBy: userId,
        isGlobal: true,
        status: 'active',
      });
      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error: any) {
      logger.error('Create category error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create category',
      });
    }
  }

  async approveCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const category = await categoryService.approveCategory(id);
      res.status(200).json({
        success: true,
        data: category,
        message: 'Category approved successfully',
      });
    } catch (error: any) {
      logger.error('Approve category error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to approve category',
      });
    }
  }

  async rejectCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await categoryService.rejectCategory(id);
      res.status(200).json({
        success: true,
        message: 'Category rejected successfully',
      });
    } catch (error: any) {
      logger.error('Reject category error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to reject category',
      });
    }
  }

  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const category = await categoryService.updateCategory(id, {
        name: req.body.name,
        description: req.body.description,
      });
      res.status(200).json({
        success: true,
        data: category,
        message: 'Category updated successfully',
      });
    } catch (error: any) {
      logger.error('Update category error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update category',
      });
    }
  }

  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await categoryService.deleteCategory(id);
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete category',
      });
    }
  }

  /* ===========================
     MODEL ROUTES
  =========================== */
  async getModels(req: AuthRequest, res: Response) {
    try {
      const status = req.query.status as string | undefined;
      const brandId = req.query.brandId as string | undefined;
      const models = await modelService.getModels({
        status,
        brandId,
        skipPopulate: false,
      });
      res.status(200).json({
        success: true,
        data: models,
      });
    } catch (error: any) {
      logger.error('Get models error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get models',
      });
    }
  }

  async createModel(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const model = await modelService.createModel({
        name: req.body.name,
        description: req.body.description,
        brandId: req.body.brandId,
        createdBy: userId,
        isGlobal: true,
        status: 'active',
      });
      res.status(201).json({
        success: true,
        data: model,
        message: 'Model created successfully',
      });
    } catch (error: any) {
      logger.error('Create model error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create model',
      });
    }
  }

  async approveModel(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const model = await modelService.approveModel(id);
      res.status(200).json({
        success: true,
        data: model,
        message: 'Model approved successfully',
      });
    } catch (error: any) {
      logger.error('Approve model error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to approve model',
      });
    }
  }

  async rejectModel(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await modelService.rejectModel(id);
      res.status(200).json({
        success: true,
        message: 'Model rejected successfully',
      });
    } catch (error: any) {
      logger.error('Reject model error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to reject model',
      });
    }
  }

  async updateModel(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const model = await modelService.updateModel(id, {
        name: req.body.name,
        description: req.body.description,
        brandId: req.body.brandId,
      });
      res.status(200).json({
        success: true,
        data: model,
        message: 'Model updated successfully',
      });
    } catch (error: any) {
      logger.error('Update model error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update model',
      });
    }
  }

  async deleteModel(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await modelService.deleteModel(id);
      res.status(200).json({
        success: true,
        message: 'Model deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete model error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete model',
      });
    }
  }

  /* ===========================
     PRODUCT HIERARCHY ROUTES
  =========================== */
  async getHierarchy(req: AuthRequest, res: Response) {
    try {
      const hierarchy = await productHierarchyService.getHierarchy();
      res.status(200).json({
        success: true,
        data: hierarchy,
      });
    } catch (error: any) {
      logger.error('Get hierarchy error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get hierarchy',
      });
    }
  }

  async createSubCategory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const subCategory = await productHierarchyService.createSubCategory({
        name: req.body.name,
        description: req.body.description,
        categoryId: req.body.categoryId,
        createdBy: userId,
        isGlobal: true,
        status: 'active',
      });
      res.status(201).json({
        success: true,
        data: subCategory,
        message: 'SubCategory created successfully',
      });
    } catch (error: any) {
      logger.error('Create subcategory error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create subcategory',
      });
    }
  }

  async createPart(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const part = await productHierarchyService.createPart({
        name: req.body.name,
        partNumber: req.body.partNumber,
        description: req.body.description,
        priceUSD: req.body.priceUSD || 0,
        stockQuantity: req.body.stockQuantity || 0,
        subCategoryId: req.body.subCategoryId,
        createdBy: userId,
        isGlobal: true,
        status: 'active',
      });
      res.status(201).json({
        success: true,
        data: part,
        message: 'Part created successfully',
      });
    } catch (error: any) {
      logger.error('Create part error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create part',
      });
    }
  }

  async updateSubCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const subCategory = await productHierarchyService.updateSubCategory(id, {
        name: req.body.name,
        description: req.body.description,
      });
      res.status(200).json({
        success: true,
        data: subCategory,
        message: 'SubCategory updated successfully',
      });
    } catch (error: any) {
      logger.error('Update subcategory error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update subcategory',
      });
    }
  }

  async updatePart(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const part = await productHierarchyService.updatePart(id, {
        name: req.body.name,
        partNumber: req.body.partNumber,
        description: req.body.description,
        priceUSD: req.body.priceUSD,
        stockQuantity: req.body.stockQuantity,
      });
      res.status(200).json({
        success: true,
        data: part,
        message: 'Part updated successfully',
      });
    } catch (error: any) {
      logger.error('Update part error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update part',
      });
    }
  }

  async deleteSubCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await productHierarchyService.deleteSubCategory(id);
      res.status(200).json({
        success: true,
        message: 'SubCategory deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete subcategory error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete subcategory',
      });
    }
  }

  async deletePart(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      await productHierarchyService.deletePart(id);
      res.status(200).json({
        success: true,
        message: 'Part deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete part error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete part',
      });
    }
  }
}

export const adminPortalController = new AdminPortalController();
