const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssistantQueryLog = sequelize.define('AssistantQueryLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  queryText: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  intent: {
    type: DataTypes.ENUM('medication', 'history', 'insights', 'general'),
    allowNull: false,
    defaultValue: 'general',
  },
  anonymizedPayload: {
    type: DataTypes.JSON,
  },
  responseSummary: {
    type: DataTypes.TEXT,
  },
});

module.exports = AssistantQueryLog;
