const axios = require("axios").default;
const path = require("path");
const fs = require("fs");
const setPic = require("./getPic");
const genIndex = require("./genIndex");
const {
  generateMarkupLocal,
  generateMarkupRemote,
} = require("./generateMarkup");

require("dotenv").config();

if (!process.env.NAME) throw new Error("Please specify NAME in environment.");

const picPath = process.env.PIC;
const defaultPicPath = path.join(__dirname, "../local/sample-pic.jpeg");
const msgPath = process.env.SCROLL_MSG;
const defaultMsgPath = path.join(__dirname, "../local/scroll-msg.txt");

//Local initialization
const setLocalData = async () => {
  try {
    const pic = path.join(__dirname, "../local/", picPath);
    let markup = "";
    if (msgPath) {
      const text = fs.readFileSync(path.join(__dirname, "../local/", msgPath), {
        encoding: "utf-8",
      });
      markup = generateMarkupLocal(text);
    }
    await setPic(pic);
    genIndex(markup);
  } catch (e) {
    throw new Error(e.message);
  }
};

//Remote initialization
const setRemoteData = async () => {
  try {
    let pic;
    if (picPath) {
      const res = await axios.get(picPath, {
        responseType: "arraybuffer",
      });
      pic = res.data;
    } else {
      pic = fs.readFileSync(defaultPicPath);
    }
    let markup = "";
    if (msgPath) {
      const article = msgPath.split("/").pop();
      const res = await axios.get(
        `https://api.telegra.ph/getPage/${article}?return_content=true`
      );
      const { content } = res.data.result;
      markup = content.reduce(
        (string, node) => string + generateMarkupRemote(node),
        ""
      );
    } else {
      const text = fs.readFileSync(defaultMsgPath, { encoding: "utf-8" });
      markup = generateMarkupLocal(text);
    }
    await setPic(pic);
    genIndex(markup);
  } catch (e) {
    throw new Error(e.message);
  }
};

if (process.argv[2] === "--local") setLocalData();
else if (process.argv[2] === "--remote") setRemoteData();
else console.log("Fetch mode not specified.");
