const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.1.0",
    info: {
      title: "SeoulCrowdMap API",
      version: "1.0.0",
      description: "서울시 실시간 인구밀도 시각화 서비스 API",
    },
    servers: [
      { url: "http://localhost:3000", description: "Development" },
      {
        url: "http://13.125.207.164:3000",
        description: "Production (AWS EC2)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "구글 로그인 후 발급받은 JWT 토큰",
        },
      },
      schemas: {
        Population: {
          type: "object",
          properties: {
            areaName: { type: "string", example: "강남역" },
            areaCode: { type: "string", example: "POI014" },
            congestionLevel: {
              type: "string",
              example: "보통",
              description: "여유/보통/약간 붐빔/붐빔",
            },
            congestionMessage: {
              type: "string",
              example: "사람이 몰려있을 수 있지만 크게 붐비지는 않아요.",
            },
            populationMin: { type: "integer", example: 42000 },
            populationMax: { type: "integer", example: 44000 },
            updatedAt: { type: "string", example: "2026-02-08 14:35" },
            collectedAt: { type: "string", format: "date-time" },
          },
        },
        RankedPopulation: {
          allOf: [
            { $ref: "#/components/schemas/Population" },
            {
              type: "object",
              properties: {
                crowdScore: {
                  type: "integer",
                  example: 393,
                  description: "랭킹 점수 (100~499)",
                },
              },
            },
          ],
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
