const express = require("express");
const { MongoClient } = require("mongodb");
const router = express.Router();
require('dotenv').config()

const app = express();
app.use(express.json());


const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "ayushsetu";

let db;

// Utility to escape regex injection
function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Connect to MongoDB
async function initDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log("Connected to MongoDB:", DB_NAME);
}
initDB();

/**
 * Generic autocomplete function
 */
async function autocomplete(collectionName, query, limit = 20) {
  if (!query) return [];

  try {
    const pipeline = [
      {
        $search: {
          index: "default",   // your Atlas Search index name
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: "concept.display",
                  tokenOrder: "sequential"
                }
              },
              {
                autocomplete: {
                  query,
                  path: "concept.code",
                  tokenOrder: "sequential"
                }
              },
              {
                autocomplete: {
                  query,
                  path: "concept.definition",
                  tokenOrder: "sequential"
                }
              }
            ],
            minimumShouldMatch: 1
          }
        }
      },

      // unwind FHIR concept array
      { $unwind: "$concept" },

      // Filter again after unwind (because search may match nested docs)
      {
        $match: {
          $or: [
            { "concept.code": { $regex: query, $options: "i" } },
            { "concept.display": { $regex: query, $options: "i" } },
            { "concept.definition": { $regex: query, $options: "i" } }
          ]
        }
      },

      // Final projection
      {
        $project: {
          _id: 0,
          code: "$concept.code",
          display: "$concept.display",
          definition: "$concept.definition",
          score: { $meta: "searchScore" }
        }
      },

      { $limit: limit },
    ];

    return await db.collection(collectionName).aggregate(pipeline).toArray();

  } catch (err) {
    console.error("⚠ Autocomplete search error:", err);
    return [];
  }
}


/**
 * 1️⃣  /lookup/namaste
 *     Autocomplete NAMASTE codes
 */
router.get("/namaste", async (req, res) => {
  const q = (req.query.q || "").trim();
  const limit = parseInt(req.query.limit || "20");

  if (!q) return res.json({ results: [] });

  const results = await autocomplete("NAMASTE_FHIR_CODESYSTEM", q, limit);
  return res.json({ results });
});

/**
 * 2️⃣  /lookup/ICD_TM2
 *     Autocomplete ICD_TM2 codes
 */
router.get("/icdtm2", async (req, res) => {
  const q = (req.query.q || "").trim();
  const limit = parseInt(req.query.limit || "20");

  if (!q) return res.json({ results: [] });

  const results = await autocomplete("ICDTM2_FHIR_CODESYSTEM", q, limit);
  console.log(results);
  return res.json({ results });
});
module.exports = router;

