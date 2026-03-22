/**
 * Admin Module Routes
 */

import { Router } from 'express';
import * as AdminController from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

router.get('/dashboard', AdminController.getDashboardStats);
router.get('/users', AdminController.getAllUsers);
router.get('/rides', AdminController.getAllRides);
router.put('/users/:userId/suspend', AdminController.suspendUser);

export default router;
