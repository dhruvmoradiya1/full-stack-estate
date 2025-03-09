import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

export const addMessage = async (req, res) => {
  const tokenUserId = req.userId;
  const chatId = req.params.chatId;
  const text = req.body.text;

  try {
    const chat = await Chat.findOne({
      _id: chatId,
      userIDs: {
        $in: [tokenUserId],
      },
    });

    if (!chat) return res.status(404).json({ message: "Chat not found!" });

    const message = new Message({
      text,
      chatId,
      userId: tokenUserId,
    });

    await message.save();

    chat.seenBy.push(tokenUserId);
    chat.lastMessage = text;
    await chat.save();

    res.status(200).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to add message!" });
  }
};
