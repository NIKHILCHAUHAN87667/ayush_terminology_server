const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const app = express();
app.use(express.json());

/**
 * Mock ABHA Payload Validator
 * abhaId: must be 14 digit unique integer
 */
function validateAbha(req, res, next) {
  const body = req.body;
  const errors = [];

  // 14 digit ABHA number validation
  if (!body.abhaId || !/^[0-9]{14}$/.test(body.abhaId)) {
    errors.push("abhaId must be a 14 digit integer");
  }

  if (!body.name || typeof body.name !== "string") {
    errors.push("name (string) is required");
  }

  if (!body.gender || !["M", "F", "O"].includes(body.gender)) {
    errors.push('gender must be "M","F","O"');
  }

  if (!body.dob || typeof body.dob !== "string") {
    errors.push("dob (YYYY-MM-DD) is required");
  }

  if (!body.mobile || !/^[0-9]{10}$/.test(body.mobile)) {
    errors.push("mobile must be a 10 digit string");
  }

  // address check (optional)
  if (body.address) {
    if (typeof body.address !== "object") {
      errors.push("address must be object");
    } else {
      if (!body.address.stateCode) errors.push("address.stateCode required");
      if (!body.address.districtCode) errors.push("address.districtCode required");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid ABHA payload",
      errors,
    });
  }

  next();
}

router.post("/mock-abha/token", validateAbha, (req, res) => {
  const mockToken = "mock_abha_" + crypto.randomBytes(8).toString("hex");

  res.json({
    success: true,
    token: mockToken,
    tokenType: "Bearer",
    expiresIn: 3600,
    expiresAt: Date.now() + 3600 * 1000,
    mock: true,
    payload: req.body,
  });
});

module.exports = router;
