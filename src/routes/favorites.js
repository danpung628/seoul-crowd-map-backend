const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// 즐겨찾기 목록 조회
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 즐겨찾기 추가
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

// 즐겨찾기 삭제
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
