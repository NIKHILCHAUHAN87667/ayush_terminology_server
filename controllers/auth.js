const axios = require("axios");
const qs = require("querystring");
const dotenv = require("dotenv");
dotenv.config();

const TOKEN_URL = process.env.TOKEN_URL;
const CLIENT_ID = process.env.ICD_CLIENT_ID;
const CLIENT_SECRET = process.env.ICD_CLIENT_SECRET;
const SCOPE = process.env.ICD_SCOPE || "icdapi_access";

let cache = {
  token: null,
  expiresAt: 0
};

async function getToken() {
  if (!TOKEN_URL || !CLIENT_ID || !CLIENT_SECRET) {
    console.error("getToken: missing TOKEN_URL / CLIENT_ID / CLIENT_SECRET env vars");
    return null;
  }

  // return cached token if still valid (with 60s safety margin)
  if (cache.token && Date.now() < cache.expiresAt - 60_000) {
    return cache.token;
  }

  try {
    const body = qs.stringify({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: SCOPE
    });

    const resp = await axios.post(TOKEN_URL, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 10000
    });

    if (!resp.data || !resp.data.access_token) {
      console.error("getToken: token response missing access_token", resp.data);
      return null;
    }

    const token = resp.data.access_token;
    const expiresIn = Number(resp.data.expires_in) || 3600;
    cache.token = token;
    cache.expiresAt = Date.now() + expiresIn * 1000;

    return token;
  } catch (err) {
    // useful debug info
    console.error("getToken error:", err.response?.status, err.response?.data || err.message);
    return null;
  }
}

module.exports = { getToken };