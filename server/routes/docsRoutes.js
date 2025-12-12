const express = require('express');
const router = express.Router();
const {
    getDocs,
    getDocById,
    createDoc,
    updateDoc,
    deleteDoc
} = require('../controllers/docsController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getDocs);
router.get('/:id', getDocById);

// Admin routes (protected)
router.post('/', protect, admin, createDoc);
router.put('/:id', protect, admin, updateDoc);
router.delete('/:id', protect, admin, deleteDoc);

module.exports = router;
