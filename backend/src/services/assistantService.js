const crypto = require('crypto');
const { Op } = require('sequelize');
const { Patient, ClinicalRecord } = require('../models');

class AssistantService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    this.azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.azureApiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
    this.azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    this.provider = (process.env.IA_PROVIDER || 'openai').toLowerCase();
  }

  detectIntent(query) {
    const text = String(query || '').toLowerCase();
    if (/medic|farmac|contraind|interacci|dosis|ibuprofeno|paracetamol|amoxicilina/.test(text)) {
      return 'medication';
    }
    if (/diagnost|frecuent|tendenc|mes|grafi|patron|insight/.test(text)) {
      return 'insights';
    }
    if (/historial|paciente|consulta|clinic|record|expediente/.test(text)) {
      return 'history';
    }
    return 'general';
  }

  async handleQuery({ query, user }) {
    const intent = this.detectIntent(query);

    if (intent === 'medication') {
      return this.handleMedicationQuery(query, intent, user);
    }

    if (intent === 'insights') {
      return this.handleInsightsQuery(query, intent, user);
    }

    if (intent === 'history') {
      return this.handleHistoryQuery(query, intent, user);
    }

    return this.handleGeneralQuery(query, intent, user);
  }

  async handleMedicationQuery(query, intent, user) {
    const medication = this.extractMedicationName(query);
    const fdaData = await this.fetchOpenFDALabel(medication);

    const summaryPrompt = [
      `Consulta de medicamento: ${medication}`,
      `Datos fuente OpenFDA: ${JSON.stringify(fdaData)}`,
      'Genera resumen breve para medico: usos, interacciones y contraindicaciones generales.',
      'No incluyas recomendaciones personalizadas de dosis.',
    ].join('\n');

    const answer = await this.generateText(summaryPrompt, this.fallbackMedicationSummary(medication, fdaData));

    return {
      intent,
      answer,
      medication,
      sources: ['OpenFDA drug labels'],
      chart: null,
      anonymizedPayload: {
        qHash: this.hash(query),
        medication,
      },
      responseSummary: answer.slice(0, 220),
    };
  }

  async handleHistoryQuery(query, intent, user) {
    const records = await ClinicalRecord.findAll({
      include: [{ model: Patient, as: 'patient', attributes: ['id', 'gender', 'dateOfBirth'] }],
      attributes: ['id', 'visitDate', 'diagnosis', 'chiefComplaint', 'vitalSigns'],
      order: [['visitDate', 'DESC']],
      limit: 80,
    });

    const anonymized = records.map((r) => ({
      anonPatientId: this.hash(r.patient?.id || 'unknown'),
      age: this.calculateAge(r.patient?.dateOfBirth),
      gender: r.patient?.gender || null,
      visitDate: r.visitDate,
      diagnosis: r.diagnosis,
      chiefComplaint: r.chiefComplaint,
      vitalSigns: r.vitalSigns || {},
    }));

    const prompt = [
      `Pregunta del medico: ${query}`,
      'Analiza solo estos datos anonimizados y resume patrones clinicos generales.',
      'No des diagnostico definitivo ni tratamiento personalizado.',
      JSON.stringify(anonymized),
    ].join('\n');

    const fallback = this.localHistorySummary(anonymized);
    const answer = await this.generateText(prompt, fallback);

    return {
      intent,
      answer,
      chart: null,
      anonymizedPayload: {
        qHash: this.hash(query),
        records: anonymized.length,
      },
      responseSummary: answer.slice(0, 220),
    };
  }

  async handleInsightsQuery(query, intent, user) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const records = await ClinicalRecord.findAll({
      where: {
        visitDate: { [Op.gte]: startOfMonth },
      },
      attributes: ['visitDate', 'diagnosis'],
      order: [['visitDate', 'ASC']],
    });

    const diagnosisMap = new Map();
    const dayMap = new Map();

    for (const r of records) {
      const diagnosis = (r.diagnosis || 'sin diagnostico').trim().toLowerCase();
      diagnosisMap.set(diagnosis, (diagnosisMap.get(diagnosis) || 0) + 1);

      const d = new Date(r.visitDate).toISOString().slice(0, 10);
      dayMap.set(d, (dayMap.get(d) || 0) + 1);
    }

    const topDiagnoses = Array.from(diagnosisMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, count]) => ({ name, count }));

    const dailyTrend = Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count }));

    const prompt = [
      `Pregunta del medico: ${query}`,
      'Con base en estos conteos del mes, redacta insight breve y accionable.',
      JSON.stringify({ topDiagnoses, dailyTrend }),
    ].join('\n');

    const fallback = topDiagnoses.length
      ? `Diagnosticos mas frecuentes del mes: ${topDiagnoses.slice(0, 3).map((x) => `${x.name} (${x.count})`).join(', ')}.`
      : 'No hay suficientes datos del mes para calcular tendencias.';

    const answer = await this.generateText(prompt, fallback);

    return {
      intent,
      answer,
      chart: {
        type: 'bar-line',
        topDiagnoses,
        dailyTrend,
      },
      anonymizedPayload: {
        qHash: this.hash(query),
        records: records.length,
      },
      responseSummary: answer.slice(0, 220),
    };
  }

  async handleGeneralQuery(query, intent, user) {
    const fallback = 'Puedo ayudarte con consultas sobre medicamentos, historiales anonimizados e insights de diagnosticos del mes.';
    const answer = await this.generateText(`Consulta medica general: ${query}`, fallback);

    return {
      intent,
      answer,
      chart: null,
      anonymizedPayload: {
        qHash: this.hash(query),
      },
      responseSummary: answer.slice(0, 220),
    };
  }

  async fetchOpenFDALabel(medication) {
    try {
      const q = encodeURIComponent(`openfda.generic_name:"${medication}"+openfda.brand_name:"${medication}"`);
      const url = `https://api.fda.gov/drug/label.json?search=${q}&limit=1`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const result = data?.results?.[0];
      if (!result) return null;

      return {
        genericName: result?.openfda?.generic_name?.[0] || medication,
        brandName: result?.openfda?.brand_name?.[0] || null,
        indications: this.pickFirst(result?.indications_and_usage),
        contraindications: this.pickFirst(result?.contraindications),
        interactions: this.pickFirst(result?.drug_interactions),
        warnings: this.pickFirst(result?.warnings),
      };
    } catch (error) {
      return null;
    }
  }

  async generateText(prompt, fallbackText) {
    if (this.provider === 'azure' && this.azureApiKey && this.azureEndpoint && this.azureDeployment) {
      try {
        const endpoint = `${this.azureEndpoint}/openai/deployments/${this.azureDeployment}/chat/completions?api-version=${this.azureApiVersion}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.azureApiKey,
          },
          body: JSON.stringify({
            temperature: 0.2,
            messages: [
              { role: 'system', content: 'Asistente medico: respuesta breve, clara y prudente.' },
              { role: 'user', content: prompt },
            ],
          }),
        });
        if (!res.ok) return fallbackText;
        const data = await res.json();
        return data?.choices?.[0]?.message?.content || fallbackText;
      } catch (error) {
        return fallbackText;
      }
    }

    if (this.openaiApiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: this.openaiModel,
            temperature: 0.2,
            messages: [
              { role: 'system', content: 'Asistente medico: respuesta breve, clara y prudente.' },
              { role: 'user', content: prompt },
            ],
          }),
        });
        if (!res.ok) return fallbackText;
        const data = await res.json();
        return data?.choices?.[0]?.message?.content || fallbackText;
      } catch (error) {
        return fallbackText;
      }
    }

    return fallbackText;
  }

  extractMedicationName(query) {
    const cleaned = String(query || '').toLowerCase();
    const candidates = ['ibuprofeno', 'paracetamol', 'amoxicilina', 'metformina', 'losartan'];
    const found = candidates.find((x) => cleaned.includes(x));
    if (found) return found;

    const words = cleaned.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    return words[words.length - 1] || 'medicamento';
  }

  localHistorySummary(anonymized) {
    if (!anonymized.length) {
      return 'No hay registros clinicos suficientes para analizar patrones.';
    }

    const top = new Map();
    for (const r of anonymized) {
      const d = (r.diagnosis || 'sin diagnostico').trim().toLowerCase();
      top.set(d, (top.get(d) || 0) + 1);
    }

    const topItems = Array.from(top.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return `Patrones observados en historial anonimizado: ${topItems.map(([name, count]) => `${name} (${count})`).join(', ')}.`;
  }

  fallbackMedicationSummary(medication, fdaData) {
    if (!fdaData) {
      return `No se encontro ficha publica en OpenFDA para ${medication}. Revisa guias clinicas y farmacologia institucional.`;
    }
    return `Resumen de ${medication}: indicaciones ${fdaData.indications || 'N/D'}. Interacciones ${fdaData.interactions || 'N/D'}. Contraindicaciones ${fdaData.contraindications || 'N/D'}.`;
  }

  pickFirst(value) {
    if (!value) return null;
    if (Array.isArray(value)) return String(value[0]).slice(0, 500);
    return String(value).slice(0, 500);
  }

  calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;
    const birth = new Date(dateOfBirth);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  }

  hash(input) {
    return crypto.createHash('sha256').update(String(input)).digest('hex').slice(0, 16);
  }
}

module.exports = new AssistantService();
