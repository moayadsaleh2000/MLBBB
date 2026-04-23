const express = require("express");
const cors = require("cors");
const { connectDB, Player, Settings, Match, Team } = require("./db.cjs");
const routes = require("./routes.cjs");
require("dotenv").config();

const app = express();

// 1. إعدادات CORS: السماح بجميع العمليات المطلوبة للبطولة
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 2. Middleware لمعالجة البيانات القادمة بصيغة JSON
app.use(express.json());

// 3. الاتصال بقاعدة البيانات (MongoDB)
connectDB();

/**
 * 4. ربط المسارات (Routes)
 * نمرر كائن يحتوي على جميع الموديلات لضمان وصول Controller لكل منها
 */
app.use("/api", routes({ Player, Settings, Match, Team }));

// 5. تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ====================================
  🚀 Server is running on port: ${PORT}
  🔗 API Base URL: /api
  ====================================
  `);
});
