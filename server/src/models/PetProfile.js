const mongoose = require('mongoose');

const petProfileSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sex: { type: String, enum: ['female', 'male'], required: true },
    ageYears: { type: Number, min: 0, default: 0 },
    ageMonths: { type: Number, min: 0, max: 11, default: 0 },
    breed: { type: String, default: '', trim: true },
    weightKg: { type: Number, min: 0, default: 0 },
    allergies: [{ type: String, trim: true }],
    noAllergies: { type: Boolean, default: false },
    healthIssues: [{ type: String, trim: true }],
    healthGoals: [
      {
        type: String,
        enum: ['bone', 'skin_coat', 'teeth', 'digestion'],
      },
    ],
    activityLevel: {
      type: String,
      enum: ['low', 'active', 'very_active'],
      default: 'active',
    },
    weightGoal: {
      type: String,
      enum: ['gain', 'maintain', 'lose'],
      default: 'maintain',
    },
    currentFoodType: {
      type: String,
      enum: ['dry', 'wet', 'mixed'],
      default: 'mixed',
    },
    favoriteFlavors: [{ type: String, trim: true }],
    photoUrl: { type: String, default: '' },
    aiSummary: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('PetProfile', petProfileSchema);
