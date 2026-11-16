const express = require("express");
const router = express.Router();
const Friendship = require("../Model/Friendship");
const User = require("../Model/User");
const Notification = require("../Model/Notification");
const { requireAuth } = require("../middleware/auth");

// POST /api/friends/request — send friend request
router.post("/request", requireAuth, async (req, res) => {
  try {
    const { receiverEmail } = req.body;
    if (!receiverEmail) {
      return res.status(400).json({ error: "Receiver email is required." });
    }

    const receiver = await User.findOne({ email: receiverEmail });
    if (!receiver) {
      return res.status(404).json({ error: "User not found." });
    }

    if (receiver._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You cannot send a friend request to yourself." });
    }

    // Check if already friends or request pending
    const existing = await Friendship.findOne({
      $or: [
        { sender: req.user._id, receiver: receiver._id },
        { sender: receiver._id, receiver: req.user._id },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ error: "You are already friends." });
      }
      if (existing.status === "pending") {
        return res
          .status(400)
          .json({ error: "Friend request already pending." });
      }
    }

    const friendship = await Friendship.create({
      sender: req.user._id,
      receiver: receiver._id,
    });

    await Notification.create({
      toUser: receiver._id,
      fromUser: req.user._id,
      type: "friend_request",
      message: `${req.user.name} sent you a friend request.`,
    });

    return res
      .status(201)
      .json({ message: "Friend request sent!", friendship });
  } catch (err) {
    console.error("Friend request error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/friends/respond — accept or reject
router.post("/respond", requireAuth, async (req, res) => {
  try {
    const { friendshipId, action } = req.body; // action: 'accept' | 'reject'
    if (!friendshipId || !action) {
      return res.status(400).json({ error: "friendshipId and action required." });
    }

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ error: "Friend request not found." });
    }

    if (friendship.receiver.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "You can only respond to requests sent to you." });
    }

    if (friendship.status !== "pending") {
      return res
        .status(400)
        .json({ error: "This request is already responded to." });
    }

    if (action === "accept") {
      friendship.status = "accepted";
      await friendship.save();
      return res.json({ message: "Friend request accepted!", friendship });
    } else if (action === "reject") {
      friendship.status = "rejected";
      await friendship.save();
      return res.json({ message: "Friend request rejected." });
    } else {
      return res.status(400).json({ error: "Action must be accept or reject." });
    }
  } catch (err) {
    console.error("Respond friend request error:", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/friends/list — my accepted friends
router.get("/list", requireAuth, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      status: "accepted",
    })
      .populate("sender", "name photo email")
      .populate("receiver", "name photo email");

    const friends = friendships.map((f) => {
      return f.sender._id.toString() === req.user._id.toString()
        ? f.receiver
        : f.sender;
    });

    return res.json({ friends, count: friends.length });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/friends/pending — incoming pending requests
router.get("/pending", requireAuth, async (req, res) => {
  try {
    const requests = await Friendship.find({
      receiver: req.user._id,
      status: "pending",
    }).populate("sender", "name photo email");

    return res.json({ requests });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/friends/sent — my sent pending requests
router.get("/sent", requireAuth, async (req, res) => {
  try {
    const requests = await Friendship.find({
      sender: req.user._id,
      status: "pending",
    }).populate("receiver", "name photo email");

    return res.json({ requests });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/friends/:friendshipId — remove friend or cancel request
router.delete("/:friendshipId", requireAuth, async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);
    if (!friendship) {
      return res.status(404).json({ error: "Not found." });
    }

    const isParty =
      friendship.sender.toString() === req.user._id.toString() ||
      friendship.receiver.toString() === req.user._id.toString();

    if (!isParty) {
      return res.status(403).json({ error: "Not authorized." });
    }

    await friendship.deleteOne();
    return res.json({ message: "Removed." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/friends/users/search?q= — search users to add
router.get("/users/search", requireAuth, async (req, res) => {
  try {
    const q = req.query.q || "";
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    })
      .select("name photo email")
      .limit(20);

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
