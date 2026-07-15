import AppSetting from '@/models/AppSetting'

const WELCOME_KEY = 'communityWelcomeEnabled'

// Whether the community welcome post is currently shown. Defaults to enabled
// when no setting document exists yet. Assumes the DB is already connected.
export async function getWelcomeEnabled() {
  const doc = await AppSetting.findOne({ key: WELCOME_KEY }).lean()
  return doc ? doc.value !== false : true
}

// Enable/disable the welcome post globally (admin action). Upserts the setting.
export async function setWelcomeEnabled(enabled) {
  await AppSetting.updateOne(
    { key: WELCOME_KEY },
    { $set: { value: !!enabled } },
    { upsert: true },
  )
  return !!enabled
}
