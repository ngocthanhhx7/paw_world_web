const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, default: '' },
    image: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.pre('validate', function genSlug(next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true, locale: 'vi' });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
