const mongoose = require("mongoose");

const analyticsMeta = new mongoose.Schema({
  workspace: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  value: 
    {
      type: Object,
      required: false,
    },
});

module.exports = mongoose.model("AnalyticsMeta", analyticsMeta);
