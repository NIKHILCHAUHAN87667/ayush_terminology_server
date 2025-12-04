const express = require("express");
const router = express.Router();  

const searchBiomedICD = require("./controllers/biomedcontroller");

router.post("/", searchBiomedICD);

module.exports = router;
