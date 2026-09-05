const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookings.controller');
const auth = require('../middleware/auth');

router.use(auth(['society']));

router.get('/incoming', ctrl.getIncoming);
router.get('/', ctrl.getAllBookings);
router.get('/:id', ctrl.getBookingById);
router.post('/:id/assign', ctrl.assignWorker);
router.post('/:id/assign-bulk', ctrl.assignBulkTeam);
router.patch('/:id/status', ctrl.updateStatus);

module.exports = router;
