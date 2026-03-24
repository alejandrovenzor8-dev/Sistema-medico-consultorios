import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ClinicalHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    patientId: '', chiefComplaint: '', diagnosis: '', treatment: '',
    prescription: '', labResults: '', followUpDate: '', notes: '',
    vitalSigns: { weight: '', height: '', blood_pressure: '', temperature: '', heart_rate: '' },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/clinical');
      setRecords(res.data.records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

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
      await api.post('/clinical', form);
      setShowForm(false);
      fetchRecords();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const updateVital = (key, val) => {
    setForm({ ...form, vitalSigns: { ...form.vitalSigns, [key]: val } });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{records.length} registros clínicos</p>
        {['admin', 'doctor'].includes(user?.role) && (
          <button onClick={() => { setShowForm(true); setError(''); }} className="btn-primary">
            + Nuevo Registro
          </button>
        )}
      </div>

      {/* Records table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Paciente', 'Fecha', 'Motivo', 'Diagnóstico', 'Doctor', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No hay registros clínicos</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {r.patient?.firstName} {r.patient?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {format(new Date(r.visitDate), 'dd/MM/yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{r.chiefComplaint || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{r.diagnosis || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.doctor?.name}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(r)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Registro Clínico</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Paciente</p>
                  <p className="text-gray-800">{selected.patient?.firstName} {selected.patient?.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Fecha de consulta</p>
                  <p className="text-gray-800">{format(new Date(selected.visitDate), "dd 'de' MMMM yyyy", { locale: es })}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Doctor</p>
                  <p className="text-gray-800">{selected.doctor?.name}</p>
                </div>
                {selected.followUpDate && (
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Próxima cita</p>
                    <p className="text-gray-800">{selected.followUpDate}</p>
                  </div>
                )}
              </div>

              {selected.vitalSigns && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Signos Vitales</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selected.vitalSigns).filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} className="bg-gray-50 rounded-lg p-2 text-xs">
                        <p className="text-gray-500 capitalize">{k.replace('_', ' ')}</p>
                        <p className="font-semibold text-gray-800">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {[
                ['Motivo de consulta', selected.chiefComplaint],
                ['Diagnóstico', selected.diagnosis],
                ['Tratamiento', selected.treatment],
                ['Prescripción', selected.prescription],
                ['Resultados de laboratorio', selected.labResults],
                ['Notas', selected.notes],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Nuevo Registro Clínico</h3>
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

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Signos Vitales</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'weight', label: 'Peso (kg)' },
                    { key: 'height', label: 'Talla (cm)' },
                    { key: 'blood_pressure', label: 'Presión arterial' },
                    { key: 'temperature', label: 'Temperatura (°C)' },
                    { key: 'heart_rate', label: 'Frec. cardíaca' },
                  ].map((v) => (
                    <div key={v.key}>
                      <label className="block text-xs text-gray-500 mb-1">{v.label}</label>
                      <input type="text" value={form.vitalSigns[v.key]} onChange={(e) => updateVital(v.key, e.target.value)} className="input-field text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              {[
                { name: 'chiefComplaint', label: 'Motivo de consulta' },
                { name: 'diagnosis', label: 'Diagnóstico' },
                { name: 'treatment', label: 'Tratamiento' },
                { name: 'prescription', label: 'Prescripción / Receta' },
                { name: 'labResults', label: 'Resultados de laboratorio' },
                { name: 'notes', label: 'Notas adicionales' },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <textarea value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} className="input-field" rows={2} />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha próxima cita</label>
                <input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} className="input-field" />
              </div>

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Guardando...' : 'Guardar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalHistory;
