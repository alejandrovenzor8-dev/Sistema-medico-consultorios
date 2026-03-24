import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';

const StatCard = ({ title, value, subtitle, color, icon }) => (
  <div className="card">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

const statusLabels = {
  scheduled: { label: 'Programada', cls: 'badge-blue' },
  confirmed: { label: 'Confirmada', cls: 'badge-green' },
  in_progress: { label: 'En curso', cls: 'badge-yellow' },
  completed: { label: 'Completada', cls: 'badge-green' },
  cancelled: { label: 'Cancelada', cls: 'badge-red' },
  no_show: { label: 'No asistió', cls: 'badge-gray' },
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const stats = data?.stats || {};
  const appointments = data?.recentAppointments || [];

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Pacientes"
          value={stats.totalPatients ?? '—'}
          subtitle={`+${stats.newPatientsThisMonth ?? 0} este mes`}
          color="text-blue-600"
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <StatCard
          title="Citas Hoy"
          value={stats.todayAppointments ?? '—'}
          subtitle="Programadas"
          color="text-green-600"
          icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        />
        <StatCard
          title="Citas Pendientes"
          value={stats.pendingAppointments ?? '—'}
          subtitle="Sin confirmar"
          color="text-yellow-600"
          icon={<svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Ingresos del Mes"
          value={`$${(stats.monthlyRevenue ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          subtitle="MXN"
          color="text-purple-600"
          icon={<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      {/* Today's appointments */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Citas de Hoy</h2>
          <Link to="/appointments" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todas →
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No hay citas programadas para hoy</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => {
              const st = statusLabels[appt.status] || { label: appt.status, cls: 'badge-gray' };
              return (
                <div key={appt.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center min-w-[52px]">
                    <p className="text-sm font-semibold text-gray-800">
                      {format(new Date(appt.scheduledAt), 'HH:mm')}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      {appt.patient?.firstName} {appt.patient?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{appt.type}</p>
                  </div>
                  <span className={st.cls}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/patients', label: 'Nuevo Paciente', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
            { to: '/appointments', label: 'Nueva Cita', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
            { to: '/clinical', label: 'Historial Clínico', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
            { to: '/finance', label: 'Registrar Pago', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
          ].map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`p-4 rounded-xl text-sm font-medium text-center transition-colors ${action.color}`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
