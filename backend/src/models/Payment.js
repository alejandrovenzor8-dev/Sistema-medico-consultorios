const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  method: {
    type: DataTypes.ENUM('cash', 'card', 'transfer', 'insurance'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'refunded', 'cancelled'),
    defaultValue: 'completed',
  },
  description: {
    type: DataTypes.STRING,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  notes: {
    type: DataTypes.TEXT,
  },
});

module.exports = Payment;
