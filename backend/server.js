require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// --- CORS CONFIGURATION (UPDATED) ---
app.use(
  cors({
    origin: [
      "http://localhost:5173",                     // 1. Allows your local Vite dev server
      "https://budget-tracker-api-as6k.onrender.com", // 2. Allows the backend itself (good for health checks)
    "https://mern-budget-tracker-project.vercel.app"   
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  })
);

// Body parser
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/categories", require("./routes/category"));
app.use("/api/budgets", require("./routes/budget"));
app.use("/api/expenses", require("./routes/expense"));
app.use("/api/reports", require("./routes/report"));
app.use("/api/insights", require("./routes/insights"));

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.log("MongoDB connection error:", err));