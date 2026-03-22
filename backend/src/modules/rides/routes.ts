/**
 * Rides Module Routes
 */

import { Router } from 'express';
import * as RideController from './controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/', authenticate, RideController.createRide);
router.get('/:rideId', authenticate, RideController.getRide);
router.delete('/:rideId', authenticate, RideController.cancelRide);
router.post('/:rideId/rate', authenticate, RideController.rateRide);

export default router;
