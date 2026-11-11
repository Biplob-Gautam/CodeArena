import api from "./api";

const submissionService = {
  async submitCode(battleId, language, sourceCode) {
    const data = await api.post(`/submissions/battles/${encodeURIComponent(battleId)}`, {
      language,
      sourceCode,
    });
    return data.submission;
  },

  async getSubmission(submissionId) {
    const data = await api.get(`/submissions/${encodeURIComponent(submissionId)}`);
    return data.submission;
  },
};

export default submissionService;
