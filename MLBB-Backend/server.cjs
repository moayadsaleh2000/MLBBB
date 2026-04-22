const express = require("express");
const cors = require("cors");
const { connectDB, Player, Settings } = require("./db.cjs"); // لاحظ تغيير الامتداد هنا
const routes = require("./routes.cjs"); // لاحظ تغيير الامتداد هنا
require("dotenv").config();

const app = express();

// إعدادات CORS للسماح للفرونت إند بالوصول
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// توصيل قاعدة البيانات
connectDB();

// تمرير الموديلات للراوتس
app.use("/api", routes({ Player, Settings }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
