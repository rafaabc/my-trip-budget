const { Router } = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const tripController = require('../controllers/trip.controller');

const router = Router();

router.use(authMiddleware);

router.post('/', tripController.createTrip);
router.get('/', tripController.listTrips);

module.exports = router;
