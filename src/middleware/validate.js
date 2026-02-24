const validator = require("validator");
const PLACES = require("../data/places");

// 장소명 검증 미들웨어
const validatePlaceName = (req, res, next) => {
  const placeName = req.params.placeName || req.body.placeName;

  if (!placeName) {
    return res.status(400).json({
      success: false,
      message: "장소명이 필요합니다.",
    });
  }

  // 문자열 타입 확인
  if (typeof placeName !== "string") {
    return res.status(400).json({
      success: false,
      message: "장소명은 문자열이어야 합니다.",
    });
  }

  // 길이 제한 (최대 50자)
  if (placeName.length > 50) {
    return res.status(400).json({
      success: false,
      message: "장소명이 너무 깁니다.",
    });
  }

  // XSS 방지: HTML 태그 제거
  const sanitized = validator.escape(placeName);
  if (sanitized !== placeName) {
    return res.status(400).json({
      success: false,
      message: "유효하지 않은 문자가 포함되어 있습니다.",
    });
  }

  // 유효한 장소인지 확인 (선택적 - 엄격 모드)
  if (!PLACES.includes(placeName)) {
    return res.status(400).json({
      success: false,
      message: "존재하지 않는 장소입니다.",
      validPlaces: PLACES.slice(0, 10), // 예시로 10개만 반환
    });
  }

  next();
};

// 요청 본문 기본 검증
const validateBody = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `필수 필드가 누락되었습니다: ${missing.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = {
  validatePlaceName,
  validateBody,
};
