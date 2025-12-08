// fhirExpandWrapper.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

// Map FHIR CodeSystem URIs → your internal endpoints
const SYSTEM_MAP = {
  "https://purl.org/ayush/namaste": "/expand/namaste",
  "http://id.who.int/icd/release/11/tm2": "/expand/icdtm2",
  "http://id.who.int/icd/release/11/mms": "/expand/biomed"
  // add WITA later →
  // "https://purl.org/ayush/wita": "/expand/wita"
};

const INTERNAL_BASE = "http://localhost:3000/api"; // adjust for production

router.get("/$expand", async (req, res) => {
  try {
    const system = req.query.system;
    const filter = req.query.filter || "";
    const count = req.query.count || 20;

    if (!system)
      return res.status(400).json({
        resourceType: "OperationOutcome",
        issue: [{
          severity: "error",
          code: "required",
          details: { text: "`system` query param required" }
        }]
      });

    const endpoint = SYSTEM_MAP[system];

    if (!endpoint)
      return res.status(400).json({
        resourceType: "OperationOutcome",
        issue: [{
          severity: "error",
          code: "not-supported",
          details: { text: `Unsupported CodeSystem: ${system}` }
        }]
      });

    // Call your internal autocomplete API
     const incomingAuth = req.headers.authorization;
    const fallbackToken = process.env.INTERNAL_BEARER || process.env.INTERNAL_TOKEN;
    const authHeader = incomingAuth || (fallbackToken ? `Bearer ${fallbackToken}` : undefined);

    const axiosConfig = {
      params: { q: filter, limit: count },
      ...(authHeader ? { headers: { Authorization: authHeader } } : {})
    };
    const resp = await axios.get(
      `${INTERNAL_BASE}${endpoint}`,
      axiosConfig
    );

    const items = resp.data.results || [];

    // Convert to FHIR ValueSet.expansion
    res.json({
      resourceType: "ValueSet",
      status: "active",
      expansion: {
        total: items.length,
        offset: 0,
        contains: items.map(i => ({
          system,
          code: i.code,
          display: i.display,
          definition: i.definition
        }))
      }
    });

  } catch (err) {
    console.error("FHIR $expand error:", err?.response?.data || err);
    return res.status(500).json({
      resourceType: "OperationOutcome",
      issue: [{
        severity: "error",
        code: "exception",
        details: { text: "Server error in $expand" }
      }]
    });
  }
});

module.exports = router;
