const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { queryAssistant } = require('../controllers/assistantController');

router.use(authenticate, authorize('doctor'));

router.post('/query', [
  body('query').trim().notEmpty(),
], queryAssistant);

module.exports = router;
