const router = require('express').Router();
const auth = require('../middleware/auth');
const {
    register,
    login,
    getMe,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');

// User Registration & Authentication
router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

// Password Recovery (Forgot Password & Reset Password)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
