require("dotenv").config();
const axios = require("axios");
const PLACES = require("../data/places");

const SEOUL_API_KEY = process.env.SEOUL_API_KEY;

const BASE_URL = `http://openapi.seoul.go.kr:8088/${SEOUL_API_KEY}/json/citydata_ppltn/1/5`;

// 특정 장소의 실시간 인구 데이터 가져오기
const getPopulationData = async (placeName) => {
  try {
    const url = `${BASE_URL}/${encodeURIComponent(placeName)}`;
    const response = await axios.get(url);

    // 응답 구조 확인용 로그 (첫 번째 호출만)
    const data = response.data["SeoulRtd.citydata_ppltn"];

    if (!data) {
      throw new Error("데이터를 찾을 수 없습니다");
    }

    const item = data[0];

    return {
      areaName: item.AREA_NM,
      areaCode: item.AREA_CD,
      congestionLevel: item.AREA_CONGEST_LVL,
      congestionMessage: item.AREA_CONGEST_MSG,
      populationMin: parseInt(item.AREA_PPLTN_MIN),
      populationMax: parseInt(item.AREA_PPLTN_MAX),
      updatedAt: item.PPLTN_TIME,
    };
  } catch (error) {
    console.error(`❌ ${placeName} 네트워크 오류:`, error.message);
    return null;
  }
};

// 120개 장소 전체 데이터 가져오기 (10개씩 병렬 호출)
const getAllPopulationData = async () => {
  const results = [];
  const batchSize = 10;

  console.log(`📡 ${PLACES.length}개 장소 데이터 수집 시작...`);

  for (let i = 0; i < PLACES.length; i += batchSize) {
    const batch = PLACES.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((place) => getPopulationData(place)),
    );

    // null이 아닌 성공한 데이터만 추가
    results.push(...batchResults.filter((r) => r !== null));

    console.log(
      `  ✅ ${Math.min(i + batchSize, PLACES.length)}/${PLACES.length} 완료`,
    );

    // API 부하 방지를 위해 배치 사이 0.5초 대기
    if (i + batchSize < PLACES.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`📡 수집 완료: ${results.length}/${PLACES.length}개 성공`);
  return results;
};

module.exports = { getPopulationData, getAllPopulationData };
