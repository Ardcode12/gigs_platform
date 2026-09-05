const express = require('express');
const router = express.Router();
const { findNearestSociety, findNearestWorker, requestService, getSubcategories } = require('../controllers/gps.controller');

// Public endpoints (no auth needed for customer service requests)
router.post('/nearest-society',  findNearestSociety);
router.post('/nearest-worker',   findNearestWorker);
router.post('/request',          requestService);
router.get('/subcategories/:category', getSubcategories);
router.get('/subcategories',     (req, res, next) => {
  req.params.category = 'all';
  getSubcategories(req, res, next);
});

module.exports = router;
