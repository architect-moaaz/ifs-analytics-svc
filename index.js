const express = require("express");
const app = express();
const AnalyticsMeta = require("./models/analytics");
const helmet = require("helmet");
const cors = require("cors");
app.use(express.json());
app.use(helmet());
app.use(cors());

require("dotenv").config();
const mongoose = require("mongoose");
let dbUrl = process.env.DB_URL_TEST;
const env = process.env.NODE_ENV || "dev";
if (env.trim() === "production") {
  dbUrl = process.env.DB_URL_DEV;
} else if (env.trim() === "colo") {
  dbUrl = process.env.DB_URL_COLO;
} else if (env.trim() === "uat") {
  dbUrl = process.env.DB_URL_UAT;
}

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.post("/saveAnalyticsMeta", async (req, res) => {
  try {
    const workspace = req.headers.workspace;
    const { type, name, value } = req.body;
    const newAnalyticsMeta = new AnalyticsMeta({
      workspace,
      type,
      name,
      value,
    });
    await newAnalyticsMeta.save(newAnalyticsMeta);
    res.send(newAnalyticsMeta);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/updateAnalyticsMeta", async (req, res) => {
  try {
    const workspace = req.headers.workspace;
    const { type, name, value } = req.body;
    const setFeilds = {
      workspace: workspace,
      type: type,
      name: name,
      value: value,
    };
    const updated = await db.collection("analyticsmetas").findOneAndUpdate(
      {
        workspace: workspace,
        type: type,
        name: name,
      },
      { $set: setFeilds },
      { returnDocument: "after" }
    );
    res.json({ updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/getAnalyticsMeta", async (req, res) => {
  try {
    const options = {
      allowDiskUse: true,
    };
    let page =
      req.query.page == undefined || req.query.page <= 0
        ? 1
        : parseInt(req.query.page);
    let size =
      req.query.size == undefined || req.query.size <= 0
        ? 10
        : parseInt(req.query.size);
    page = (page - 1) * size;
    const workspace = req.headers.workspace;
    const { type, name } = req.body;
    const pipeline = [
      {
        $match: {
          workspace: workspace,
        },
      },
      {
        $project: {
          workspace: 1,
          type: 1,
          name: 1,
          value: 1,
        },
      },
    ];
    if (type && name) {
      pipeline.push({
        $match: {
          type: type,
          name: name,
        },
      });
    }
    const cursor = db
      .collection("analyticsmetas")
      .aggregate(pipeline, options)
      .skip(page)
      .limit(size);
    const result = await cursor.toArray();
    if (result.length == 0) {
      return res.status(404).json({
        message: `No data present for given filters`,
      });
    } else {
      res.send(result);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/getAnalyticsMeta", async (req, res) => {
  try {
    const workspace = req.headers.workspace;
    const { type, name } = req.body;
    const query = {
      workspace: workspace,
      type: type,
      name: name,
    };
    await db.collection("analyticsmetas").deleteOne(query);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(32703, () => console.log(`And server started on 32703`));
