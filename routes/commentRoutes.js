const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middleware/verifyToken");

const commentRoutes = (commentsCollection, ideasCollection) => {
  const router = express.Router();

  // [NEW Phase 6] GET /api/comments/user/:email — Get user's interactions
  router.get("/user/:email", verifyToken, async (req, res) => {
    const { email } = req.params;

    if (req.user.email !== email) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const userComments = await commentsCollection
        .find({ userEmail: email })
        .sort({ createdAt: -1 })
        .toArray();

      if (userComments.length === 0) {
        return res.json([]);
      }

      const ideaIds = [...new Set(userComments.map((c) => c.ideaId.toString()))];

      const ideas = await ideasCollection
        .find({ _id: { $in: ideaIds.map((id) => new ObjectId(id)) } })
        .toArray();

      const ideaMap = {};
      ideas.forEach((idea) => {
        ideaMap[idea._id.toString()] = idea;
      });

      const grouped = {};
      userComments.forEach((comment) => {
        const key = comment.ideaId.toString();
        if (!grouped[key]) {
          grouped[key] = { idea: ideaMap[key] || null, comments: [] };
        }
        grouped[key].comments.push(comment);
      });

      const result = Object.values(grouped);
      res.json(result);
    } catch (err) {
      console.error("Error fetching user interactions:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // GET /api/comments/:ideaId — Get all comments for an idea
  router.get("/:ideaId", async (req, res) => {
    try {
      const { ideaId } = req.params;
      const comments = await commentsCollection
        .find({ ideaId })
        .sort({ createdAt: -1 })
        .toArray();
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments", error: error.message });
    }
  });

  // POST /api/comments — Add a new comment
  router.post("/", verifyToken, async (req, res) => {
    try {
      const { ideaId, commentText, userName, userEmail, userPhoto } = req.body;
      if (!ideaId || !commentText?.trim()) return res.status(400).json({ message: "Required fields missing" });

      const newComment = {
        ideaId,
        commentText: commentText.trim(),
        userName: userName || "Anonymous",
        userEmail: req.user.email,
        userPhoto: userPhoto || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await commentsCollection.insertOne(newComment);
      const insertedComment = await commentsCollection.findOne({ _id: result.insertedId });
      res.status(201).json(insertedComment);
    } catch (error) {
      res.status(500).json({ message: "Failed to post comment", error: error.message });
    }
  });

  // PUT /api/comments/:id — Update own comment
  router.put("/:id", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { commentText } = req.body;
      if (!commentText?.trim()) return res.status(400).json({ message: "Empty comment" });

      const result = await commentsCollection.findOneAndUpdate(
        { _id: new ObjectId(id), userEmail: req.user.email },
        { $set: { commentText: commentText.trim(), updatedAt: new Date() } },
        { returnDocument: "after" }
      );
      if (!result.value) return res.status(403).json({ message: "Not authorized" });
      res.json(result.value);
    } catch (error) {
      res.status(500).json({ message: "Failed to update comment", error: error.message });
    }
  });

  // DELETE /api/comments/:id — Delete own comment
  router.delete("/:id", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await commentsCollection.deleteOne({ _id: new ObjectId(id), userEmail: req.user.email });
      if (result.deletedCount === 0) return res.status(403).json({ message: "Not authorized" });
      res.json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment", error: error.message });
    }
  });

  return router;
};

module.exports = commentRoutes;