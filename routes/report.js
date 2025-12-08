
const express = require("express");
const { MongoClient } = require("mongodb");
const router = express.Router();

/**
 * Helpers
 */
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

const normalizeMappingConfidence = (v) => {
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
};

const normalizeTimestamp = (t) => {
  if (!t) return new Date();
  const d = new Date(t);
  return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * POST /api/report
 */
router.post("/", async (req, res) => {
  let client;

  try {
    const body = req.body || {};

    // Required validations
    const required = ["sourceCode", "problemCode", "reportText", "reportedBy"];
    const errors = [];

    required.forEach((k) => {
      if (!isNonEmptyString(body[k])) {
        errors.push({ field: k, message: `${k} is required and must be a non-empty string` });
      }
    });

    if (errors.length) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors
      });
    }

    // Normalize
    const cleaned = {
      sourceCode: body.sourceCode.trim(),
      problemCode: body.problemCode.trim(),
      reportText: body.reportText.trim(),
      reportedBy: body.reportedBy.trim(),
      mappingConfidence: normalizeMappingConfidence(body.mappingConfidence),
      timestamp: normalizeTimestamp(body.timestamp),
      meta: body.meta && typeof body.meta === "object" ? body.meta : undefined
    };

    // CONNECT TO MONGO (no deprecated options)
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();

    const db = client.db(process.env.MONGO_DBNAME || "ayushsetu");
    const coll = db.collection("REPORT_REQUESTS");

    const insertDoc = {
      ...cleaned,
      createdAt: new Date()
    };

    const result = await coll.insertOne(insertDoc);

    return res.status(201).json({
      success: true,
      message: "Report stored successfully",
      id: result.insertedId,
      data: {
        sourceCode: insertDoc.sourceCode,
        problemCode: insertDoc.problemCode,
        reportedBy: insertDoc.reportedBy,
        mappingConfidence: insertDoc.mappingConfidence,
        timestamp: insertDoc.timestamp,
        createdAt: insertDoc.createdAt
      }
    });
  } catch (err) {
    console.error("Error in /report:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: err.message
    });
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (e) {
        console.warn("Mongo close failed", e);
      }
    }
  }
});

module.exports = router;
