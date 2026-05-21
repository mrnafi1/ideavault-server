const express  = require("express");
const { ObjectId } = require("mongodb");
const verifyToken  = require("../middleware/verifyToken");

const ideaRoutes = (ideasCollection) => {
  const router = express.Router();

  // GET /api/ideas/trending — top 6 (by latest, Phase 7 upgrades to real algorithm)
  router.get("/trending", async (req, res) => {
    try {
      const ideas = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();
      res.json(ideas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending ideas", error: error.message });
    }
  });

  // GET /api/ideas — all ideas (search & filter added in Phase 4)
  router.get("/", async (req, res) => {
    try {
      const ideas = await ideasCollection
        .find()
        .sort({ createdAt: -1 })
        .toArray();
      res.json(ideas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ideas", error: error.message });
    }
  });

  // GET /api/ideas/:id — single idea
  router.get("/:id", async (req, res) => {
    try {
      const idea = await ideasCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      if (!idea) return res.status(404).json({ message: "Idea not found" });
      res.json(idea);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch idea", error: error.message });
    }
  });

  // POST /api/ideas — create idea (protected)
  router.post("/", verifyToken, async (req, res) => {
    try {
      const idea = {
        ...req.body,
        authorEmail: req.user.email,
        createdAt:   new Date(),
        updatedAt:   new Date(),
      };
      const result = await ideasCollection.insertOne(idea);
      res.status(201).json({ message: "Idea created!", insertedId: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: "Failed to create idea", error: error.message });
    }
  });

  // PUT /api/ideas/:id — update idea (protected, own only)
  router.put("/:id", verifyToken, async (req, res) => {
    try {
      const updated = { ...req.body, updatedAt: new Date() };
      delete updated._id;

      const result = await ideasCollection.updateOne(
        { _id: new ObjectId(req.params.id), authorEmail: req.user.email },
        { $set: updated }
      );

      if (result.matchedCount === 0) {
        return res.status(403).json({ message: "Not authorized or idea not found" });
      }
      res.json({ message: "Idea updated!" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update idea", error: error.message });
    }
  });

  // DELETE /api/ideas/:id — delete idea (protected, own only)
  router.delete("/:id", verifyToken, async (req, res) => {
    try {
      const result = await ideasCollection.deleteOne({
        _id: new ObjectId(req.params.id),
        authorEmail: req.user.email,
      });

      if (result.deletedCount === 0) {
        return res.status(403).json({ message: "Not authorized or idea not found" });
      }
      res.json({ message: "Idea deleted!" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete idea", error: error.message });
    }
  });

  return router;
};

module.exports = ideaRoutes;
