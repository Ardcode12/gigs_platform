const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllRates, updateRate, toggleEmergency, toggleNight } = require('../controllers/rates.controller');

router.use(auth(['society']));
router.get('/', getAllRates);
router.put('/:category', updateRate);
router.patch('/emergency', toggleEmergency);
router.patch('/night-surcharge', toggleNight);

module.exports = router;
