const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getInventoryPredictions } = require('../controllers/inventoryController');

router.get('/predictions', protect, admin, getInventoryPredictions);

module.exports = router;
