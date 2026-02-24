const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: 즐겨찾기 목록 조회
 *     tags: [즐겨찾기]
 *     security:
 *       - bearerAuth: []
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
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["강남역", "홍대 관광특구"]
 */
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/favorites:
 *   post:
 *     summary: 즐겨찾기 추가
 *     tags: [즐겨찾기]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - placeName
 *             properties:
 *               placeName:
 *                 type: string
 *                 example: 강남역
 *     responses:
 *       200:
 *         description: 성공
 *       400:
 *         description: 이미 즐겨찾기에 있음
 */
router.post("/", auth, async (req, res) => {
  try {
    const { placeName } = req.body;

    if (!placeName) {
      return res
        .status(400)
        .json({ success: false, message: "장소명을 입력해주세요" });
    }

    const user = await User.findById(req.userId);

    if (user.favorites.includes(placeName)) {
      return res
        .status(400)
        .json({ success: false, message: "이미 즐겨찾기에 있습니다" });
    }

    user.favorites.push(placeName);
    await user.save();

    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @swagger
 * /api/favorites/{placeName}:
 *   delete:
 *     summary: 즐겨찾기 삭제
 *     tags: [즐겨찾기]
 *     security:
 *       - bearerAuth: []
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
router.delete("/:placeName", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.favorites = user.favorites.filter((f) => f !== req.params.placeName);
    await user.save();

    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
