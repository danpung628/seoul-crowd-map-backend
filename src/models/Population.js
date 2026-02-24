const mongoose = require("mongoose");

const populationSchema = new mongoose.Schema({
  areaName: { type: String, required: true },
  areaCode: { type: String, required: true },
  congestionLevel: { type: String, required: true },
  congestionMessage: { type: String },
  populationMin: { type: Number },
  populationMax: { type: Number },
  updatedAt: { type: String },
  collectedAt: { type: Date, default: Date.now },
});

// 검색 성능을 위한 인덱스
populationSchema.index({ areaName: 1, collectedAt: -1 });
populationSchema.index({ collectedAt: -1 });

// TTL 인덱스: 7일 후 자동 삭제
populationSchema.index({ collectedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model("Population", populationSchema);
