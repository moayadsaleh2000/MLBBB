const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key";

// --- 1. تسجيل لاعب جديد ---
exports.joinTournament = async (models, req, res) => {
  const { Player, Settings } = models;
  try {
    const { name, rank, primaryRole, secondaryRole } = req.body;

    const settings = (await Settings.findOne()) || {
      registration_open: true,
      version: 0,
    };

    if (!settings.registration_open) {
      return res.status(403).json({ message: "التسجيل مغلق حالياً!" });
    }

    const existingPlayer = await Player.findOne({ name: name.trim() });
    if (existingPlayer)
      return res.status(400).json({ message: "الاسم مسجل مسبقاً!" });

    const newPlayer = await Player.create({
      name: name.trim(),
      rank,
      primaryRole,
      secondaryRole,
      tokenVersion: settings.version || 0,
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
    res.status(500).json({ message: err.message });
  }
};

// --- 2. حذف لاعب ---
exports.deletePlayer = async (models, req, res) => {
  try {
    await models.Player.findByIdAndDelete(req.params.id);
    res.json({ message: "تم الحذف" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 3. تصفير البطولة ---
exports.resetAll = async (models, req, res) => {
  if (req.body.secretCode !== "8520085")
    return res.status(401).json({ message: "رمز خاطئ" });
  try {
    await models.Player.deleteMany({});
    const settings = await models.Settings.findOneAndUpdate(
      {},
      {
        $set: { registration_open: true },
        $inc: { version: 1 },
      },
      { upsert: true, new: true },
    );
    res.json({ message: "تم التصفير بنجاح", version: settings.version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 4. إضافة بوتات ---
exports.seedFakePlayers = async (models, req, res) => {
  const roles = ["Jungle", "Gold Lane", "EXP Lane", "Mid Lane", "Roam"];
  const ranks = ["Mythic", "Legend", "Epic"];
  const settings = (await models.Settings.findOne()) || { version: 0 };

  const bots = roles.map((role) => ({
    name: `Bot_${role}_${Math.floor(Math.random() * 99)}`,
    rank: ranks[Math.floor(Math.random() * ranks.length)],
    primaryRole: role,
    secondaryRole: roles[Math.floor(Math.random() * roles.length)],
    tokenVersion: settings.version,
  }));

  try {
    await models.Player.insertMany(bots);
    res.json({ message: "تمت إضافة 5 بوتات بمراكز مختلفة" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 5. جلب كل اللاعبين ---
exports.getAllPlayers = async (models, req, res) => {
  try {
    const players = await models.Player.find().sort({ createdAt: 1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 6. التقسيم الذكي والسريع (المعدل كلياً) ---
exports.generateTeams = async (models, req, res) => {
  const { Player } = models;
  try {
    let allPlayers = await Player.find();
    if (allPlayers.length < 5)
      return res
        .status(400)
        .json({ message: "نحتاج 5 لاعبين على الأقل لتكوين فريق" });

    const rolesOrder = ["Jungle", "Mid Lane", "Gold Lane", "EXP Lane", "Roam"];
    const numberOfTeams = Math.floor(allPlayers.length / 5);

    // لخبطة عشوائية لضمان تغير النتائج عند كل ضغطة
    let pool = [...allPlayers].sort(() => Math.random() - 0.5);

    // تجهيز مصفوفة الفرق
    let teams = Array.from({ length: numberOfTeams }, (_, i) => ({
      teamName: `Team ${String.fromCharCode(65 + i)}`,
      members: [],
    }));

    // المرحلة الأولى: توزيع المتخصصين (يرضي رغبات اللاعبين أولاً)
    rolesOrder.forEach((role) => {
      teams.forEach((team) => {
        const playerIndex = pool.findIndex((p) => p.primaryRole === role);
        if (playerIndex !== -1) {
          const player = pool.splice(playerIndex, 1)[0];
          let pObj = player.toObject();
          pObj.assignedRole = role;
          team.members.push(pObj);
        }
      });
    });

    // المرحلة الثانية: تعبئة الفراغات (للي تخصصهم مكرر أو ما لقوا مكان)
    teams.forEach((team) => {
      rolesOrder.forEach((role) => {
        // إذا المسار لسه فاضي في هاد الفريق
        const isRoleEmpty = !team.members.some((m) => m.assignedRole === role);

        if (isRoleEmpty && pool.length > 0) {
          const player = pool.splice(0, 1)[0];
          let pObj = player.toObject();
          pObj.assignedRole = role;
          team.members.push(pObj);
        }
      });
    });

    // ملاحظة: إذا زاد لاعبين (مثلاً 17 لاعب)، الـ 2 الزيادة بضلوا بالـ pool وما بدخلوا الشجرة
    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 7. قفل/فتح التسجيل ---
exports.toggleRegistration = async (models, req, res) => {
  try {
    const s = await models.Settings.findOne();
    const newState = s ? !s.registration_open : false;
    await models.Settings.findOneAndUpdate(
      {},
      { registration_open: newState },
      { upsert: true },
    );
    res.json({ registration_open: newState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 8. جلب الإعدادات ---
exports.getSettings = async (models, req, res) => {
  try {
    const settings = await models.Settings.findOne();
    res.json(settings || { registration_open: true, version: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
