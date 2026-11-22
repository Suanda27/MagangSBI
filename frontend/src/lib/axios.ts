import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    // Tanpa ini Laravel menjawab error validasi dengan redirect HTML, bukan JSON.
    Accept: 'application/json',
  },
  withCredentials: true,
  // Sanctum SPA: frontend (:3000) dan backend (:8000) berbeda origin. Tanpa opsi ini axios
  // tidak menyalin cookie XSRF-TOKEN ke header X-XSRF-TOKEN, sehingga POST selalu gagal 419.
  withXSRFToken: true,
});

export default api;
