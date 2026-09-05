const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getSummary, getEarningsChart } = require('../controllers/dashboard.controller');

router.use(auth(['society']));
router.get('/', getSummary);
router.get('/summary', getSummary);
router.get('/earnings-chart', getEarningsChart);

module.exports = router;
