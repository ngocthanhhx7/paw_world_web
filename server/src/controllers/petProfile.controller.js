const PetProfile = require('../models/PetProfile');
const { buildRecommendationForProfile } = require('../services/meowRecommendation.service');

const { consumeAiMixQuota } = require('../services/aiMixQuota.service');

const defaultRecommendationDeps = {
  buildRecommendationForProfile,
  consumeAiMixQuota,
};
let recommendationDeps = { ...defaultRecommendationDeps };

function buildImageUrl(req, file) {
  return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
}

function buildOwnedProfileQuery(profileId, customerId) {
  return { _id: profileId, customer: customerId };
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function normalizeProfilePayload(body) {
  return {
    name: String(body.name || '').trim(),
    sex: body.sex,
    ageYears: Number(body.ageYears || 0),
    ageMonths: Number(body.ageMonths || 0),
    breed: String(body.breed || '').trim(),
    weightKg: Number(body.weightKg || 0),
    allergies: normalizeArray(body.allergies),
    noAllergies: Boolean(body.noAllergies),
    healthIssues: normalizeArray(body.healthIssues),
    healthGoals: normalizeArray(body.healthGoals),
    activityLevel: body.activityLevel || 'active',
    weightGoal: body.weightGoal || 'maintain',
    currentFoodType: body.currentFoodType || 'mixed',
    favoriteFlavors: normalizeArray(body.favoriteFlavors),
    photoUrl: String(body.photoUrl || '').trim(),
  };
}

function parseRecommendationDurationDays(body = {}) {
  const durationDays = Number(body.durationDays);
  if (![1, 7, 30].includes(durationDays)) {
    const error = new Error('durationDays must be one of 1, 7, or 30');
    error.statusCode = 400;
    throw error;
  }
  return durationDays;
}

async function list(req, res) {
  const profiles = await PetProfile.find({ customer: req.customer._id }).sort({ updatedAt: -1 });
  res.json({ profiles });
}

async function create(req, res) {
  const payload = normalizeProfilePayload(req.body);
  const profile = await PetProfile.create({ ...payload, customer: req.customer._id });
  res.status(201).json({ profile });
}

async function get(req, res) {
  const profile = await PetProfile.findOne(buildOwnedProfileQuery(req.params.id, req.customer._id));
  if (!profile) return res.status(404).json({ message: 'Không tìm thấy hồ sơ thú cưng' });
  return res.json({ profile });
}

async function update(req, res) {
  const profile = await PetProfile.findOneAndUpdate(
    buildOwnedProfileQuery(req.params.id, req.customer._id),
    normalizeProfilePayload(req.body),
    { new: true, runValidators: true },
  );
  if (!profile) return res.status(404).json({ message: 'Không tìm thấy hồ sơ thú cưng' });
  return res.json({ profile });
}

async function remove(req, res) {
  const profile = await PetProfile.findOneAndDelete(buildOwnedProfileQuery(req.params.id, req.customer._id));
  if (!profile) return res.status(404).json({ message: 'Không tìm thấy hồ sơ thú cưng' });
  return res.json({ message: 'Đã xoá hồ sơ thú cưng' });
}

async function uploadPhoto(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn ảnh của bé mèo' });
  return res.status(201).json({ photoUrl: buildImageUrl(req, req.file) });
}

async function recommendation(req, res) {
  const profile = await PetProfile.findOne(buildOwnedProfileQuery(req.params.id, req.customer._id));
  if (!profile) return res.status(404).json({ message: 'Không tìm thấy hồ sơ thú cưng' });

  const durationDays = parseRecommendationDurationDays(req.body);
  const quota = await recommendationDeps.consumeAiMixQuota(req, res, req.customer._id);
  if (!quota.allowed) {
    return res.status(429).json({
      message: 'Thiết bị này đã dùng hết 3 lượt AI mix hôm nay. Sen quay lại vào ngày mai nha.',
      limit: quota.limit,
      remaining: quota.remaining,
      resetAt: quota.resetAt?.toISOString?.() || quota.resetAt,
    });
  }

  const aiSummary = await recommendationDeps.buildRecommendationForProfile(profile, { durationDays });
  profile.aiSummary = aiSummary;
  await profile.save();

  return res.json({ profile, recommendation: aiSummary });
}

function __setRecommendationDepsForTest(deps) {
  recommendationDeps = deps ? { ...defaultRecommendationDeps, ...deps } : { ...defaultRecommendationDeps };
}

module.exports = {
  buildOwnedProfileQuery,
  normalizeArray,
  buildImageUrl,
  normalizeProfilePayload,
  parseRecommendationDurationDays,
  __setRecommendationDepsForTest,
  list,
  create,
  get,
  update,
  remove,
  uploadPhoto,
  recommendation,
};

