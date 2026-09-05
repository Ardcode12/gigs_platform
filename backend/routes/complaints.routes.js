const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/complaints.controller');

router.use(auth(['society']));
router.get('/', ctrl.getAllComplaints);
router.get('/:id', ctrl.getComplaintById);
router.post('/:id/respond', ctrl.addResponse);
router.patch('/:id/resolve', ctrl.resolve);
router.post('/:id/escalate', ctrl.escalate);

module.exports = router;
