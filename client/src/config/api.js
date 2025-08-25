// API 설정
const API_CONFIG = {
  // 개발 환경
  development: {
    baseURL: 'http://localhost:5000',
    apiPath: '/api'
  },
  // 프로덕션 환경 (Vercel)
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'https://your-domain.vercel.app',
    apiPath: '/api'
  }
};

// 현재 환경에 따른 설정
const currentEnv = process.env.NODE_ENV || 'development';
const config = API_CONFIG[currentEnv];

// API URL 생성 함수
export const getApiUrl = (endpoint) => {
  return `${config.baseURL}${config.apiPath}${endpoint}`;
};

// 환경별 설정 내보내기
export default config;
