// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";

// 환경변수에서 Google OAuth 정보 가져오기
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET;

// 환경변수가 설정되지 않은 경우 에러 처리
if (!GOOGLE_CLIENT_ID) {
  console.error('VITE_GOOGLE_CLIENT_ID 환경변수가 설정되지 않았습니다.');
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} clientSecret={GOOGLE_CLIENT_SECRET}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
