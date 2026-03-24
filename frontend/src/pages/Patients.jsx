import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const genderMap = { male: 'Masculino', female: 'Femenino', other: 'Otro' };

const initialForm = {
  firstName: '', lastName: '', dateOfBirth: '', gender: 'male',
  phone: '', email: '', address: '', bloodType: '', allergies: '',
  emergencyContactName: '', emergencyContactPhone: '', notes: '',
};

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients', { params: { search, page, limit: 15 } });
      setPatients(res.data.patients);
      setTotal(res.data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const openCreate = () => {
    setEditId(null);
    setForm(initialForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (patient) => {
    setEditId(patient.id);
    setForm({
      firstName: patient.firstName || '',
      lastName: patient.lastName || '',
      dateOfBirth: patient.dateOfBirth || '',
      gender: patient.gender || 'male',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      bloodType: patient.bloodType || '',
      allergies: patient.allergies || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      notes: patient.notes || '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/patients/${editId}`, form);
      } else {
        await api.post('/patients', form);
      }
      setShowForm(false);
      fetchPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('¿Desactivar este paciente?')) return;
    try {
      await api.delete(`/patients/${id}`);
      fetchPatients();
    } catch (e) {
      console.error(e);
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{total} pacientes registrados</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field flex-1 sm:w-64"
          />
          <button onClick={openCreate} className="btn-primary whitespace-nowrap">
            + Nuevo Paciente
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Paciente', 'Teléfono', 'Correo', 'Sexo', 'Tipo Sangre', 'Acciones'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Cargando...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No hay pacientes</td></tr>
              ) : patients.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(p)} className="text-left">
                      <p className="text-sm font-medium text-gray-900 hover:text-blue-600">
                        {p.firstName} {p.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{p.dateOfBirth}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{genderMap[p.gender] || p.gender}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.bloodType || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        Editar
                      </button>
                      <button onClick={() => handleDeactivate(p.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                        Desactivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">
                Anterior
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm py-1 px-3 disabled:opacity-40">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patient detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {selected.firstName} {selected.lastName}
              </h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Fecha de Nacimiento', selected.dateOfBirth],
                ['Sexo', genderMap[selected.gender]],
                ['Teléfono', selected.phone],
                ['Correo', selected.email || '—'],
                ['Tipo de Sangre', selected.bloodType || '—'],
                ['Alergias', selected.allergies || '—'],
                ['Contacto de Emergencia', selected.emergencyContactName || '—'],
                ['Tel. Emergencia', selected.emergencyContactPhone || '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
              {selected.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 font-medium">Notas</p>
                  <p className="text-gray-800 mt-0.5">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">
                {editId ? 'Editar Paciente' : 'Nuevo Paciente'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'firstName', label: 'Nombre *', type: 'text', required: true },
                { name: 'lastName', label: 'Apellido *', type: 'text', required: true },
                { name: 'dateOfBirth', label: 'Fecha de Nacimiento *', type: 'date', required: true },
                { name: 'phone', label: 'Teléfono *', type: 'tel', required: true },
                { name: 'email', label: 'Correo electrónico', type: 'email', required: false },
                { name: 'emergencyContactName', label: 'Contacto de Emergencia', type: 'text', required: false },
                { name: 'emergencyContactPhone', label: 'Tel. Emergencia', type: 'tel', required: false },
                { name: 'insuranceProvider', label: 'Aseguradora', type: 'text', required: false },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    required={f.required}
                    value={form[f.name] || ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="input-field"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sexo *</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field" required>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Sangre</label>
                <select value={form.bloodType || ''} onChange={(e) => setForm({ ...form, bloodType: e.target.value })} className="input-field">
                  <option value="">Desconocido</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <input type="text" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
                <textarea value={form.allergies || ''} onChange={(e) => setForm({ ...form, allergies: e.target.value })} className="input-field" rows={2} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
              </div>

              <div className="sm:col-span-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
