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
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

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
    post: postId,
  });
});

app.get("/docs", (req, res) => {
  return res.render("docs");
});

app.get("/demo", (req, res) => {
  const redirectLocation = Buffer.from(`${baseUrl}/demo/handle`).toString(
    "base64",
  );
  res.redirect(`${baseUrl}/auth?redirect=${redirectLocation}&name=demo`);
});

app.get("/demo/handle", async (req, res) => {
  const { priv } = req.query;
  const { data } = await axios.get(`${baseUrl}/api/verifyToken?priv=${priv}`);
  // Make sure that the redirect location is ours, so malicious actors don't trick users into authenticating.
  if(data.redirect != `${baseUrl}/demo/handle`) {
    return res.json({ error: true, info: "Redirect URL doesn't match!" });
  }

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
  const obj = d.find((x) => x.priv === priv);
  if (!obj || obj.username == null) {
    return res.json({ error: true, info: "invalid token." });
  }
  const username = obj.username;
  d = d.filter((x) => x.username !== username);
  res.json({ error: false, info: "ok", username, redirect: obj.redirect });
});

app.get("/api/getCodes", async (req, res) => {
  const { redirect } = req.query;
  if(!redirect) {
    res.status(400).json({ error: true, info: "provide ?redirect=url" });
  }
  const { pub, priv } = await genBothCodes();
  d.push({ pub, priv, name: null, redirect, });
  res.json({ pub, priv, redirect });
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
