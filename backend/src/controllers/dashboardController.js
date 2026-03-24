const { Op, fn, col } = require('sequelize');
const { Patient, Appointment, Payment, User } = require('../models');

const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [
      totalPatients,
      newPatientsThisMonth,
      todayAppointments,
      pendingAppointments,
      monthlyRevenue,
      recentAppointments,
    ] = await Promise.all([
      Patient.count({ where: { isActive: true } }),
      Patient.count({ where: { createdAt: { [Op.gte]: startOfMonth }, isActive: true } }),
      Appointment.count({
        where: {
          scheduledAt: { [Op.between]: [startOfToday, endOfToday] },
          status: { [Op.notIn]: ['cancelled'] },
        },
      }),
      Appointment.count({ where: { status: 'scheduled' } }),
      Payment.findOne({
        where: {
          status: 'completed',
          paidAt: { [Op.gte]: startOfMonth },
        },
        attributes: [[fn('SUM', col('amount')), 'total']],
        raw: true,
      }),
      Appointment.findAll({
        where: {
          scheduledAt: { [Op.between]: [startOfToday, endOfToday] },
          status: { [Op.notIn]: ['cancelled'] },
        },
        include: [
          { model: Patient, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        ],
        order: [['scheduledAt', 'ASC']],
        limit: 5,
      }),
    ]);

    return res.json({
      stats: {
        totalPatients,
        newPatientsThisMonth,
        todayAppointments,
        pendingAppointments,
        monthlyRevenue: parseFloat(monthlyRevenue?.total || 0),
      },
      recentAppointments,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboard };
