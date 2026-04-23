const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.JWT_SECRET || "default_secret_key";

// ذاكرة مؤقتة (للاحتياط فقط، الاعتماد الأساسي صار على الداتابيز)
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
    res.json({ message: "تم الحذف بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 3. تصفير البطولة بالكامل (النووي) ---
exports.resetAll = async (models, req, res) => {
  if (req.body.secretCode !== "8520085")
    return res.status(401).json({ message: "رمز خاطئ" });
  try {
    await models.Player.deleteMany({});
    await models.Match.deleteMany({});
    await models.Team.deleteMany({});
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

  const bots = Array.from({ length: 10 }).map((_, i) => ({
    name: `Bot_${roles[i % 5]}_${Math.floor(Math.random() * 999)}`,
    rank: ranks[Math.floor(Math.random() * ranks.length)],
    primaryRole: roles[i % 5],
    secondaryRole: roles[Math.floor(Math.random() * roles.length)],
    tokenVersion: settings.version || 0,
  }));

  try {
    await models.Player.insertMany(bots);
    res.json({ message: "تمت إضافة 10 بوتات بنجاح" });
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

// --- 6. جلب الفرق من الداتابيز ---
exports.getTeams = async (models, req, res) => {
  try {
    const teams = await models.Team.find();
    res.json({ success: true, teams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 7. توليد الفرق وحفظها في الداتابيز (Shuffle) ---
exports.shuffleAndSaveTeams = async (models, req, res) => {
  try {
    const allPlayers = await models.Player.find();
    if (allPlayers.length < 5)
      return res
        .status(400)
        .json({ success: false, message: "نحتاج 5 لاعبين على الأقل" });

    const rolesOrder = ["Jungle", "Mid Lane", "Gold Lane", "EXP Lane", "Roam"];
    const numberOfTeams = Math.floor(allPlayers.length / 5);
    let pool = [...allPlayers].sort(() => Math.random() - 0.5);

    let teams = Array.from({ length: numberOfTeams }, (_, i) => ({
      teamName: `Team ${String.fromCharCode(65 + i)}`,
      members: [],
    }));

    // توزيع اللاعبين حسب الأدوار
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

    // ملء الفراغات
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

    // حفظ الفرق في MongoDB
    await models.Team.deleteMany({});
    const savedTeams = await models.Team.insertMany(teams);
    res.json({ success: true, teams: savedTeams });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- 8. نظام الشجرة والمباريات ---

// جلب كل المباريات لعرضها في Bracket
exports.getAllMatches = async (models, req, res) => {
  try {
    const matches = await models.Match.find().sort({ round: 1, createdAt: 1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// توليد جدول المباريات بناءً على الفرق الموجودة في الداتابيز
exports.generateMatches = async (models, req, res) => {
  try {
    await models.Match.deleteMany({});
    const dbTeams = await models.Team.find();

    if (dbTeams.length < 2)
      return res
        .status(400)
        .json({ message: "يرجى توليد الفرق أولاً من صفحة الفرق" });

    const matchesToCreate = [
      // نصف النهائي الأول
      {
        t1: dbTeams[0].teamName,
        t2: dbTeams[1].teamName,
        round: 1,
        mode: "bracket",
        winner: null,
      },
      // نصف النهائي الثاني (إذا وجد فرق)
      {
        t1: dbTeams[2]?.teamName || "TBD",
        t2: dbTeams[3]?.teamName || "TBD",
        round: 1,
        mode: "bracket",
        winner: null,
      },
      // النهائي (دائماً يبدأ فاضي)
      { t1: "", t2: "", round: 2, mode: "bracket", winner: null },
    ];

    const savedMatches = await models.Match.insertMany(matchesToCreate);
    res.status(201).json(savedMatches);
  } catch (err) {
    res.status(500).json({ message: "خطأ في التوليد: " + err.message });
  }
};

// تحديث الفائز ونقله للجولة التالية تلقائياً
exports.updateMatchWinner = async (models, req, res) => {
  try {
    const { id } = req.params;
    const { winner } = req.body;

    // 1. تحديث المباراة الحالية
    const currentMatch = await models.Match.findByIdAndUpdate(
      id,
      { winner },
      { new: true },
    );

    // 2. إذا كانت المباراة في الجولة الأولى، انقل الفائز للنهائي
    if (currentMatch.mode === "bracket" && currentMatch.round === 1) {
      const allMatches = await models.Match.find({ mode: "bracket" }).sort({
        createdAt: 1,
      });
      const finalMatch = allMatches.find((m) => m.round === 2);

      if (finalMatch) {
        const round1Matches = allMatches.filter((m) => m.round === 1);
        const isFirstMatch = round1Matches[0]._id.toString() === id;

        const updateField = isFirstMatch ? { t1: winner } : { t2: winner };
        await models.Match.findByIdAndUpdate(finalMatch._id, updateField);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
