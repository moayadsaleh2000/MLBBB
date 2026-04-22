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

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  rank: String,
  primaryRole: String,
  secondaryRole: String,
  createdAt: { type: Date, default: Date.now },
});

const settingsSchema = new mongoose.Schema({
  registration_open: { type: Boolean, default: true },
  reveal_started: { type: Boolean, default: false },
});

const Player = mongoose.model("Player", playerSchema);
const Settings = mongoose.model("Settings", settingsSchema);

async function seedSettings() {
  const count = await Settings.countDocuments();
  if (count === 0) {
    await Settings.create({ registration_open: true, reveal_started: false });
  }
}

module.exports = { connectDB, Player, Settings };
