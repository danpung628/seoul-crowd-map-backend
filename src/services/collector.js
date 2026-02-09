const { getAllPopulationData } = require("./seoulApi");
const Population = require("../models/Population");

const collectAndSave = async () => {
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  console.log(`\n⏰ [${now}] 데이터 수집 시작...`);

  try {
    const dataList = await getAllPopulationData();

    if (dataList.length === 0) {
      console.log("⚠️ 수집된 데이터가 없습니다");
      return;
    }

    // DB에 저장
    const docs = dataList.map((data) => ({
      ...data,
      collectedAt: new Date(),
    }));

    const result = await Population.insertMany(docs);
    console.log(`💾 DB 저장 완료: ${result.length}건`);
  } catch (error) {
    console.error("❌ 수집/저장 실패:", error.message);
  }
};

module.exports = { collectAndSave };
