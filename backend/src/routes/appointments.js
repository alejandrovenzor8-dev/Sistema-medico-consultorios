const router = require('express').Router();
const { body } = require('express-validator');
const {
  getAppointments, getAppointment, createAppointment, updateAppointment, cancelAppointment, getTodayAppointments
} = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getAppointments);
router.get('/today', getTodayAppointments);
router.get('/:id', getAppointment);

router.post('/', [
  body('patientId').isUUID(),
  body('doctorId').isUUID(),
  body('scheduledAt').isISO8601(),
], createAppointment);

router.put('/:id', updateAppointment);
router.patch('/:id/cancel', cancelAppointment);

module.exports = router;
