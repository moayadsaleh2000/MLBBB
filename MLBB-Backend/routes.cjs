const express = require("express");
const router = express.Router();
const playerController = require("./playerController.cjs");

module.exports = (db) => {
  // 1. تسجيل لاعب جديد
  router.post("/join", (req, res) =>
    playerController.joinTournament(db, req, res),
  );

  // 2. جلب قائمة اللاعبين
  router.get("/players", (req, res) =>
    playerController.getAllPlayers(db, req, res),
  );

  // 3. جلب الإعدادات (حالة التسجيل والنسخة)
  router.get("/settings", (req, res) =>
    playerController.getSettings(db, req, res),
  );

  // 4. تصفير البطولة بالكامل (محمي بكلمة سر)
  router.post("/reset", (req, res) => playerController.resetAll(db, req, res));

  // 5. حذف لاعب محدد
  router.delete("/player/:id", (req, res) =>
    playerController.deletePlayer(db, req, res),
  );

  // 6. إضافة لاعبين وهميين - بوتات
  router.post("/seed", (req, res) =>
    playerController.seedFakePlayers(db, req, res),
  );

  // 7. قفل وفتح التسجيل
  router.post("/toggle-reg", (req, res) =>
    playerController.toggleRegistration(db, req, res),
  );

  // 8. عرض الفرق المخزنة (التي تم توليدها في الكاش)
  router.get("/generate-teams", (req, res) =>
    playerController.getTeams(db, req, res),
  );

  // 9. توليد وحفظ فرق جديدة (إعادة الخلط)
  router.post("/shuffle-teams", (req, res) =>
    playerController.shuffleAndSaveTeams(db, req, res),
  );

  // --- مسارات نظام البطولة والمباريات ---

  // 10. جلب كل المباريات (لعرضها في صفحة الـ Bracket)
  router.get("/matches", (req, res) =>
    playerController.getAllMatches(db, req, res),
  );

  // 11. توليد وحفظ جدول مباريات جديد (المسار اللي كان يعطي 404)
  router.post("/matches/generate", (req, res) =>
    playerController.generateMatches(db, req, res),
  );

  // 12. تحديث فائز في مباراة معينة
  router.put("/matches/:id", (req, res) =>
    playerController.updateMatchWinner(db, req, res),
  );

  return router;
};
