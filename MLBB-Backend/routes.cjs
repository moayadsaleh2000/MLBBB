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

  // 3. جلب الإعدادات (حالة التسجيل والفرق)
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

  // --- التعديل هنا (8 & 9) ---

  // 8. عرض الفرق المخزنة (ثابت - للاعبين والـ Interval)
  // هاد المسار اللي صفحة الأفرقة رح تناديه كل 5 ثواني
  router.get("/generate-teams", (req, res) =>
    playerController.getTeams(db, req, res),
  );

  // 9. توليد وحفظ فرق جديدة (للأدمن فقط)
  // هاد المسار يتم مناداته فقط عند الضغط على زر "إعادة التشكيل"
  router.post("/shuffle-teams", (req, res) =>
    playerController.shuffleAndSaveTeams(db, req, res),
  );

  return router;
};
