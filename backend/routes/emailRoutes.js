const router = require('express').Router();
const { sendTestEmail } = require('../controllers/emailController');

// Development test email endpoint
// POST /test-email (or POST /api/test-email)
router.post('/test-email', sendTestEmail);

module.exports = router;
