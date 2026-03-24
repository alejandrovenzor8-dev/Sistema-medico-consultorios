const router = require('express').Router();
const { body } = require('express-validator');
const {
  getPatients, getPatient, createPatient, updatePatient, deletePatient, getPatientHistory
} = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getPatients);
router.get('/:id', getPatient);
router.get('/:id/history', getPatientHistory);

router.post('/', [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('dateOfBirth').isDate(),
  body('gender').isIn(['male', 'female', 'other']),
  body('phone').trim().notEmpty(),
  body('email').optional().isEmail(),
], createPatient);

router.put('/:id', updatePatient);
router.delete('/:id', authorize('admin', 'doctor'), deletePatient);

module.exports = router;
