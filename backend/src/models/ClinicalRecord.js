const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClinicalRecord = sequelize.define('ClinicalRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  appointmentId: {
    type: DataTypes.UUID,
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  visitDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  chiefComplaint: {
    type: DataTypes.TEXT,
  },
  diagnosis: {
    type: DataTypes.TEXT,
  },
  treatment: {
    type: DataTypes.TEXT,
  },
  prescription: {
    type: DataTypes.TEXT,
  },
  vitalSigns: {
    type: DataTypes.JSON,
    comment: 'weight, height, blood_pressure, temperature, heart_rate',
  },
  labResults: {
    type: DataTypes.TEXT,
  },
  followUpDate: {
    type: DataTypes.DATEONLY,
  },
  notes: {
    type: DataTypes.TEXT,
  },
});

module.exports = ClinicalRecord;
