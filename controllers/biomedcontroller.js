const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
const getToken = require("./auth").getToken;

async function searchBiomedICD(req, res) {
  try {
    const query = (req.body && req.body.q) || (req.query && req.query.q);
    if (!query) {
      return res.status(400).json({ error: "Missing 'q' parameter in request body or query string" });
    }

    const WHO_API_TOKEN = await getToken();
    if (!WHO_API_TOKEN) {
      return res.status(500).json({ error: "Failed to obtain WHO API token" });
    }

    const response = await axios.post(
      "https://id.who.int/icd/release/11/2025-01/mms/search",
      null,
      {
        params: {
          q: query,
          subtreeFilterUsesFoundationDescendants: "false",
          includeKeywordResult: "false",
          chapterFilter: "01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25",
          useFlexisearch: "false",
          flatResults: "true",
          highlightingEnabled: "true",
          medicalCodingMode: "false"
        },
        headers: {
          "Authorization": `Bearer ${WHO_API_TOKEN}`,
          "Accept": "application/json",
          "API-Version": "v2",
          "Accept-Language": "en"
        }
      }
    );

    const cleanedResults = response.data.destinationEntities.map(normalizeBiomedEntity);

    return res.json({
    query: query,
    count: cleanedResults.length,
    results: cleanedResults
    });

  } catch (err) {
    console.error("Biomed Search Error", err);
    // if axios returned a response, include its status/text for debugging
    if (err.response) {
      return res.status(err.response.status || 500).json({ error: err.response.data || "WHO API search failed" });
    }
    res.status(500).json({ error: "WHO API search failed" });
  }
}

function stripHtml(str = "") {
  return str.replace(/<[^>]+>/g, "").trim();
}

function normalizeBiomedEntity(entity) {
  const synonyms = entity.matchingPVs
    ?.filter(pv => pv.propertyId === "Synonym" || pv.propertyId === "Title")
    ?.map(pv => stripHtml(pv.label))
    ?? [];

  return {
    code: entity.theCode || null,
    title: stripHtml(entity.title),
    chapter: entity.chapter,
    isLeaf: entity.isLeaf,
    score: entity.score,
    synonyms
  };
}





module.exports = searchBiomedICD;
