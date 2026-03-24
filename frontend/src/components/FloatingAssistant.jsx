import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const quickPrompts = [
  'Que diagnosticos fueron mas frecuentes este mes?',
  'Interacciones importantes de ibuprofeno',
  'Resume patrones recientes del historial clinico',
];

const FloatingAssistant = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Asistente IA listo. Puedes consultar medicamentos, patrones clinicos o tendencias del mes.',
      chart: null,
      disclaimer: null,
    },
  ]);

  const isDoctor = user?.role === 'doctor';

  const disabledReason = useMemo(() => {
    if (!user) return 'Inicia sesion para usar el asistente.';
    if (!isDoctor) return 'Solo el rol doctor puede usar el asistente IA.';
    return '';
  }, [isDoctor, user]);

  const sendQuery = async (rawQuery) => {
    const query = String(rawQuery || '').trim();
    if (!query || loading || !isDoctor) return;

    const userMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: query,
      chart: null,
      disclaimer: null,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/assistant/query', { query });
      const assistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.answer,
        chart: data.chart || null,
        disclaimer: data.disclaimer || null,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          text: error.response?.data?.message || 'No se pudo procesar la consulta.',
          chart: null,
          disclaimer: 'Informacion general, no sustituye consulta medica profesional.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Abrir asistente IA"
      >
        <svg className="w-7 h-7 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[95vw] sm:w-[420px] max-h-[78vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Asistente Virtual IA</p>
              <p className="text-xs text-gray-500">Consultas clinicas rapidas</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-3 py-2 border-b border-gray-100 flex gap-2 overflow-x-auto">
            {quickPrompts.map((p) => (
              <button
                key={p}
                type="button"
                disabled={!isDoctor || loading}
                onClick={() => sendQuery(p)}
                className="text-xs whitespace-nowrap px-2 py-1 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-white">
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={m.role === 'user' ? 'max-w-[85%] bg-blue-600 text-white rounded-2xl rounded-br-sm px-3 py-2 text-sm' : 'max-w-[92%] bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm px-3 py-2 text-sm'}>
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {m.chart?.type === 'bar-line' && (
                    <div className="mt-3 space-y-3 bg-white border border-gray-200 rounded-lg p-2">
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={m.chart.topDiagnoses || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={55} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#2563eb" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="h-36">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={m.chart.dailyTrend || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {m.disclaimer && (
                    <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      {m.disclaimer}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-600 rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                  Procesando...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuery(input);
            }}
            className="p-3 border-t border-gray-100 bg-white"
          >
            {!isDoctor && (
              <p className="text-xs text-red-600 mb-2">{disabledReason}</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu consulta medica..."
                disabled={!isDoctor || loading}
                className="input-field flex-1"
              />
              <button
                type="submit"
                disabled={!isDoctor || loading || !input.trim()}
                className="btn-primary px-4 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default FloatingAssistant;
