const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const ConsentSchema = new mongoose.Schema({
  consentId: { type: ObjectId },
  source: { type: String },
  consent: { type: Boolean, default: false },
  timestamp: { type: Date },
  meta: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const BundleSchema = new mongoose.Schema({
  abhaId: { type: String, required: true, index: true },
  encounterDetail: {
    encounterId: { type: ObjectId },
    // allow any extra encounter fields
    type: mongoose.Schema.Types.Mixed
  },
  problemList: { type: [mongoose.Schema.Types.Mixed], default: [] },
  // namaste_code: { type: String, default: '' },
  // icd_tm2_code: { type: String, default: '' },
  consentMetaData: { type: [ConsentSchema], default: [] },
  createdAt: { type: Date, default: () => new Date() },
  rawPayload: { type: mongoose.Schema.Types.Mixed }
}, {
  collection: 'bundles'
});

/**
 * Use async-style pre hook: do NOT accept `next` parameter.
 * Using async is easier when performing any asynchronous work.
 */
BundleSchema.pre('validate', async function () {
  // ensure encounterDetail exists
  if (!this.encounterDetail || typeof this.encounterDetail !== 'object') {
    this.encounterDetail = {};
  }

  // generate encounterId if missing
  if (!this.encounterDetail.encounterId) {
    this.encounterDetail.encounterId = new mongoose.Types.ObjectId();
  }

  // ensure consentMetaData is an array and fill consentId/timestamp if missing
  if (!Array.isArray(this.consentMetaData)) {
    this.consentMetaData = [];
  }

  this.consentMetaData = this.consentMetaData.map(c => {
    // keep original object shape even if user provided primitives
    const obj = (typeof c === 'object' && c !== null) ? c : {};
    if (!obj.consentId) obj.consentId = new mongoose.Types.ObjectId();
    if (!obj.timestamp) obj.timestamp = new Date();
    return obj;
  });

  // No next() call here — finishing the function resolves the hook.
});

module.exports = mongoose.model('Bundle', BundleSchema, 'bundles');
