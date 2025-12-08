const express = require('express');
const { body } = require( 'express-validator');
const {validateBundle} = require('../middleware/validators.js');
const { bundleUpload } = require('../controllers/bundleController.js');
const { MongoClient } = require("mongodb");

const router = express.Router();
router.post(
  '/bundle_upload',
  [
    body('abhaId').isString().notEmpty(),
    body('encounterDetail').isObject(),
    validateBundle
  ],
  bundleUpload
);

module.exports= router;
