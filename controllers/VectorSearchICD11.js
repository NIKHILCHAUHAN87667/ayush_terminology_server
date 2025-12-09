// VectorSearch.js
require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");

// 1. Init Pinecone
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const INDEX_NAME = 'icd11';
const NAMESPACE = 'mms';



function normalize(text) {
  return (text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}




async function searchICD11(queryText, topK = 3) {
  if (!queryText) throw new Error("Query cannot be empty.");

  const index = pc.index(INDEX_NAME).namespace(NAMESPACE);

  const result = await index.searchRecords({
    query: {
      topK,
      inputs: { text: queryText }
    }
  });

  // Pinecone returns `records` not `hits`
    return result.result?.hits?.map(hit => ({
    id: hit._id,
    score: hit._score,
    text: hit.fields.chunk_text,
    category: hit.fields.category
  })) || [];

}


module.exports = {searchICD11};