const sequelize = require('../config/database');
const User = require('./User');
const Patient = require('./Patient');
const Appointment = require('./Appointment');
const ClinicalRecord = require('./ClinicalRecord');
const Payment = require('./Payment');

// User <-> Patient associations
User.hasMany(Appointment, { foreignKey: 'doctorId', as: 'doctorAppointments' });
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Patient.hasMany(ClinicalRecord, { foreignKey: 'patientId', as: 'clinicalRecords' });
ClinicalRecord.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(ClinicalRecord, { foreignKey: 'doctorId', as: 'doctorRecords' });
ClinicalRecord.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

Appointment.hasOne(ClinicalRecord, { foreignKey: 'appointmentId', as: 'clinicalRecord' });
ClinicalRecord.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

Patient.hasMany(Payment, { foreignKey: 'patientId', as: 'payments' });
Payment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Appointment.hasMany(Payment, { foreignKey: 'appointmentId', as: 'payments' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

module.exports = { sequelize, User, Patient, Appointment, ClinicalRecord, Payment };
