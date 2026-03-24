import React, { useEffect, useState, useCallback } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';

const statusMap = {
  scheduled: { label: 'Programada', cls: 'badge-blue' },
  confirmed: { label: 'Confirmada', cls: 'badge-green' },
  in_progress: { label: 'En curso', cls: 'badge-yellow' },
  completed: { label: 'Completada', cls: 'badge-green' },
  cancelled: { label: 'Cancelada', cls: 'badge-red' },
  no_show: { label: 'No asistió', cls: 'badge-gray' },
};

const typeMap = {
  consultation: 'Consulta',
  follow_up: 'Seguimiento',
  emergency: 'Urgencia',
  procedure: 'Procedimiento',
};

const Appointments = () => {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: '', doctorId: '', scheduledAt: '', duration: 30, type: 'consultation', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments', {
        params: { start: weekStart.toISOString(), end: weekEnd.toISOString() },
      });
      setAppointments(res.data.appointments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    Promise.all([
      api.get('/patients', { params: { limit: 200 } }),
    ]).then(([pRes]) => {
      setPatients(pRes.data.patients || []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/appointments', form);
      setShowForm(false);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear cita');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Cancelar esta cita?')) return;
    try {
      await api.patch(`/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      fetchAppointments();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekStart(subWeeks(weekStart, 1))} className="btn-secondary p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700">
            {format(weekStart, 'd MMM', { locale: es })} – {format(weekEnd, 'd MMM yyyy', { locale: es })}
          </span>
          <button onClick={() => setWeekStart(addWeeks(weekStart, 1))} className="btn-secondary p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="btn-secondary text-sm">
            Hoy
          </button>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); }} className="btn-primary">
          + Nueva Cita
        </button>
      </div>

      {/* Weekly calendar */}
      <div className="card overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {days.map((day) => (
            <div key={day.toISOString()} className={`p-3 text-center border-r border-gray-100 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-50' : ''}`}>
              <p className="text-xs text-gray-500 font-medium">
                {format(day, 'EEE', { locale: es }).toUpperCase()}
              </p>
              <p className={`text-lg font-semibold mt-0.5 ${isSameDay(day, new Date()) ? 'text-blue-600' : 'text-gray-800'}`}>
                {format(day, 'd')}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[300px]">
          {days.map((day) => {
            const dayAppts = appointments.filter((a) => isSameDay(new Date(a.scheduledAt), day));
            return (
              <div key={day.toISOString()} className={`p-2 border-r border-gray-100 last:border-r-0 ${isSameDay(day, new Date()) ? 'bg-blue-50/30' : ''}`}>
                <div className="space-y-1">
                  {dayAppts.map((appt) => {
                    const st = statusMap[appt.status] || { label: appt.status, cls: 'badge-gray' };
                    return (
                      <div key={appt.id} className="bg-white border border-gray-200 rounded-lg p-2 text-xs shadow-sm">
                        <p className="font-semibold text-gray-700">{format(new Date(appt.scheduledAt), 'HH:mm')}</p>
                        <p className="text-gray-600 truncate">{appt.patient?.firstName} {appt.patient?.lastName}</p>
                        <span className={`${st.cls} mt-1`}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* List view */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Lista de Citas de la Semana</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Fecha / Hora', 'Paciente', 'Tipo', 'Duración', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No hay citas esta semana</td></tr>
              ) : appointments.map((appt) => {
                const st = statusMap[appt.status] || { label: appt.status, cls: 'badge-gray' };
                return (
                  <tr key={appt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {format(new Date(appt.scheduledAt), 'EEE dd/MM HH:mm', { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {appt.patient?.firstName} {appt.patient?.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{typeMap[appt.type] || appt.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{appt.duration} min</td>
                    <td className="px-4 py-3"><span className={st.cls}>{st.label}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {appt.status === 'scheduled' && (
                          <button onClick={() => handleStatusChange(appt.id, 'confirmed')} className="text-xs text-green-600 hover:text-green-800 font-medium">
                            Confirmar
                          </button>
                        )}
                        {['scheduled', 'confirmed'].includes(appt.status) && (
                          <button onClick={() => handleCancel(appt.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create appointment modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Nueva Cita</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                <select required value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} className="input-field">
                  <option value="">Seleccionar paciente</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora *</label>
                <input type="datetime-local" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                    <option value="consultation">Consulta</option>
                    <option value="follow_up">Seguimiento</option>
                    <option value="emergency">Urgencia</option>
                    <option value="procedure">Procedimiento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                  <input type="number" min="15" max="180" step="15" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })} className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="input-field" rows={3} />
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Guardando...' : 'Crear Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
