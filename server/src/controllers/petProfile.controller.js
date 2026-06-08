const PetProfile = require('../models/PetProfile');
const { buildRecommendationForProfile } = require('../services/meowRecommendation.service');

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
  if (!profile) return res.status(404).json({ message: 'Khong tim thay ho so thu cung' });
  return res.json({ profile });
}

async function update(req, res) {
  const profile = await PetProfile.findOneAndUpdate(
    buildOwnedProfileQuery(req.params.id, req.customer._id),
    normalizeProfilePayload(req.body),
    { new: true, runValidators: true },
  );
  if (!profile) return res.status(404).json({ message: 'Khong tim thay ho so thu cung' });
  return res.json({ profile });
}

async function remove(req, res) {
  const profile = await PetProfile.findOneAndDelete(buildOwnedProfileQuery(req.params.id, req.customer._id));
  if (!profile) return res.status(404).json({ message: 'Khong tim thay ho so thu cung' });
  return res.json({ message: 'Da xoa ho so thu cung' });
}

async function recommendation(req, res) {
  const profile = await PetProfile.findOne(buildOwnedProfileQuery(req.params.id, req.customer._id));
  if (!profile) return res.status(404).json({ message: 'Khong tim thay ho so thu cung' });

  const aiSummary = await buildRecommendationForProfile(profile);
  profile.aiSummary = aiSummary;
  await profile.save();

  return res.json({ profile, recommendation: aiSummary });
}

module.exports = {
  buildOwnedProfileQuery,
  normalizeArray,
  normalizeProfilePayload,
  list,
  create,
  get,
  update,
  remove,
  recommendation,
};
