import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { genBothCodes } from "./util/code";

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

const port = process.env.PORT || 3000;
const authUser = process.env.USER || "bear";
const postId = process.env.AUTH_POST || "691e6f2721772c0378d6897b";

// Storing in memory... bad idea.......
let d = [];

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/auth", (req, res) => {
  const { redirect, name } = req.query;

  if (!redirect || !name) {
    return res.redirect(302, "/");
  }

  res.render("auth", {
    redirect,
    appName: name,
    post: `https://wasteof.money/posts/${postId}`,
  });
});

app.get("/demo", (req, res) => {
  const redirectLocation = new Buffer(
    `http://${req.hostname}:${port}/demo/handle`,
  ).toString("base64");
  res.redirect(
    `http://${req.hostname}:${port}/auth?redirect=${redirectLocation}&name=demo`,
  );
});

app.get("/demo/handle", async (req, res) => {
  const { priv } = req.query;
  const { data } = await axios.get(
    `http://${req.hostname}:${port}/api/verifyToken?priv=${priv}`,
  );
  if (data.error) {
    return res.json({ error: true, info: data.info });
  } else {
    return res.json({
      error: false,
      info: "it worked!",
      username: data.username,
    });
  }
});

app.get("/api/verifyToken", async (req, res) => {
  const { priv } = req.query;
  if (!priv) {
    return res.json({ error: true, info: "provide ?priv=key" });
  }
  const obj = d.find((x) => (x.priv = priv));
  if (obj.username == null) {
    return res.json({ error: true, info: "invalid token." });
  }
  const username = obj.username;
  d = d.filter((x) => x.username !== username);
  res.json({ error: false, info: "ok", username });
});

app.get("/api/getCodes", async (req, res) => {
  const { pub, priv } = await genBothCodes();
  d.push({ pub, priv, name: null });
  res.json({ pub, priv });
});

app.get("/api/done", async (req, res) => {
  const { pub } = req.query;
  if (!pub) {
    return res.json({ error: true, info: "provide ?pub=key" });
  }
  const { data } = await axios.get(
    `https://api.wasteof.money/posts/${postId}/comments`,
  );
  const latestComment = data.comments[0];
  const content = latestComment.content;
  if (content == `<p>${pub}</p>`) {
    const username = latestComment.poster.name;
    const obj = d.find((x) => x.pub === pub);
    if (!obj) {
      res.json({ error: true, info: "invalid" });
    }
    obj.username = username;
    return res.json({ error: false, info: "it worked!" });
  } else {
    return res.json({ error: true, info: "not found" });
  }
});

app.listen(port, () => {
  console.log(`listening on http://0.0.0.0:${port}`);
});
