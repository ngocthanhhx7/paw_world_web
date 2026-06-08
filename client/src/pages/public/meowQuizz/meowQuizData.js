export const initialQuizForm = {
  name: '',
  sex: '',
  ageYears: '',
  ageMonths: '',
  breed: '',
  weightKg: '',
  noAllergies: false,
  allergies: '',
  healthIssues: '',
  healthGoals: [],
  activityLevel: '',
  weightGoal: '',
  currentFoodType: '',
  favoriteFlavors: '',
  photoUrl: '',
};

export const healthGoalOptions = [
  { value: 'bone', label: 'Xương', icon: '●' },
  { value: 'skin_coat', label: 'Da và lông', icon: '◌' },
  { value: 'teeth', label: 'Răng', icon: '◐' },
  { value: 'digestion', label: 'Hệ tiêu hóa', icon: '◍' },
];

export const activityOptions = [
  { value: 'low', label: 'Ít hoạt động' },
  { value: 'active', label: 'Năng động' },
  { value: 'very_active', label: 'Rất năng động' },
];

export const weightGoalOptions = [
  { value: 'gain', label: 'Tăng cân' },
  { value: 'maintain', label: 'Giữ ổn định' },
  { value: 'lose', label: 'Giảm cân' },
];

export const foodTypeOptions = [
  { value: 'dry', label: 'Thức ăn khô' },
  { value: 'wet', label: 'Thức ăn ướt' },
  { value: 'mixed', label: 'Kết hợp' },
];

export function splitList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeQuizPayload(form) {
  return {
    ...form,
    ageYears: Number(form.ageYears || 0),
    ageMonths: Number(form.ageMonths || 0),
    weightKg: Number(form.weightKg || 0),
    allergies: form.noAllergies ? [] : splitList(form.allergies),
    healthIssues: splitList(form.healthIssues),
    favoriteFlavors: splitList(form.favoriteFlavors),
  };
}

export function profileAgeLabel(profile) {
  const years = Number(profile?.ageYears || 0);
  const months = Number(profile?.ageMonths || 0);
  if (!years && !months) return 'Chưa rõ tuổi';
  return `${years} tuổi ${months} tháng`;
}

export function mapProfileToForm(profile) {
  return {
    ...initialQuizForm,
    ...profile,
    allergies: Array.isArray(profile?.allergies) ? profile.allergies.join(', ') : String(profile?.allergies || ''),
    healthIssues: Array.isArray(profile?.healthIssues) ? profile.healthIssues.join(', ') : String(profile?.healthIssues || ''),
    favoriteFlavors: Array.isArray(profile?.favoriteFlavors) ? profile.favoriteFlavors.join(', ') : String(profile?.favoriteFlavors || ''),
    healthGoals: Array.isArray(profile?.healthGoals) ? profile.healthGoals : [],
    noAllergies: Boolean(profile?.noAllergies),
  };
}
