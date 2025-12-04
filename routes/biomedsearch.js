const express = require("express");
const router = express.Router();    

const searchBiomedICD = require("./controllers");

router.post("/", searchBiomedICD);

module.exports = router;
