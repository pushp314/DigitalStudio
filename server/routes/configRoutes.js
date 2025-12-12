const express = require('express');
const router = express.Router();
const { getId, updateConfig } = require('../controllers/configController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getId).put(protect, admin, updateConfig);

module.exports = router;
