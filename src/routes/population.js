const express = require("express");
const router = express.Router();
const {
  getPopulationData,
  getAllPopulationData,
} = require("../services/seoulApi");
const Population = require("../models/Population");
const cache = require("../config/cache");

/**
 * @swagger
 * /api/population:
 *   get:
 *     summary: 전체 장소 최신 데이터
 *     description: DB에 저장된 120개 장소의 최신 인구 데이터를 반환합니다. 5분 캐싱 적용.
 *     tags: [인구 데이터]
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                   example: 120
 *                 cached:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Population'
 */
router.get("/", async (req, res) => {
  try {
    const cached = cache.get("allPopulation");
    if (cached) {
      return res.json({
        success: true,
        count: cached.length,
        data: cached,
        cached: true,
      });
    }

    const latest = await Population.findOne().sort({ collectedAt: -1 });
    if (!latest) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        message: "저장된 데이터가 없습니다",
      });
    }

    const data = await Population.find({ collectedAt: latest.collectedAt })
      .select("-_id -__v")
      .sort({ areaName: 1 })
      .lean();

    cache.set("allPopulation", data);
    res.json({ success: true, count: data.length, data, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/population/realtime:
 *   get:
 *     summary: 실시간 직접 호출
 *     description: 서울시 API를 직접 호출합니다. DB를 거치지 않으며 약 30초 소요됩니다.
 *     tags: [인구 데이터]
 *     responses:
 *       200:
 *         description: 성공
 */
router.get("/realtime", async (req, res) => {
  try {
    const data = await getAllPopulationData();
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/population/ranking/top:
 *   get:
 *     summary: 혼잡/한산 TOP 3 랭킹
 *     description: |
 *       혼잡도 점수 기반 상위 3개(혼잡)와 하위 3개(한산) 장소를 반환합니다.
 *       점수 공식: crowdScore = (혼잡도 점수 × 100) + 정규화된 인구수(0~99)
 *       혼잡도 점수: 붐빔=4, 약간 붐빔=3, 보통=2, 여유=1
 *     tags: [인구 데이터]
 *     responses:
 *       200:
 *         description: 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 cached:
 *                   type: boolean
 *                 crowded:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RankedPopulation'
 *                 quiet:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RankedPopulation'
 */
router.get("/ranking/top", async (req, res) => {
  try {
    const cached = cache.get("ranking");
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const latest = await Population.findOne().sort({ collectedAt: -1 });
    if (!latest) {
      return res.json({ success: true, crowded: [], quiet: [] });
    }

    const allData = await Population.find({ collectedAt: latest.collectedAt })
      .select("-_id -__v")
      .lean();

    const congestionScore = {
      붐빔: 4,
      "약간 붐빔": 3,
      보통: 2,
      여유: 1,
    };

    const maxPop = Math.max(...allData.map((d) => d.populationMax || 0));

    const scored = allData.map((item) => {
      const cScore = congestionScore[item.congestionLevel] || 1;
      const popNorm =
        maxPop > 0 ? Math.round((item.populationMax / maxPop) * 99) : 0;
      const totalScore = cScore * 100 + popNorm;
      return { ...item, totalScore };
    });

    scored.sort((a, b) => b.totalScore - a.totalScore);
    const crowded = scored.slice(0, 3).map(({ totalScore, ...rest }) => ({
      ...rest,
      crowdScore: totalScore,
    }));
    const quiet = scored
      .slice(-3)
      .reverse()
      .map(({ totalScore, ...rest }) => ({
        ...rest,
        crowdScore: totalScore,
      }));

    const result = { success: true, crowded, quiet };
    cache.set("ranking", result);
    res.json({ ...result, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/population/{placeName}:
 *   get:
 *     summary: 특정 장소 데이터
 *     description: 특정 장소의 최신 인구 데이터를 반환합니다.
 *     tags: [인구 데이터]
 *     parameters:
 *       - in: path
 *         name: placeName
 *         required: true
 *         schema:
 *           type: string
 *         description: 장소명 (예: 강남역, 홍대 관광특구)
 *         example: 강남역
 *     responses:
 *       200:
 *         description: 성공
 *       404:
 *         description: 데이터를 찾을 수 없음
 */
router.get("/:placeName", async (req, res) => {
  try {
    const cacheKey = `place_${req.params.placeName}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    const data = await Population.findOne({ areaName: req.params.placeName })
      .sort({ collectedAt: -1 })
      .select("-_id -__v")
      .lean();

    if (!data) {
      const apiData = await getPopulationData(req.params.placeName);
      if (!apiData) {
        return res
          .status(404)
          .json({ success: false, message: "데이터를 찾을 수 없습니다" });
      }
      return res.json({ success: true, data: apiData });
    }

    cache.set(cacheKey, data);
    res.json({ success: true, data, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/population/{placeName}/history:
 *   get:
 *     summary: 시간대별 추이 (최근 24시간)
 *     description: 최근 24시간 동안 수집된 특정 장소의 인구 데이터를 반환합니다.
 *     tags: [인구 데이터]
 *     parameters:
 *       - in: path
 *         name: placeName
 *         required: true
 *         schema:
 *           type: string
 *         example: 강남역
 *     responses:
 *       200:
 *         description: 성공
 */
router.get("/:placeName/history", async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const data = await Population.find({
      areaName: req.params.placeName,
      collectedAt: { $gte: since },
    })
      .select("-_id -__v")
      .sort({ collectedAt: 1 })
      .lean();

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
