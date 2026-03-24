const { Op, fn, col, literal } = require('sequelize');
const { validationResult } = require('express-validator');
const { Payment, Patient, Appointment } = require('../models');

const getPayments = async (req, res) => {
  try {
    const { patientId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (startDate && endDate) {
      where.paidAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['paidAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return res.json({
      payments: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createPayment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const invoiceNumber = `INV-${Date.now()}`;
    const payment = await Payment.create({ ...req.body, invoiceNumber });
    return res.status(201).json({ message: 'Payment recorded', payment });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await payment.update(req.body);
    return res.json({ message: 'Payment updated', payment });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getFinanceSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    const [monthlyRevenue, yearlyRevenue, recentPayments] = await Promise.all([
      Payment.findOne({
        where: {
          status: 'completed',
          paidAt: { [Op.between]: [startOfMonth, endOfMonth] },
        },
        attributes: [[fn('SUM', col('amount')), 'total']],
        raw: true,
      }),
      Payment.findOne({
        where: {
          status: 'completed',
          paidAt: { [Op.between]: [startOfYear, endOfYear] },
        },
        attributes: [[fn('SUM', col('amount')), 'total']],
        raw: true,
      }),
      Payment.findAll({
        where: { status: 'completed' },
        include: [{ model: Patient, as: 'patient', attributes: ['firstName', 'lastName'] }],
        order: [['paidAt', 'DESC']],
        limit: 10,
      }),
    ]);

    return res.json({
      monthlyRevenue: parseFloat(monthlyRevenue?.total || 0),
      yearlyRevenue: parseFloat(yearlyRevenue?.total || 0),
      recentPayments,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMonthlyReport = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const results = await Payment.findAll({
      where: {
        status: 'completed',
        paidAt: {
          [Op.between]: [
            new Date(`${year}-01-01`),
            new Date(`${year}-12-31T23:59:59`),
          ],
        },
      },
      attributes: [
        [fn('DATE_TRUNC', 'month', col('paidAt')), 'month'],
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [literal("DATE_TRUNC('month', \"paidAt\")")],
      order: [[literal("DATE_TRUNC('month', \"paidAt\")"), 'ASC']],
      raw: true,
    });

    return res.json({ report: results });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getPayments, createPayment, updatePayment, getFinanceSummary, getMonthlyReport };
