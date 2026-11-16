const express = require("express");
const router = express.Router();
const Post = require("../Model/Post");
const Friendship = require("../Model/Friendship");
const Notification = require("../Model/Notification");
const { requireAuth } = require("../middleware/auth");

// Helper: get accepted friend count for a user
async function getFriendCount(userId) {
  const count = await Friendship.countDocuments({
    $or: [{ sender: userId }, { receiver: userId }],
    status: "accepted",
  });
  return count;
}

// Helper: get daily post limit based on friend count
function getDailyLimit(friendCount) {
  if (friendCount === 0) return 0;
  if (friendCount === 1) return 1;
  if (friendCount >= 2 && friendCount <= 5) return 2;
  if (friendCount >= 6 && friendCount <= 10) return 5;
  return Infinity; // more than 10 friends
}

// Helper: how many posts user made today
async function getPostsToday(userId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const count = await Post.countDocuments({
    userId,
    isDeleted: false,
    createdAt: { $gte: startOfDay },
  });
  return count;
}

// Helper: create notification
async function createNotification(toUser, fromUser, type, postId, message) {
  try {
    if (toUser.toString() === fromUser.toString()) return; // don't notify yourself
    await Notification.create({ toUser, fromUser, type, postId, message });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
}

// Extract hashtags and mentions from content
function extractTags(content) {
  const hashtags = (content.match(/#\w+/g) || []).map((h) =>
    h.toLowerCase()
  );
  const mentions = (content.match(/@\w+/g) || []).map((m) =>
    m.slice(1).toLowerCase()
  );
  return { hashtags, mentions };
}

// POST /api/posts/create
router.post("/create", requireAuth, async (req, res) => {
  try {
    const { content, mediaUrl, mediaType, privacySettings } = req.body;
    const userId = req.user._id;

    if (!content && !mediaUrl) {
      return res
        .status(400)
        .json({ error: "Post must have content or media." });
    }

    // Check friend count and daily limit
    const friendCount = await getFriendCount(userId);
    const dailyLimit = getDailyLimit(friendCount);

    if (dailyLimit === 0) {
      return res.status(403).json({
        error:
          "You need at least 1 accepted friend to create posts. Add friends to start posting!",
      });
    }

    if (dailyLimit !== Infinity) {
      const postsToday = await getPostsToday(userId);
      if (postsToday >= dailyLimit) {
        return res.status(429).json({
          error: `You have reached your daily post limit of ${dailyLimit} post(s). Add more friends to increase your limit!`,
        });
      }
    }

    // Check duplicate post (same content in last 5 minutes)
    if (content) {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
      const duplicate = await Post.findOne({
        userId,
        content,
        isDeleted: false,
        createdAt: { $gte: fiveMinAgo },
      });
      if (duplicate) {
        return res
          .status(400)
          .json({ error: "Duplicate post detected. Please wait a bit." });
      }
    }

    const { hashtags, mentions } = extractTags(content || "");

    const post = await Post.create({
      userId,
      content: content || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "text",
      privacySettings: privacySettings || "public",
      hashtags,
      mentions,
      friendCountAtPosting: friendCount,
    });

    return res.status(201).json({ message: "Post created!", post });
  } catch (err) {
    console.error("Create post error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts/feed  — friends posts first, then trending public
router.get("/feed", requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get accepted friend IDs
    const friendships = await Friendship.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "accepted",
    });
    const friendIds = friendships.map((f) =>
      f.sender.toString() === userId.toString() ? f.receiver : f.sender
    );

    // Friend posts (most recent first)
    const friendPosts = await Post.find({
      userId: { $in: friendIds },
      isDeleted: false,
      privacySettings: { $in: ["public", "friends"] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name photo email");

    // Trending public posts (most likes, exclude friends)
    const trendingPosts = await Post.find({
      userId: { $nin: [...friendIds, userId] },
      isDeleted: false,
      privacySettings: "public",
    })
      .sort({ likes: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name photo email");

    return res.json({ friendPosts, trendingPosts });
  } catch (err) {
    console.error("Feed error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts/all — all public posts
router.get("/all", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ isDeleted: false, privacySettings: "public" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name photo email");

    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts/search?q=hashtag — search by hashtag or keyword
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    const posts = await Post.find({
      isDeleted: false,
      privacySettings: "public",
      $or: [
        { content: { $regex: q, $options: "i" } },
        { hashtags: q.toLowerCase().replace("#", "") },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("userId", "name photo email");
    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts/:postId — single post
router.get("/:postId", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate("userId", "name photo email")
      .populate("comments.userId", "name photo");

    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Increment view count
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { viewCount: 1 } });

    return res.json({ post });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/posts/:postId/edit — edit post (within 30 minutes)
router.put("/:postId/edit", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your post" });
    }

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (post.createdAt < thirtyMinAgo) {
      return res
        .status(400)
        .json({ error: "You can only edit a post within 30 minutes of posting." });
    }

    const { content, privacySettings } = req.body;
    const { hashtags, mentions } = extractTags(content || "");
    post.content = content || post.content;
    post.privacySettings = privacySettings || post.privacySettings;
    post.hashtags = hashtags;
    post.mentions = mentions;
    post.isEdited = true;
    await post.save();

    return res.json({ message: "Post updated!", post });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/posts/:postId
router.delete("/:postId", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not your post" });
    }

    post.isDeleted = true;
    await post.save();
    return res.json({ message: "Post deleted." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/posts/:postId/like — toggle like
router.post("/:postId/like", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userId = req.user._id;
    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);
      await createNotification(
        post.userId,
        userId,
        "like",
        post._id,
        `${req.user.name} liked your post.`
      );
    }
    await post.save();

    return res.json({
      message: alreadyLiked ? "Unliked" : "Liked",
      likesCount: post.likes.length,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/posts/:postId/comment
router.post("/:postId/comment", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Comment cannot be empty." });
    }

    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.comments.push({ userId: req.user._id, text });
    await post.save();

    await createNotification(
      post.userId,
      req.user._id,
      "comment",
      post._id,
      `${req.user.name} commented on your post.`
    );

    return res.json({ message: "Comment added!", comments: post.comments });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/posts/:postId/share
router.post("/:postId/share", requireAuth, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    await createNotification(
      post.userId,
      req.user._id,
      "share",
      post._id,
      `${req.user.name} shared your post.`
    );

    return res.json({ message: "Shared!", shares: post.shares });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/posts/:postId/save — toggle save
router.post("/:postId/save", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userId = req.user._id;
    const alreadySaved = post.savedBy.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadySaved) {
      post.savedBy = post.savedBy.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      post.savedBy.push(userId);
    }
    await post.save();

    return res.json({ message: alreadySaved ? "Unsaved" : "Saved" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/posts/:postId/report
router.post("/:postId/report", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userId = req.user._id;
    const alreadyReported = post.reportedBy.some(
      (id) => id.toString() === userId.toString()
    );

    if (!alreadyReported) {
      post.reportedBy.push(userId);
      await post.save();
    }

    return res.json({ message: "Post reported. Thank you." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts/my/posts — my own posts
router.get("/my/posts", requireAuth, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.user._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .populate("userId", "name photo email");
    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/posts/notifications/my
router.get("/notifications/my", requireAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ toUser: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("fromUser", "name photo");
    return res.json({ notifications });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/posts/notifications/read-all
router.post("/notifications/read-all", requireAuth, async (req, res) => {
  try {
    await Notification.updateMany({ toUser: req.user._id }, { isRead: true });
    return res.json({ message: "All notifications marked as read." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
