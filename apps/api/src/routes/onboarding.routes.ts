import { Router } from 'express';
import { onboardingController } from '../controllers/onboarding.controller';

const router = Router();

// Public routes (no auth required) - for onboarding forms
router.get('/invitation', onboardingController.getInvitationByToken.bind(onboardingController));
router.post('/customer', onboardingController.submitCustomerOnboarding.bind(onboardingController));
router.post('/vendor', onboardingController.submitVendorOnboarding.bind(onboardingController));

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



