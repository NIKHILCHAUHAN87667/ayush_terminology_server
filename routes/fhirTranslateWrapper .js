// fhirTranslateWrapper.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

const INTERNAL_BASE = process.env.INTERNAL_BASE || "http://localhost:3000";

const NAMASTE_SYSTEM = "https://purl.org/ayush/namaste";
const ICD_TM2_SYSTEM = "http://id.who.int/icd11/tm2";
const ICD11_SYSTEM = "http://id.who.int/icd/release/11";

router.post("/$translate", async (req, res) => {
  try {
    const body = req.body || {};
    console.log(body)

    if (body.resourceType !== "Parameters" || !Array.isArray(body.parameter)) {
      return res.status(400).json({
        resourceType: "OperationOutcome",
        issue: [{
          severity: "error",
          code: "invalid",
          details: { text: "Expected FHIR Parameters" }
        }]
      });
    }

    const getParam = (name) => body.parameter.find(p => p.name === name);

    const code   = getParam("code")?.valueString;
    const system = getParam("system")?.valueUri;
    const target = getParam("targetSystem")?.valueUri;
    const reverse = getParam("reverse")?.valueBoolean || false;

    if (!code || !system) {
      return res.status(400).json({
        resourceType: "OperationOutcome",
        issue: [{
          severity: "error",
          code: "required",
          details: { text: "code + system are required" }
        }]
      });
    }

    // Decide direction
    let direction = null;

    if (reverse || target === NAMASTE_SYSTEM) {
      direction = "to-namaste";
    } else if (target === ICD_TM2_SYSTEM || system === NAMASTE_SYSTEM) {
      direction = "to-icdtm2";
    } 
    else if (target === ICD11_SYSTEM || system === ICD11_SYSTEM) {
      direction = "to-icd11";
    }
    else {
      return res.status(400).json({
        resourceType: "OperationOutcome",
        issue: [{
          severity: "error",
          code: "not-supported",
          details: { text: "Unsupported translation direction" }
        }]
      });
    }
    console.log(direction);
    console.log(code)
    // Call internal microservice API

    // Use incoming Authorization header if present, otherwise fall back to env token
    const incomingAuth = req.headers.authorization;
    const fallbackToken = process.env.INTERNAL_BEARER || process.env.INTERNAL_TOKEN;
    const authHeader = incomingAuth || (fallbackToken ? `Bearer ${fallbackToken}` : undefined);

    const axiosConfig = authHeader ? { headers: { Authorization: authHeader } } : {};

    // Build request body per direction (to-icd11 needs the source system as well)
    let requestBody = { code };
    if (direction === "to-icd11") {
      requestBody.system = system;
    }

    const response = await axios.post(`${INTERNAL_BASE}/api/translate/${direction}`, requestBody, axiosConfig);
    const data = response.data;

    // normalize results
    const matches = (data.mappedTo || []).map(m => {
      const codeOut =
        m.code || m.namasteCode || m.targetCode || null;

      const displayOut =
        m.display || m.namasteDisplay || m.targetDisplay || null;

      // choose output system per direction
      const outSystem =
        direction === "to-icdtm2" ? ICD_TM2_SYSTEM :
        direction === "to-icd11" ? ICD11_SYSTEM :
        NAMASTE_SYSTEM;

      return {
        name: "match",
        part: [
          { name: "equivalence", valueCode: m.equivalence || "related" },
          {
            name: "concept",
            valueCoding: {
              system: outSystem,
              code: codeOut,
              display: displayOut
            }
          },
          m.confidence ? { name: "confidence", valueDecimal: m.confidence } : null,
          m.comment ? { name: "comment", valueString: m.comment } : null
        ].filter(Boolean)
      };
    });

    return res.json({
      resourceType: "Parameters",
      parameter: [
        { name: "result", valueBoolean: matches.length > 0 },
        ...matches
      ]
    });

  } catch (err) {
    console.error("FHIR $translate error:", err);
    return res.status(500).json({
      resourceType: "OperationOutcome",
      issue: [{
        severity: "error",
        code: "exception",
        details: { text: "Server error in $translate" }
      }]
    });
  }
});

module.exports = router;
