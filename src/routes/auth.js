const express = require("express");
const router = express.Router();
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 구글 로그인
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    // 구글 토큰 검증
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { sub: googleId, email, name, picture } = ticket.getPayload();

    // 유저 찾거나 새로 생성
    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        picture,
        favorites: [],
      });
    } else {
      user.name = name;
      user.picture = picture;
      await user.save();
    }

    // JWT 발급
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      token,
      user: { name: user.name, email: user.email, picture: user.picture },
    });
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "구글 인증 실패: " + error.message });
  }
});

// 내 정보 조회
router.get("/me", require("../middleware/auth"), async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-googleId -__v");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "유저를 찾을 수 없습니다" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
