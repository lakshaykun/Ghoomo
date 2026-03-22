/**
 * Drivers Module Routes
 */

import { Router } from 'express';
import * as DriverController from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', authenticate, DriverController.registerDriver);
router.get('/profile', authenticate, DriverController.getProfile);
router.put('/availability', authenticate, DriverController.updateAvailability);
router.get('/available-rides', authenticate, DriverController.getAvailableRides);

export default router;
