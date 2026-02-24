const rateLimit = require("express-rate-limit");

// 일반 API 요청 제한 (IP당 15분에 100회)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100,
  message: {
    success: false,
    message: "너무 많은 요청을 보냈습니다. 15분 후에 다시 시도해주세요.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 인증 API 요청 제한 (IP당 15분에 10회 - 브루트포스 방지)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10,
  message: {
    success: false,
    message: "로그인 시도가 너무 많습니다. 15분 후에 다시 시도해주세요.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 실시간 API 요청 제한 (IP당 5분에 5회 - 서울시 API 보호)
const realtimeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5분
  max: 5,
  message: {
    success: false,
    message: "실시간 API 요청이 너무 많습니다. 5분 후에 다시 시도해주세요.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 환경변수 검증
const validateEnv = () => {
  const required = [
    "MONGODB_URI",
    "SEOUL_API_KEY",
    "GOOGLE_CLIENT_ID",
    "JWT_SECRET",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ 필수 환경변수 누락: ${missing.join(", ")}`);
    process.exit(1);
  }

  // JWT_SECRET 강도 검증
  if (process.env.JWT_SECRET.length < 32) {
    console.warn(
      "⚠️  JWT_SECRET이 32자 미만입니다. 보안을 위해 더 긴 시크릿을 사용하세요."
    );
  }
};

module.exports = {
  apiLimiter,
  authLimiter,
  realtimeLimiter,
  validateEnv,
};
