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

  // 8. توليد وتقسيم الفرق (الجديد والمهم!)
  // هاد المسار اللي صفحة الأفرقة رح تناديه أول ما تفتح
  router.get("/generate-teams", (req, res) =>
    playerController.generateTeams(db, req, res),
  );

  return router;
};
