import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const analyzeTranscript = (data) =>
  axios.post(`${BASE}/analyze`, data).then(r => r.data);

export const compareTranscripts = (data) =>
  axios.post(`${BASE}/compare`, data).then(r => r.data);

export const downloadBrief = async (data) => {
  const res = await axios.post(`${BASE}/brief`, data, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.company}_${data.quarter || 'brief'}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};