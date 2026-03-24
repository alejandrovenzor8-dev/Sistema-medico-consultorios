const AssistantService = require('../services/assistantService');
const { AssistantQueryLog } = require('../models');

const DISCLAIMER = 'Informacion general, no sustituye consulta medica profesional.';

const queryAssistant = async (req, res) => {
  try {
    const query = String(req.body?.query || '').trim();
    if (!query) {
      return res.status(400).json({ message: 'query is required' });
    }

    const result = await AssistantService.handleQuery({ query, user: req.user });

    await AssistantQueryLog.create({
      userId: req.user.id,
      queryText: query,
      intent: result.intent,
      anonymizedPayload: result.anonymizedPayload,
      responseSummary: result.responseSummary,
    });

    return res.json({
      intent: result.intent,
      answer: result.answer,
      chart: result.chart,
      sources: result.sources || [],
      disclaimer: DISCLAIMER,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { queryAssistant };
