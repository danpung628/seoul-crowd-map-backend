const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const connectDB = require("./config/db");
const populationRouter = require("./routes/population");
const { collectAndSave } = require("./services/collector");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const {
  apiLimiter,
  authLimiter,
  validateEnv,
} = require("./config/security");
require("dotenv").config();

// 환경변수 검증
validateEnv();

const app = express();

// 보안 헤더 설정
app.use(
  helmet({
    contentSecurityPolicy: false, // Swagger UI 호환
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(express.json({ limit: "10kb" })); // 요청 본문 크기 제한

// 전역 Rate Limiter
app.use("/api/", apiLimiter);

// 인증 API에 더 강력한 Rate Limiter 적용
app.use("/api/auth", authLimiter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 기본 라우트
app.get("/", (req, res) => {
  res.json({ message: "SeoulCrowdMap API 서버 실행 중" });
});

// API 라우트
app.use("/api/population", populationRouter);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/favorites", require("./routes/favorites"));

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  });

  // 서버 시작 시 첫 수집 실행
  console.log("📡 첫 데이터 수집을 시작합니다...");
  await collectAndSave();

  // 5분마다 자동 수집
  setInterval(collectAndSave, 5 * 60 * 1000);
  console.log("⏰ 5분마다 자동 수집이 설정되었습니다");
};

startServer();
