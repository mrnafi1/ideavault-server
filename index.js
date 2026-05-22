require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const ideaRoutes   = require("./routes/ideaRoutes");
const authRoutes   = require("./routes/authRoutes");
const commentRoutes = require("./routes/commentRoutes");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());

// ── MongoDB ────────────────────────────────────────────────────
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");

    const db = client.db("ideavaultDB");

    // Collections
    const ideasCollection    = db.collection("ideas");
    const usersCollection    = db.collection("users");
    const commentsCollection = db.collection("comments");

    // ── Routes ─────────────────────────────────────────────────
    app.use("/api/ideas",    ideaRoutes(ideasCollection));
    app.use("/api/auth",     authRoutes(usersCollection));
    app.use("/api/comments", commentRoutes(commentsCollection , ideasCollection)); // ✅ Uncommented and fixed

    // Health check
    app.get("/", (req, res) => {
      res.json({ message: "🚀 IdeaVault API is running!", status: "OK" });
    });

    // 404
    app.use((req, res) => {
      res.status(404).json({ message: "Route not found" });
    });

    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

run();