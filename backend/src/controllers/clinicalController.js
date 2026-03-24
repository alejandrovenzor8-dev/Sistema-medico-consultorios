const { validationResult } = require('express-validator');
const { ClinicalRecord, Patient, User, Appointment } = require('../models');

const getRecords = async (req, res) => {
  try {
    const { patientId } = req.query;
    const where = {};
    if (patientId) where.patientId = patientId;

    const records = await ClinicalRecord.findAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
      ],
      order: [['visitDate', 'DESC']],
    });

    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getRecord = async (req, res) => {
  try {
    const record = await ClinicalRecord.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
        { model: Appointment, as: 'appointment' },
      ],
    });

    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createRecord = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const record = await ClinicalRecord.create({
      ...req.body,
      doctorId: req.user.id,
    });
    return res.status(201).json({ message: 'Record created', record });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const record = await ClinicalRecord.findByPk(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    await record.update(req.body);
    return res.json({ message: 'Record updated', record });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getRecords, getRecord, createRecord, updateRecord };
