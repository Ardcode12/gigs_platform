const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  registerWorker, submitKycRefs, approveKyc, rejectKyc, listWorkers, getWorker,
} = require('../controllers/workers.controller');

const societyOnly = auth(['society']);

router.get('/',                               societyOnly, listWorkers);
router.post('/register',                      societyOnly, registerWorker);
router.get('/:workerId',                      societyOnly, getWorker);
router.post('/:workerId/kyc/refs',            societyOnly, submitKycRefs);
router.patch('/:workerId/kyc/approve',        societyOnly, approveKyc);
router.patch('/:workerId/kyc/reject',         societyOnly, rejectKyc);

module.exports = router;
