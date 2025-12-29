import { Router } from 'express';
import { onboardingController } from '../controllers/onboarding.controller';
import { employeeService } from '../services/employee.service';

const router = Router();

// Public routes (no auth required) - for onboarding forms
router.get('/invitation', onboardingController.getInvitationByToken.bind(onboardingController));
router.post('/customer', onboardingController.submitCustomerOnboarding.bind(onboardingController));
router.post('/vendor', onboardingController.submitVendorOnboarding.bind(onboardingController));

// Employee onboarding routes (public routes)
router.get('/employee', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Invitation token is required',
      });
    }

    const result = await employeeService.getEmployeeOnboardingByToken(token as string);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to get employee onboarding',
    });
  }
});

router.post('/employee', async (req, res) => {
  try {
    const { token, ...formData } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Invitation token is required',
      });
    }

    const result = await employeeService.submitEmployeeOnboardingForm(token, formData);
    
    res.status(200).json({
      success: true,
      data: result,
      message: result.message,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to submit employee onboarding',
    });
  }
});

// Public endpoints for fetching active brands, categories, and models (for onboarding forms)
router.get('/brands', async (req, res) => {
  try {
    const { Brand } = await import('../models/brand.model');
    // Get only active global brands (approved) - direct query for public access
    const brands = await Brand.find({
      status: 'active',
      isGlobal: true,
    })
      .select('name _id')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get brands',
    });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const { Category } = await import('../models/category.model');
    // Get only active global categories (approved) - direct query for public access
    const categories = await Category.find({
      status: 'active',
      isGlobal: true,
    })
      .select('name _id')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get categories',
    });
  }
});

router.get('/models', async (req, res) => {
  try {
    const { Model } = await import('../models/model.model');
    // Get only active global models (approved) - direct query for public access
    const models = await Model.find({
      status: 'active',
      isGlobal: true,
    })
      .select('name _id brandId')
      .populate('brandId', 'name')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: models,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get models',
    });
  }
});

export default router;



