const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/payments.controller');

router.use(auth(['society']));

router.get('/summary', ctrl.getSummary);
router.get('/reconciliation', ctrl.getReconciliation);
router.get('/', ctrl.getAllPayments);
router.post('/cash', ctrl.recordCash);
router.post('/:id/split', ctrl.initiateSplit);
router.patch('/:id/confirm-split', ctrl.confirmSplit);

module.exports = router;
