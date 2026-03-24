const router = require('express').Router();
const { body } = require('express-validator');
const { getRecords, getRecord, createRecord, updateRecord } = require('../controllers/clinicalController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getRecords);
router.get('/:id', getRecord);

router.post('/', authorize('admin', 'doctor'), [
  body('patientId').isUUID(),
  body('visitDate').optional().isISO8601(),
], createRecord);

router.put('/:id', authorize('admin', 'doctor'), updateRecord);

module.exports = router;
