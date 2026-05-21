const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");

const ideaRoutes = (ideasCollection) => {
  const router = express.Router();

  // GET /api/ideas
  router.get("/", async (req, res) => {
    try {
      const { search, category } = req.query;
      const query = {};
      if (search?.trim()) query.title = { $regex: search.trim(), $options: "i" };
      if (category && category !== "All") query.category = category;

      const ideas = await ideasCollection.find(query).sort({ createdAt: -1 }).toArray();
      res.json(ideas);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/ideas/trending
  router.get("/trending", async (req, res) => {
    try {
      const trendingIdeas = await ideasCollection.find().sort({ createdAt: -1 }).limit(6).toArray();
      res.json(trendingIdeas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trending ideas" });
    }
  });

  // [NEW Phase 6] GET /api/ideas/user/:email — Get user's own ideas
  router.get("/user/:email", verifyToken, async (req, res) => {
    const { email } = req.params;
    if (req.user.email !== email) return res.status(403).json({ message: "Forbidden" });

    try {
      const ideas = await ideasCollection.find({ authorEmail: email }).sort({ createdAt: -1 }).toArray();
      res.json(ideas);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/ideas/:id
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const idea = await ideasCollection.findOne({ _id: new ObjectId(id) });
      if (!idea) return res.status(404).json({ message: "Idea not found" });
      res.json(idea);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch idea" });
    }
  });

  // POST /api/ideas
  router.post("/", verifyToken, async (req, res) => {
    try {
      const newIdea = { ...req.body, authorEmail: req.user.email, createdAt: new Date(), updatedAt: new Date() };
      const result = await ideasCollection.insertOne(newIdea);
      res.status(201).json({ message: "Idea created!", insertedId: result.insertedId });
    } catch (error) {
      res.status(500).json({ message: "Failed to create idea" });
    }
  });

  // PUT /api/ideas/:id
  router.put("/:id", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedFields = { ...req.body, updatedAt: new Date() };
      delete updatedFields._id;

      const result = await ideasCollection.updateOne(
        { _id: new ObjectId(id), authorEmail: req.user.email },
        { $set: updatedFields }
      );
      if (result.matchedCount === 0) return res.status(403).json({ message: "Not authorized" });
      res.json({ message: "Idea updated successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update idea" });
    }
  });

  // DELETE /api/ideas/:id
  router.delete("/:id", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await ideasCollection.deleteOne({ _id: new ObjectId(id), authorEmail: req.user.email });
      if (result.deletedCount === 0) return res.status(403).json({ message: "Not authorized" });
      res.json({ message: "Idea deleted successfully!" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete idea" });
    }
  });

  return router;
};

module.exports = ideaRoutes;