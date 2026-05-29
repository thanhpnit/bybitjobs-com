const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAdmin } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/admin/users', verifyAdmin, authController.getAllUsers);

module.exports = router;