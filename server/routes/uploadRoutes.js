const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');

router.post('/', upload.single('file'), (req, res) => {
    res.send(`/${req.file.path}`);
});

module.exports = router;
