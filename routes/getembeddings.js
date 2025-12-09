// get_embedding_simple.js
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGO_URI_2;
const DB_NAME = 'ayushsetu';
const COLLECTION_NAME = 'NAMASTE_FHIR_CODESYSTEM'; // Your vector collection name

/**
 * Simple function to get embedding for a code
 * Assumes there's a vector collection with the structure matching your config
 * 
 * @param {string} code - The concept code (e.g., "SL20")
 * @returns {Array|null} Embedding array or null if not found
 */
async function getEmbeddingForCode(code) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Direct query - find the document with matching code
    const result = await collection.findOne(
      { code: code },
      { 
        projection: { 
          embedding: 1, 
          code: 1, 
          display: 1,
          system: 1
        } 
      }
    );
    
    if (!result) {
      console.log(`Code "${code}" not found in collection`);
      return null;
    }
    
    if (!result.embedding || !Array.isArray(result.embedding)) {
      console.log(`No embedding found for code "${code}"`);
      return null;
    }
    
    // Return just the embedding array
    return result.embedding;
    
  } catch (error) {
    console.error('Error fetching embedding:', error);
    throw error;
  } finally {
    await client.close();
  }
}

/**
 * Get embedding with full concept information
 * 
 * @param {string} code - The concept code
 * @returns {Object|null} Full concept object with embedding
 */
async function getConceptWithEmbedding(code) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    const result = await collection.findOne(
      { code: code },
      { 
        projection: { 
          _id: 0, // Exclude MongoDB ID
          embedding: 1,
          code: 1,
          display: 1,
          definition: 1,
          system: 1,
          resourceType: 1,
          status: 1
        } 
      }
    );
    
    return result;
    
  } finally {
    await client.close();
  }
}

/**
 * Batch get embeddings for multiple codes
 * 
 * @param {string[]} codes - Array of codes
 * @returns {Object} Object with embeddings keyed by code
 */
async function getEmbeddingsForCodes(codes) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Find all documents with matching codes
    const cursor = collection.find(
      { code: { $in: codes } },
      { 
        projection: { 
          embedding: 1, 
          code: 1 
        } 
      }
    );
    
    const results = {};
    const foundCodes = new Set();
    
    await cursor.forEach(doc => {
      if (doc.embedding && Array.isArray(doc.embedding)) {
        results[doc.code] = doc.embedding;
        foundCodes.add(doc.code);
      }
    });
    
    // Check for missing codes
    const missingCodes = codes.filter(code => !foundCodes.has(code));
    if (missingCodes.length > 0) {
      console.log(`Missing embeddings for codes: ${missingCodes.join(', ')}`);
    }
    
    return {
      embeddings: results,
      found: Array.from(foundCodes),
      missing: missingCodes
    };
    
  } finally {
    await client.close();
  }
}

// Example usage
async function example() {
  // Get just the embedding array
  const embedding = await getEmbeddingForCode('SL20');
  if (embedding) {
    console.log(`Embedding dimensions: ${embedding.length}`);
    console.log(`First 5 values: ${embedding.slice(0, 5)}`);
  }
  
  // Get full concept with embedding
  const concept = await getConceptWithEmbedding('SL20');
  if (concept) {
    console.log(`Code: ${concept.code}`);
    console.log(`Display: ${concept.display}`);
    console.log(`System: ${concept.system}`);
    console.log(`Has embedding: ${!!concept.embedding}`);
  }
  
  // Batch get
  const batchResult = await getEmbeddingsForCodes(['SL20', 'SK00', 'SM3G']);
  console.log(`Found ${batchResult.found.length} embeddings`);
  console.log(`Missing ${batchResult.missing.length} embeddings`);
}

// Export
module.exports = {
  getEmbeddingForCode,
  getConceptWithEmbedding,
  getEmbeddingsForCodes
};

// Run example if called directly
if (require.main === module) {
  example().catch(console.error);
}