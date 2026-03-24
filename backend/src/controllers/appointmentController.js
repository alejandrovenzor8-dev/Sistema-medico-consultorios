const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const { Appointment, Patient, User } = require('../models');

const getAppointments = async (req, res) => {
  try {
    const { start, end, doctorId, status } = req.query;

    const where = {};
    if (start && end) {
      where.scheduledAt = { [Op.between]: [new Date(start), new Date(end)] };
    }
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
      ],
      order: [['scheduledAt', 'ASC']],
    });

    return res.json({ appointments });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        { model: Patient, as: 'patient' },
        { model: User, as: 'doctor', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    return res.json({ appointment });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createAppointment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const appointment = await Appointment.create(req.body);
    const full = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
      ],
    });
    return res.status(201).json({ message: 'Appointment created', appointment: full });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await appointment.update(req.body);
    return res.json({ message: 'Appointment updated', appointment });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await appointment.update({ status: 'cancelled' });
    return res.json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTodayAppointments = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appointments = await Appointment.findAll({
      where: {
        scheduledAt: { [Op.between]: [start, end] },
        status: { [Op.notIn]: ['cancelled'] },
      },
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName', 'phone'] },
        { model: User, as: 'doctor', attributes: ['id', 'name'] },
      ],
      order: [['scheduledAt', 'ASC']],
    });

    return res.json({ appointments });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getAppointments, getAppointment, createAppointment, updateAppointment, cancelAppointment, getTodayAppointments };
