import mongoose from 'mongoose'

// Generic key/value store for small, global platform settings that admins can
// toggle at runtime (e.g. whether the community welcome post is shown).
const appSettingSchema = new mongoose.Schema(
  {
    key:   { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
)

export default mongoose.models.AppSetting ||
  mongoose.model('AppSetting', appSettingSchema)
