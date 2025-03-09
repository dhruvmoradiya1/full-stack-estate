import Post from "../models/Post.js";
import PostDetail from "../models/PostDetail.js";
import User from "../models/User.js";
import SavedPost from "../models/SavedPost.js";
import jwt from "jsonwebtoken";

export const getPosts = async (req, res) => {
  const query = req.query;

  try {
    const posts = await Post.find({
      city: query.city || undefined,
      type: query.type || undefined,
      property: query.property || undefined,
      bedroom: parseInt(query.bedroom) || undefined,
      price: {
        $gte: parseInt(query.minPrice) || undefined,
        $lte: parseInt(query.maxPrice) || undefined,
      },
    });

    res.status(200).json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get posts" });
  }
};

export const getPost = async (req, res) => {
  const id = req.params.id;
  try {
    const post = await Post.findById(id).populate({
      path: "postDetail",
      populate: {
        path: "user",
        select: "username avatar",
      },
    });

    const token = req.cookies?.token;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, payload) => {
        if (!err) {
          const saved = await SavedPost.findOne({
            postId: id,
            userId: payload.id,
          });
          res.status(200).json({ ...post.toObject(), isSaved: saved ? true : false });
        }
      });
    } else {
      res.status(200).json({ ...post.toObject(), isSaved: false });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get post" });
  }
};

export const addPost = async (req, res) => {
  const body = req.body;
  const tokenUserId = req.userId;

  try {
    const newPost = new Post({
      ...body.postData,
      userId: tokenUserId,
    });

    const postDetail = new PostDetail({
      ...body.postDetail,
      postId: newPost._id,
    });

    newPost.postDetail = postDetail._id;

    await newPost.save();
    await postDetail.save();

    res.status(200).json(newPost);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const updatePost = async (req, res) => {
  try {
    res.status(200).json();
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to update posts" });
  }
};

export const deletePost = async (req, res) => {
  const id = req.params.id;
  const tokenUserId = req.userId;

  try {
    const post = await Post.findById(id);

    if (post.userId.toString() !== tokenUserId) {
      return res.status(403).json({ message: "Not Authorized!" });
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};
