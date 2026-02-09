const express = require("express");
const router = express.Router();
const {
  getPopulationData,
  getAllPopulationData,
} = require("../services/seoulApi");
const Population = require("../models/Population");

// 전체 장소 최신 데이터 (DB에서 조회)
router.get("/", async (req, res) => {
  try {
    // 가장 최근 수집 시간 찾기
    const latest = await Population.findOne().sort({ collectedAt: -1 });

    if (!latest) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: "저장된 데이터가 없습니다",
      });
    }

    // 해당 시간의 모든 데이터 조회
    const data = await Population.find({ collectedAt: latest.collectedAt })
      .select("-_id -__v")
      .sort({ areaName: 1 });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 실시간 API 직접 호출 (DB 거치지 않음)
router.get("/realtime", async (req, res) => {
  try {
    const data = await getAllPopulationData();
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 특정 장소 최신 데이터
router.get("/:placeName", async (req, res) => {
  try {
    const data = await Population.findOne({ areaName: req.params.placeName })
      .sort({ collectedAt: -1 })
      .select("-_id -__v");

    if (!data) {
      // DB에 없으면 API 직접 호출
      const apiData = await getPopulationData(req.params.placeName);
      if (!apiData) {
        return res
          .status(404)
          .json({ success: false, message: "데이터를 찾을 수 없습니다" });
      }
      return res.json({ success: true, data: apiData });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 특정 장소 시간대별 추이 (최근 24시간)
router.get("/:placeName/history", async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const data = await Population.find({
      areaName: req.params.placeName,
      collectedAt: { $gte: since },
    })
      .select("-_id -__v")
      .sort({ collectedAt: 1 });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// TOP 3 혼잡/한산 지역
router.get("/ranking/top", async (req, res) => {
  try {
    const latest = await Population.findOne().sort({ collectedAt: -1 });

    if (!latest) {
      return res.json({ success: true, crowded: [], quiet: [] });
    }

    const allData = await Population.find({ collectedAt: latest.collectedAt })
      .select("-_id -__v")
      .lean();

    // 혼잡도 점수 매핑
    const congestionScore = {
      붐빔: 4,
      "약간 붐빔": 3,
      보통: 2,
      여유: 1,
    };

    // 전체 중 최대 인구수 (정규화용)
    const maxPop = Math.max(...allData.map((d) => d.populationMax || 0));

    // 최종 점수 계산
    const scored = allData.map((item) => {
      const cScore = congestionScore[item.congestionLevel] || 1;
      const popNorm =
        maxPop > 0 ? Math.round((item.populationMax / maxPop) * 99) : 0;
      const totalScore = cScore * 100 + popNorm;

      return { ...item, totalScore };
    });

    // 점수 높은 순 = 혼잡한 곳
    scored.sort((a, b) => b.totalScore - a.totalScore);
    const crowded = scored.slice(0, 3).map(({ totalScore, ...rest }) => ({
      ...rest,
      crowdScore: totalScore,
    }));

    // 점수 낮은 순 = 한산한 곳
    const quiet = scored
      .slice(-3)
      .reverse()
      .map(({ totalScore, ...rest }) => ({
        ...rest,
        crowdScore: totalScore,
      }));

    res.json({ success: true, crowded, quiet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
module.exports = router;
