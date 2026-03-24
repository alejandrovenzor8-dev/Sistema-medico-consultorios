const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Patient, Appointment, ClinicalRecord, Payment } = require('../models');

const getPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { isActive: true };
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Patient.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });

    return res.json({
      patients: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [
        { model: Appointment, as: 'appointments', limit: 5, order: [['scheduledAt', 'DESC']] },
        { model: Payment, as: 'payments', limit: 5, order: [['paidAt', 'DESC']] },
      ],
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    return res.json({ patient });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createPatient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const patient = await Patient.create(req.body);
    return res.status(201).json({ message: 'Patient created', patient });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await patient.update(req.body);
    return res.json({ message: 'Patient updated', patient });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    await patient.update({ isActive: false });
    return res.json({ message: 'Patient deactivated' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPatientHistory = async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const records = await ClinicalRecord.findAll({
      where: { patientId: req.params.id },
      order: [['visitDate', 'DESC']],
    });

    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getPatients, getPatient, createPatient, updatePatient, deletePatient, getPatientHistory };
