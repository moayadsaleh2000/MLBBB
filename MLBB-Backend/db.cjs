const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host} ✅`);
    await seedSettings();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// 1. موديل اللاعبين
const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  rank: String,
  primaryRole: String,
  secondaryRole: String,
  tokenVersion: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// 2. موديل الإعدادات
const settingsSchema = new mongoose.Schema({
  registration_open: { type: Boolean, default: true },
  reveal_started: { type: Boolean, default: false },
  version: { type: Number, default: 0 },
});

// 3. موديل الفرق (لحفظ التشكيلة الثابتة)
const teamSchema = new mongoose.Schema({
  teamName: String,
  members: [
    {
      name: String,
      rank: String,
      assignedRole: String,
    },
  ],
});

// 4. موديل المباريات (المهم لنظام الشجرة والنقاط)
const matchSchema = new mongoose.Schema({
  t1: { type: String, required: true },
  t2: { type: String, required: true },
  winner: { type: String, default: null },
  mode: { type: String, enum: ["points", "bracket"], required: true },
  round: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

const Player = mongoose.model("Player", playerSchema);
const Settings = mongoose.model("Settings", settingsSchema);
const Team = mongoose.model("Team", teamSchema);
const Match = mongoose.model("Match", matchSchema);

// دالة البذر الأولية (Seeding) لضمان وجود الإعدادات الأساسية
async function seedSettings() {
  try {
    const count = await Settings.countDocuments();
    if (count === 0) {
      await Settings.create({
        registration_open: true,
        reveal_started: false,
        version: 0,
      });
      console.log("Default settings created! 🌱");
    }
  } catch (err) {
    console.error("Seed Settings Error:", err.message);
  }
}

// تصدير كل الموديلات لضمان وصول السيرفر والـ Routes إليها
module.exports = {
  connectDB,
  Player,
  Settings,
  Team,
  Match,
};
