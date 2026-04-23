const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key";

// ذاكرة مؤقتة للفرق (Cached Teams) لضمان ثبات التشكيلة أثناء العرض
let cachedTeams = null;

// --- 1. تسجيل لاعب جديد ---
exports.joinTournament = async (models, req, res) => {
  const { Player, Settings } = models;
  try {
    const { name, rank, primaryRole, secondaryRole } = req.body;
    const settings = await Settings.findOne();

    const existingPlayer = await Player.findOne({ name: name.trim() });
    if (existingPlayer)
      return res.status(400).json({ message: "الاسم مسجل مسبقاً!" });

    const newPlayer = await Player.create({
      name: name.trim(),
      rank,
      primaryRole,
      secondaryRole,
      tokenVersion: settings?.version || 0,
    });

    const token = jwt.sign(
      {
        id: newPlayer._id,
        name: newPlayer.name,
        version: newPlayer.tokenVersion,
      },
      SECRET_KEY,
      { expiresIn: "1d" },
    );

    res.status(200).json({ token, message: "تم التسجيل بنجاح!" });
  } catch (err) {
    res.status(500).json({ message: "خطأ في السيرفر: " + err.message });
  }
};

// --- 2. حذف لاعب ---
exports.deletePlayer = async (models, req, res) => {
  try {
    await models.Player.findByIdAndDelete(req.params.id);
    cachedTeams = null; // تصفير الكاش لإعادة توليد الفرق بعد الحذف
    res.json({ message: "تم الحذف بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 3. تصفير البطولة بالكامل ---
exports.resetAll = async (models, req, res) => {
  if (req.body.secretCode !== "8520085")
    return res.status(401).json({ message: "رمز خاطئ" });
  try {
    await models.Player.deleteMany({});
    await models.Match.deleteMany({});
    await models.Team.deleteMany({}); // تنظيف موديل الفرق أيضاً
    cachedTeams = null;
    const settings = await models.Settings.findOneAndUpdate(
      {},
      { $set: { registration_open: true }, $inc: { version: 1 } },
      { upsert: true, new: true },
    );
    res.json({ message: "تم تصفير البطولة بنجاح", version: settings.version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 4. إضافة لاعبين وهميين (بوتات) ---
exports.seedFakePlayers = async (models, req, res) => {
  const roles = ["Jungle", "Gold Lane", "EXP Lane", "Mid Lane", "Roam"];
  const ranks = ["Mythic", "Legend", "Epic"];
  const settings = (await models.Settings.findOne()) || { version: 0 };

  const bots = roles.map((role) => ({
    name: `Bot_${role}_${Math.floor(Math.random() * 999)}`,
    rank: ranks[Math.floor(Math.random() * ranks.length)],
    primaryRole: role,
    secondaryRole: roles[Math.floor(Math.random() * roles.length)],
    tokenVersion: settings.version || 0,
  }));

  try {
    await models.Player.insertMany(bots);
    cachedTeams = null;
    res.json({ message: "تمت إضافة 5 بوتات بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 5. جلب قائمة اللاعبين ---
exports.getAllPlayers = async (models, req, res) => {
  try {
    const players = await models.Player.find().sort({ createdAt: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 6. جلب الفرق (من الكاش أو التوليد الجديد) ---
exports.getTeams = async (models, req, res) => {
  if (cachedTeams && cachedTeams.length > 0) {
    return res.json({ success: true, teams: cachedTeams });
  }
  return exports.shuffleAndSaveTeams(models, req, res);
};

// --- 7. توليد الفرق وتوزيع الأدوار ---
exports.shuffleAndSaveTeams = async (models, req, res) => {
  try {
    const allPlayers = await models.Player.find();
    if (allPlayers.length < 5)
      return res
        .status(400)
        .json({ success: false, message: "نحتاج على الأقل 5 لاعبين" });

    const rolesOrder = ["Jungle", "Mid Lane", "Gold Lane", "EXP Lane", "Roam"];
    const numberOfTeams = Math.floor(allPlayers.length / 5);
    let pool = [...allPlayers].sort(() => Math.random() - 0.5);
    let teams = Array.from({ length: numberOfTeams }, (_, i) => ({
      teamName: `Team ${String.fromCharCode(65 + i)}`,
      members: [],
    }));

    // محاولة توزيع الأدوار بناءً على الرول الأساسي
    rolesOrder.forEach((role) => {
      teams.forEach((team) => {
        const playerIndex = pool.findIndex((p) => p.primaryRole === role);
        if (playerIndex !== -1) {
          const pObj = pool.splice(playerIndex, 1)[0].toObject();
          pObj.assignedRole = role;
          team.members.push(pObj);
        }
      });
    });

    // ملء الفراغات المتبقية في الفرق
    teams.forEach((team) => {
      rolesOrder.forEach((role) => {
        if (
          !team.members.some((m) => m.assignedRole === role) &&
          pool.length > 0
        ) {
          const pObj = pool.splice(0, 1)[0].toObject();
          pObj.assignedRole = role;
          team.members.push(pObj);
        }
      });
    });

    cachedTeams = teams;
    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 8. إدارة المباريات (Matches) ---
exports.getAllMatches = async (models, req, res) => {
  try {
    const matches = await models.Match.find();
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateMatches = async (models, req, res) => {
  try {
    await models.Match.deleteMany({}); // مسح الجدول القديم
    const savedMatches = await models.Match.insertMany(req.body.matches);
    res.status(201).json(savedMatches);
  } catch (err) {
    res.status(500).json({ message: "خطأ في توليد الجدول: " + err.message });
  }
};

exports.updateMatchWinner = async (models, req, res) => {
  try {
    const updated = await models.Match.findByIdAndUpdate(
      req.params.id,
      { winner: req.body.winner },
      { new: true },
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- 9. إعدادات البطولة ---
exports.toggleRegistration = async (models, req, res) => {
  try {
    const s = await models.Settings.findOne();
    const newState = s ? !s.registration_open : false;
    await models.Settings.findOneAndUpdate(
      {},
      { registration_open: newState },
      { upsert: true, new: true },
    );
    res.json({ registration_open: newState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSettings = async (models, req, res) => {
  try {
    const s = await models.Settings.findOne();
    res.json(s || { registration_open: true, version: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
