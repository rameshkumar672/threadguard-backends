// const express = require("express");
// require("dotenv").config();
// const cors = require("cors");
// const connectDB = require("./config/db");

// const http = require("http");
// const { Server } = require("socket.io");

// const authRoutes = require("./routes/authRoutes");
// const securityRoutes = require("./routes/securityRoutes");
// const websiteRoutes = require("./routes/websiteRoutes");
// const protectionRoutes = require("./routes/protectionRoutes");
// const reportRoutes = require("./routes/reportRoutes");

// const checkBlockedIP = require("./middleware/checkBlockedIP");
// const locationMiddleware = require("./middleware/locationMiddleware");

// const app = express();

// // ================= CORS =================
// app.use(cors());
// app.use(express.json());

// // ================= DB CONNECT =================
// // Connections initialized automatically via models require declarations.

// // ================= HTTP SERVER =================
// const server = http.createServer(app);

// // ================= SOCKET.IO =================
// const io = new Server(server, {
//   cors: { origin: "*" }
// });

// app.set("io", io);

// io.on("connection", (socket) => {
//   console.log("⚡ Dashboard connected:", socket.id);

//   socket.on("join_user_room", (userId) => {
//     socket.join(userId);
//     console.log(`👤 Dashboard connected to User Room: ${userId}`);
//   });

//   socket.on("disconnect", () => {
//     console.log("❌ Dashboard disconnected");
//   });
// });

// // ================= ROUTES =================

// const threatguardRoutes = require("./routes/threatguardRoutes");

// // ThreatGuard Owner Auth (NO attack detection — pure login/register)
// app.use("/api/threatguard", threatguardRoutes);

// // SmartLogin Auth
// app.use("/api/auth", authRoutes);

// // Dashboard data APIs (secured by JWT in each route)
// app.use("/api/security", securityRoutes);
// app.use("/api/websites", websiteRoutes);
// app.use("/api/reports", reportRoutes);

// // Protection API: for external websites to report login attempts
// // checkBlockedIP ONLY here — protects external website endpoint, not dashboard
// app.use("/api/protect", locationMiddleware, checkBlockedIP, protectionRoutes);

// // ================= TEST =================
// app.get("/", (req, res) => {
//   res.send("ThreatGuard Backend is running 🚀");
// });

// // ================= SERVER =================
// const PORT = process.env.PORT || 5000;

// // server.listen(PORT, () => {
// //   console.log(`🚀 Server running on port ${PORT}`);
// // });
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });

const express = require("express");
require("dotenv").config();
const cors = require("cors");

// FIX: connectDB function nahi hai, destructure connections import karo
const { tgConnection, slConnection } = require("./config/db");

const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const securityRoutes = require("./routes/securityRoutes");
const websiteRoutes = require("./routes/websiteRoutes");
const protectionRoutes = require("./routes/protectionRoutes");
const reportRoutes = require("./routes/reportRoutes");

const checkBlockedIP = require("./middleware/checkBlockedIP");
const locationMiddleware = require("./middleware/locationMiddleware");

const app = express();

// ================= CORS =================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://threadguard-frontend.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow Postman / no-origin requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight requests
app.options(/.*/, cors(corsOptions));

app.use(express.json());

// ================= HTTP SERVER =================
const server = http.createServer(app);

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("⚡ Dashboard connected:", socket.id);

  socket.on("join_user_room", (userId) => {
    socket.join(userId);
    console.log(`👤 Dashboard connected to User Room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Dashboard disconnected");
  });
});

// ================= ROUTES =================
const threatguardRoutes = require("./routes/threatguardRoutes");

// ThreatGuard Owner Auth
app.use("/api/threatguard", threatguardRoutes);

// SmartLogin Auth
app.use("/api/auth", authRoutes);

// Dashboard APIs
app.use("/api/security", securityRoutes);
app.use("/api/websites", websiteRoutes);
app.use("/api/reports", reportRoutes);

// Protection API
app.use(
  "/api/protect",
  locationMiddleware,
  checkBlockedIP,
  protectionRoutes
);

// ================= TEST ROUTE =================
app.get("/", (req, res) => {
  res.status(200).send("ThreatGuard Backend is running 🚀");
});

// ================= SERVER =================
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});