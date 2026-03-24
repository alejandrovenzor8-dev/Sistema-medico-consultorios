import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

const methodMap = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', insurance: 'Seguro' };
const statusMap = {
  pending: { label: 'Pendiente', cls: 'badge-yellow' },
  completed: { label: 'Completado', cls: 'badge-green' },
  refunded: { label: 'Reembolsado', cls: 'badge-blue' },
  cancelled: { label: 'Cancelado', cls: 'badge-red' },
};

const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const Finance = () => {
  const [summary, setSummary] = useState(null);
  const [payments, setPayments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: '', amount: '', method: 'cash', description: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, payRes, repRes] = await Promise.all([
        api.get('/payments/summary'),
        api.get('/payments', { params: { page, limit: 15 } }),
        api.get('/payments/report/monthly'),
      ]);
      setSummary(sumRes.data);
      setPayments(payRes.data.payments);
      setTotal(payRes.data.total);

      const report = repRes.data.report || [];
      // Build a lookup map keyed by month index for O(1) access
      const reportByMonth = {};
      report.forEach((r) => {
        reportByMonth[new Date(r.month).getMonth()] = r;
      });
      const data = monthNames.map((name, idx) => {
        const found = reportByMonth[idx];
        return { name, total: found ? parseFloat(found.total) : 0 };
      });
      setChartData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    api.get('/patients', { params: { limit: 200 } })
      .then((res) => setPatients(res.data.patients || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/payments', form);
      setShowForm(false);
      setForm({ patientId: '', amount: '', method: 'cash', description: '', notes: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar pago');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Ingresos del Mes</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${(summary?.monthlyRevenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-gray-500">Ingresos del Año</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            ${(summary?.yearlyRevenue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card flex items-center justify-end">
          <button onClick={() => { setShowForm(true); setError(''); }} className="btn-primary">
            + Registrar Pago
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Ingresos Mensuales ({new Date().getFullYear()})</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString('es-MX')}`, 'Ingresos']} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payments table */}
      <div className="card overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Historial de Pagos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Fecha', 'Paciente', 'Concepto', 'Método', 'Monto', 'Estado', 'Folio'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No hay pagos registrados</td></tr>
              ) : payments.map((p) => {
                const st = statusMap[p.status] || { label: p.status, cls: 'badge-gray' };
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {format(new Date(p.paidAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {p.patient?.firstName} {p.patient?.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{p.description || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{methodMap[p.method] || p.method}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      ${parseFloat(p.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3"><span className={st.cls}>{st.label}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{p.invoiceNumber}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">Anterior</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {/* Create payment modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Registrar Pago</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto (MXN) *</label>
                <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago *</label>
                <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="input-field">
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                  <option value="transfer">Transferencia</option>
                  <option value="insurance">Seguro médico</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="Consulta general, procedimiento..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Guardando...' : 'Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
