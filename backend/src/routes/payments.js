const router = require('express').Router();
const { body } = require('express-validator');
const {
  getPayments, createPayment, updatePayment, getFinanceSummary, getMonthlyReport
} = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getPayments);
router.get('/summary', getFinanceSummary);
router.get('/report/monthly', getMonthlyReport);

router.post('/', authorize('admin', 'doctor', 'receptionist'), [
  body('patientId').isUUID(),
  body('amount').isDecimal(),
  body('method').isIn(['cash', 'card', 'transfer', 'insurance']),
], createPayment);

router.put('/:id', authorize('admin'), updatePayment);

module.exports = router;
