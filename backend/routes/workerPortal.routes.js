const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getWorkerDashboard, acceptJob, rejectJob,
  updateJobStatus, toggleAvailability, changePassword,
} = require('../controllers/workerAuth.controller');

const workerOnly = auth(['worker']);

router.get('/dashboard',              workerOnly, getWorkerDashboard);
router.patch('/jobs/:jobId/accept',   workerOnly, acceptJob);
router.patch('/jobs/:jobId/reject',   workerOnly, rejectJob);
router.patch('/jobs/:jobId/status',   workerOnly, updateJobStatus);
router.patch('/availability',         workerOnly, toggleAvailability);
router.post('/change-password',       workerOnly, changePassword);

module.exports = router;
