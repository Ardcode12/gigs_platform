const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/welfare.controller');

router.use(auth(['society']));
router.get('/enrollments', ctrl.getEnrollments);
router.post('/enroll', ctrl.enrollWorker);
router.get('/advances', ctrl.getAdvances);
router.post('/advance', ctrl.applyAdvance);
router.patch('/advance/:id/approve', ctrl.approveAdvance);
router.patch('/advance/:id/reject', ctrl.rejectAdvance);

module.exports = router;
