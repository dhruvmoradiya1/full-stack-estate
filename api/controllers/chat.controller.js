import Chat from "../models/Chat.js";
import User from "../models/User.js";

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chats = await Chat.find({
      userIDs: {
        $in: [tokenUserId],
      },
    });

    for (const chat of chats) {
      const receiverId = chat.userIDs.find((id) => id !== tokenUserId);

      const receiver = await User.findById(receiverId).select("id username avatar");
      chat.receiver = receiver;
    }

    res.status(200).json(chats);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chats!" });
  }
};

export const getChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      userIDs: {
        $in: [tokenUserId],
      },
    }).populate({
      path: "messages",
      options: { sort: { createdAt: 1 } },
    });

    chat.seenBy.push(tokenUserId);
    await chat.save();

    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};

export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  try {
    const newChat = new Chat({
      userIDs: [tokenUserId, req.body.receiverId],
    });
    await newChat.save();
    res.status(200).json(newChat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await Chat.findOneAndUpdate(
      {
        _id: req.params.id,
        userIDs: {
          $in: [tokenUserId],
        },
      },
      {
        $addToSet: { seenBy: tokenUserId },
      },
      { new: true }
    );
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};
