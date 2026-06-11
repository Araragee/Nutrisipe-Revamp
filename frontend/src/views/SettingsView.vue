<script setup lang="ts">
import BaseIcons from '@/components/base/BaseIcons.vue'
import { logger } from '@/utils/logger'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { usersApi } from '@/http/endpoints/users'
import { preferencesApi } from '@/http/endpoints/preferences'
import { useTheme } from '@/composables/useTheme'
import UserAvatar from '@/components/user/UserAvatar.vue'
import ImageUpload from '@/components/ui/ImageUpload.vue'

interface Prefs {
  dietary: string[]
  cuisines: string[]
  allergies: string[]
}

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const { mode, setMode } = useTheme()

const activeSection = ref<'profile' | 'preferences' | 'appearance' | 'notifications' | 'privacy' | 'account'>(
  'profile',
)
const sections = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'preferences', label: 'Preferences', icon: 'adjustments-horizontal' },
  { id: 'appearance', label: 'Appearance', icon: 'paint-brush' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'privacy', label: 'Privacy', icon: 'lock-closed' },
  { id: 'account', label: 'Account', icon: 'cog-6-tooth' },
] as const

const displayName = ref('')
const bio = ref('')
const avatarUrl = ref('')
const showImageUpload = ref(false)

const isSavingProfile = ref(false)
const isSavingPrefs = ref(false)

const prefs = ref<Prefs>({ dietary: [], cuisines: [], allergies: [] })
const DIETS = ['Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'Pescatarian', 'Low-Carb', 'Mediterranean']
const ALLERGENS = ['Gluten', 'Dairy', 'Egg', 'Soy', 'Sesame', 'Tree nuts', 'Peanut', 'Fish', 'Shellfish']
const GOALS = ['lose', 'muscle', 'health', 'explore']
const GOAL_LABELS: Record<string, { icon: string; label: string }> = {
  lose: { icon: 'arrow-trending-down', label: 'Lose Weight' },
  muscle: { icon: 'fire', label: 'Build Muscle' },
  health: { icon: 'heart', label: 'Eat Healthier' },
  explore: { icon: 'globe-alt', label: 'Explore Cuisines' },
}

const DEFAULT_NOTIF: Record<string, boolean> = {
  likes: true,
  comments: true,
  follows: true,
  mentions: true,
  ratings: true,
  variations: true,
  emailDigest: false,
}
const DEFAULT_PRIVACY: Record<string, boolean> = {
  publicProfile: true,
  showSaved: false,
  showLiked: true,
}

const notifPrefs = ref<Record<string, boolean>>({ ...DEFAULT_NOTIF })
const privacyPrefs = ref<Record<string, boolean>>({ ...DEFAULT_PRIVACY })

const isPersistingPrefs = ref(false)

onMounted(async () => {
  if (authStore.user) {
    displayName.value = authStore.user.displayName || ''
    bio.value = authStore.user.bio || ''
    avatarUrl.value = authStore.user.avatarUrl || ''
  }
  await loadPreferences()
})

async function loadPreferences() {
  try {
    const res = await preferencesApi.get()
    const data = res.data.data ?? {}
    prefs.value = {
      dietary: data.dietary ?? [],
      cuisines: data.cuisines ?? [],
      allergies: data.allergies ?? [],
    }
    notifPrefs.value = { ...DEFAULT_NOTIF, ...(data.notifications ?? {}) }
    privacyPrefs.value = { ...DEFAULT_PRIVACY, ...(data.privacy ?? {}) }
  } catch (error) {
    logger.error('Failed to load preferences:', error)
  }
}

function toggleArr(list: string[], val: string) {
  const i = list.indexOf(val)
  if (i > -1) list.splice(i, 1)
  else list.push(val)
}

async function saveProfile() {
  if (!displayName.value.trim()) {
    uiStore.showToast('Display name is required', 'error')
    return
  }
  isSavingProfile.value = true
  try {
    const response = await usersApi.updateProfile({
      displayName: displayName.value.trim(),
      bio: bio.value.trim() || undefined,
      avatarUrl: avatarUrl.value.trim() || undefined,
    })
    authStore.setUser(response.data.data)
    uiStore.showToast('Profile updated', 'success')
  } catch (error: any) {
    uiStore.showToast(error.response?.data?.message || 'Failed to update profile', 'error')
  } finally {
    isSavingProfile.value = false
  }
}

async function savePreferences() {
  isSavingPrefs.value = true
  try {
    await preferencesApi.update({
      dietary: prefs.value.dietary,
      cuisines: prefs.value.cuisines,
      allergies: prefs.value.allergies,
    })
    uiStore.showToast('Preferences saved', 'success')
  } catch (error) {
    uiStore.showToast('Failed to save preferences', 'error')
  } finally {
    isSavingPrefs.value = false
  }
}

async function saveNotifPrefs() {
  isPersistingPrefs.value = true
  try {
    await preferencesApi.update({ notifications: notifPrefs.value })
    uiStore.showToast('Notifications saved', 'success')
  } catch {
    uiStore.showToast('Failed to save notifications', 'error')
  } finally {
    isPersistingPrefs.value = false
  }
}

async function savePrivacyPrefs() {
  isPersistingPrefs.value = true
  try {
    await preferencesApi.update({ privacy: privacyPrefs.value })
    uiStore.showToast('Privacy saved', 'success')
  } catch {
    uiStore.showToast('Failed to save privacy', 'error')
  } finally {
    isPersistingPrefs.value = false
  }
}

async function logoutEverywhere() {
  if (!confirm('Sign out of all devices? You will need to log in again on each.')) return
  try {
    await authStore.logoutAll()
    router.push('/login')
  } catch {
    uiStore.showToast('Failed to log out everywhere', 'error')
  }
}

function logoutHere() {
  authStore.logout()
  router.push('/login')
}

async function requestDeleteAccount() {
  const username = authStore.user?.username ?? ''
  const confirmation = prompt(
    `Schedule account deletion? Account + all data deleted after 7-day grace period — sign back in within that window to cancel. Type your username (${username}) to confirm.`,
  )
  if (!confirmation) return
  if (confirmation.trim() !== username) {
    uiStore.showToast('Username mismatch — cancelled', 'error')
    return
  }
  try {
    const res = await usersApi.deleteMe()
    const date = new Date(res.data.data.scheduledAt).toLocaleDateString()
    uiStore.showToast(`Account scheduled for deletion on ${date}`, 'success')
    authStore.logout()
    router.push('/login')
  } catch (error: any) {
    uiStore.showToast(error.response?.data?.message || 'Failed to schedule deletion', 'error')
  }
}

const themeOptions = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'computer-desktop' },
] as const
</script>

<template>
  <div class="settings-view min-h-screen bg-background py-10 px-6 md:px-12">
    <div class="max-w-6xl mx-auto">
      <header class="mb-10">
        <p class="text-orange text-[11px] font-bold uppercase tracking-[0.3em] mb-2">Account</p>
        <h1 class="font-montserrat font-extrabold text-4xl md:text-5xl tracking-tight">Settings</h1>
        <p class="text-text-muted mt-2 max-w-xl">Tune your profile, taste, theme, and privacy in one place.</p>
      </header>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Sidebar nav -->
        <aside class="lg:w-64 shrink-0">
          <nav class="ls-card rounded-3xl p-2 flex lg:flex-col overflow-x-auto lg:overflow-visible">
            <button
              v-for="s in sections"
              :key="s.id"
              @click="activeSection = s.id"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap shrink-0 lg:w-full',
                activeSection === s.id
                  ? 'bg-orange/10 text-orange'
                  : 'text-text-muted hover:bg-background-secondary hover:text-text',
              ]"
            >
              <BaseIcons :name="s.icon" size="sm" />
              <span>{{ s.label }}</span>
            </button>
          </nav>
        </aside>

        <!-- Content -->
        <section class="flex-1 space-y-6">
          <!-- PROFILE -->
          <div v-if="activeSection === 'profile'" class="settings-card animate-fadeIn">
            <h2 class="settings-h2">Profile</h2>
            <p class="settings-sub">How others see you on Nutrisipe.</p>

            <div class="flex items-center gap-5 mt-6">
              <UserAvatar v-if="authStore.user" :user="{ ...authStore.user, avatarUrl }" size="lg" class="!w-20 !h-20 border-2 border-orange shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="font-bold truncate">@{{ authStore.user?.username }}</p>
                <p class="text-sm text-text-dim truncate">{{ authStore.user?.email }}</p>
                <button @click="showImageUpload = !showImageUpload" class="text-xs font-bold text-orange hover:underline mt-1">
                  {{ showImageUpload ? 'Hide uploader' : 'Change picture' }}
                </button>
              </div>
            </div>

            <div v-if="showImageUpload" class="mt-4">
              <ImageUpload v-model="avatarUrl" :max-size="2" @error="(msg: string) => uiStore.showToast(msg, 'error')" />
            </div>

            <div class="mt-6 space-y-5">
              <div>
                <label class="settings-label">Display Name</label>
                <input v-model="displayName" type="text" maxlength="100" class="settings-input" placeholder="Your display name" />
                <p class="settings-hint">{{ displayName.length }}/100</p>
              </div>

              <div>
                <label class="settings-label">Bio</label>
                <textarea v-model="bio" rows="4" maxlength="500" class="settings-input resize-none" placeholder="Tell people what you cook…"></textarea>
                <p class="settings-hint">{{ bio.length }}/500</p>
              </div>
            </div>

            <div class="flex gap-3 mt-8">
              <button @click="saveProfile" :disabled="isSavingProfile" class="btn-primary px-7 py-3 text-xs disabled:opacity-50">
                {{ isSavingProfile ? 'Saving…' : 'Save Profile' }}
              </button>
            </div>
          </div>

          <!-- PREFERENCES -->
          <div v-if="activeSection === 'preferences'" class="settings-card animate-fadeIn">
            <h2 class="settings-h2">Taste preferences</h2>
            <p class="settings-sub">These shape your feed — change anytime.</p>

            <div class="mt-6">
              <h3 class="settings-h3">Dietary</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="d in DIETS"
                  :key="d"
                  @click="toggleArr(prefs.dietary, d)"
                  :class="[
                    'px-4 py-2 rounded-full border-1.5 text-xs font-bold transition-all',
                    prefs.dietary.includes(d)
                      ? 'bg-orange border-orange text-white'
                      : 'bg-transparent border-border text-text hover:border-orange',
                  ]"
                >{{ d }}</button>
              </div>
            </div>

            <div class="mt-6">
              <h3 class="settings-h3">Goals</h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  v-for="g in GOALS"
                  :key="g"
                  @click="toggleArr(prefs.cuisines, g)"
                  :class="[
                    'p-4 rounded-2xl border-1.5 text-left transition-all',
                    prefs.cuisines.includes(g)
                      ? 'border-orange bg-orange/10'
                      : 'border-border hover:border-orange',
                  ]"
                >
                  <BaseIcons :name="GOAL_LABELS[g].icon" size="lg" class="mx-auto mb-1" />
                  <span class="font-bold text-sm" :class="prefs.cuisines.includes(g) ? 'text-orange' : 'text-text'">{{ GOAL_LABELS[g].label }}</span>
                </button>
              </div>
            </div>

            <div class="mt-6">
              <h3 class="settings-h3">Allergies — hides matching recipes</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="a in ALLERGENS"
                  :key="a"
                  @click="toggleArr(prefs.allergies, a)"
                  :class="[
                    'px-4 py-2 rounded-full border-1.5 text-xs font-bold transition-all',
                    prefs.allergies.includes(a)
                      ? 'bg-red-500/15 border-red-500 text-red-500'
                      : 'bg-transparent border-border text-text hover:border-red-500',
                  ]"
                ><BaseIcons name="no-symbol" size="xs" class="inline-block mr-1 -mt-0.5" />{{ a }}</button>
              </div>
            </div>

            <div class="flex gap-3 mt-8">
              <button @click="savePreferences" :disabled="isSavingPrefs" class="btn-primary px-7 py-3 text-xs disabled:opacity-50">
                {{ isSavingPrefs ? 'Saving…' : 'Save Preferences' }}
              </button>
            </div>
          </div>

          <!-- APPEARANCE -->
          <div v-if="activeSection === 'appearance'" class="settings-card animate-fadeIn">
            <h2 class="settings-h2">Appearance</h2>
            <p class="settings-sub">Pick what feels right today. Saved on this device.</p>

            <div class="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                v-for="t in themeOptions"
                :key="t.value"
                @click="setMode(t.value)"
                :class="[
                  'p-5 rounded-2xl border-1.5 text-left transition-all',
                  mode === t.value
                    ? 'border-orange bg-orange/10'
                    : 'border-border hover:border-orange',
                ]"
              >
                <BaseIcons :name="t.icon" size="lg" class="mb-2" />
                <span class="font-bold text-sm" :class="mode === t.value ? 'text-orange' : 'text-text'">{{ t.label }}</span>
              </button>
            </div>
          </div>

          <!-- NOTIFICATIONS -->
          <div v-if="activeSection === 'notifications'" class="settings-card animate-fadeIn">
            <h2 class="settings-h2">Notifications</h2>
            <p class="settings-sub">Choose what pings your bell. Stored on this device.</p>

            <div class="mt-6 space-y-3">
              <label v-for="key in (['likes','comments','follows','mentions','ratings','variations'] as const)" :key="key" class="settings-row">
                <div>
                  <p class="font-bold capitalize">{{ key }}</p>
                  <p class="text-xs text-text-dim">Notify me when someone {{ key === 'follows' ? 'follows me' : key === 'mentions' ? 'mentions me' : key === 'variations' ? 'forks my recipe' : key }} {{ key === 'likes' || key === 'comments' || key === 'ratings' ? 'my recipe' : '' }}</p>
                </div>
                <input type="checkbox" v-model="notifPrefs[key]" class="settings-switch" />
              </label>

              <label class="settings-row">
                <div>
                  <p class="font-bold">Weekly email digest</p>
                  <p class="text-xs text-text-dim">Best of your feed every Monday</p>
                </div>
                <input type="checkbox" v-model="notifPrefs.emailDigest" class="settings-switch" />
              </label>
            </div>

            <button @click="saveNotifPrefs" :disabled="isPersistingPrefs" class="btn-primary px-7 py-3 text-xs mt-8 disabled:opacity-50">Save</button>
          </div>

          <!-- PRIVACY -->
          <div v-if="activeSection === 'privacy'" class="settings-card animate-fadeIn">
            <h2 class="settings-h2">Privacy</h2>
            <p class="settings-sub">Control what others can see.</p>

            <div class="mt-6 space-y-3">
              <label class="settings-row">
                <div>
                  <p class="font-bold">Public profile</p>
                  <p class="text-xs text-text-dim">Anyone can find and view your profile</p>
                </div>
                <input type="checkbox" v-model="privacyPrefs.publicProfile" class="settings-switch" />
              </label>
              <label class="settings-row">
                <div>
                  <p class="font-bold">Show saved recipes</p>
                  <p class="text-xs text-text-dim">Visitors see your saved tab</p>
                </div>
                <input type="checkbox" v-model="privacyPrefs.showSaved" class="settings-switch" />
              </label>
              <label class="settings-row">
                <div>
                  <p class="font-bold">Show liked recipes</p>
                  <p class="text-xs text-text-dim">Visitors see your liked tab</p>
                </div>
                <input type="checkbox" v-model="privacyPrefs.showLiked" class="settings-switch" />
              </label>
            </div>

            <button @click="savePrivacyPrefs" :disabled="isPersistingPrefs" class="btn-primary px-7 py-3 text-xs mt-8 disabled:opacity-50">Save</button>
          </div>

          <!-- ACCOUNT -->
          <div v-if="activeSection === 'account'" class="settings-card animate-fadeIn">
            <h2 class="settings-h2">Account</h2>
            <p class="settings-sub">Manage sessions and account state.</p>

            <div class="mt-6 space-y-4">
              <div class="settings-row">
                <div>
                  <p class="font-bold">Email</p>
                  <p class="text-xs text-text-dim">{{ authStore.user?.email }}</p>
                </div>
                <span class="text-xs text-text-dim">Contact support to change</span>
              </div>
              <div class="settings-row">
                <div>
                  <p class="font-bold">Username</p>
                  <p class="text-xs text-text-dim">@{{ authStore.user?.username }}</p>
                </div>
              </div>
              <div class="settings-row">
                <div>
                  <p class="font-bold">Role</p>
                  <p class="text-xs text-text-dim">{{ authStore.user?.role || 'USER' }}</p>
                </div>
              </div>
            </div>

            <div class="mt-8 pt-6 border-t border-border space-y-3">
              <button @click="logoutHere" class="w-full px-6 py-3 rounded-2xl border-1.5 border-border bg-background-secondary text-text font-bold text-sm hover:border-orange transition-all text-left flex items-center justify-between">
                <span>Sign out of this device</span>
                <span>→</span>
              </button>
              <button @click="logoutEverywhere" class="w-full px-6 py-3 rounded-2xl border-1.5 border-border bg-background-secondary text-text font-bold text-sm hover:border-orange transition-all text-left flex items-center justify-between">
                <span>Sign out everywhere</span>
                <span>→</span>
              </button>
              <button @click="requestDeleteAccount" class="w-full px-6 py-3 rounded-2xl border-1.5 border-red-500/40 bg-red-500/5 text-red-500 font-bold text-sm hover:bg-red-500/10 transition-all text-left flex items-center justify-between">
                <span>Delete my account</span>
                <BaseIcons name="exclamation-triangle" size="sm" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ls-card {
  background: var(--glass, rgba(255, 255, 255, 0.6));
  backdrop-filter: blur(24px) saturate(120%);
  -webkit-backdrop-filter: blur(24px) saturate(120%);
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}
:global(.dark) .ls-card {
  background: rgba(15, 13, 21, 0.86);
}

.settings-card {
  background: var(--background-secondary, rgba(245, 245, 247, 0.5));
  border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
  border-radius: 32px;
  padding: 32px;
}

.settings-h2 {
  font-family: var(--font-display, 'Montserrat', sans-serif);
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.01em;
  color: var(--text, #1a0f08);
}

.settings-h3 {
  font-weight: 800;
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-dim, #87807a);
  margin-bottom: 0.75rem;
}

.settings-sub {
  color: var(--text-muted, #6d655e);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.settings-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--text-dim, #87807a);
  margin-bottom: 0.5rem;
}

.settings-input {
  width: 100%;
  padding: 0.85rem 1rem;
  background: var(--surface, rgba(255, 255, 255, 0.7));
  border: 1.5px solid var(--border, rgba(0, 0, 0, 0.08));
  border-radius: 14px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  color: inherit;
}
.settings-input:focus {
  border-color: var(--orange, #ff6b35);
}

.settings-hint {
  font-size: 0.7rem;
  color: var(--text-dim, #87807a);
  margin-top: 0.35rem;
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: var(--surface, rgba(255, 255, 255, 0.6));
  border: 1px solid var(--border, rgba(0, 0, 0, 0.06));
  border-radius: 16px;
  cursor: pointer;
}
.settings-row:hover {
  border-color: var(--orange, #ff6b35);
}

.settings-switch {
  appearance: none;
  width: 44px;
  height: 24px;
  background: var(--background-secondary, #e6e1d8);
  border-radius: 999px;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;
}
.settings-switch::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.settings-switch:checked {
  background: var(--orange, #ff6b35);
}
.settings-switch:checked::before {
  transform: translateX(20px);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.35s ease-out;
}
</style>
