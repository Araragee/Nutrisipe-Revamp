<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storiesApi, type StoryGroup } from '@/http/endpoints/stories'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/user/UserAvatar.vue'
import StoryViewer from './StoryViewer.vue'
import StoryComposer from './StoryComposer.vue'

const authStore = useAuthStore()
const groups = ref<StoryGroup[]>([])
const isLoading = ref(false)

const viewerOpen = ref(false)
const viewerStartIndex = ref(0)
const composerOpen = ref(false)

// Track which group user IDs the current user has opened this session
const seenGroupIds = ref<Set<string>>(new Set())

const TODAY_KEY = `story-seen-${new Date().toLocaleDateString('en-CA')}`

function pruneStaleSeenKeys() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith('story-seen-') && key !== TODAY_KEY) localStorage.removeItem(key)
    }
  } catch {}
}

function loadSeenFromStorage() {
  try {
    const raw = localStorage.getItem(TODAY_KEY)
    if (raw) seenGroupIds.value = new Set(JSON.parse(raw) as string[])
  } catch {}
}

function saveSeenToStorage() {
  try {
    localStorage.setItem(TODAY_KEY, JSON.stringify([...seenGroupIds.value]))
  } catch {}
}

function markSeen(userId: string) {
  seenGroupIds.value.add(userId)
  saveSeenToStorage()
}

async function load() {
  if (!authStore.isAuthenticated) return
  isLoading.value = true
  pruneStaleSeenKeys()
  try {
    const res = await storiesApi.feed()
    groups.value = res.data.data
    loadSeenFromStorage()
  } catch (error) {
    console.error('Stories feed error:', error)
  } finally {
    isLoading.value = false
  }
}

function openViewer(index: number) {
  viewerStartIndex.value = index
  viewerOpen.value = true
  // Mark this group as seen immediately on open
  const group = groups.value[index]
  if (group) markSeen(group.user.id)
}

function handleViewerClose(lastGroupIndex: number) {
  // Mark all groups from start through the final group the viewer was on
  for (let i = viewerStartIndex.value; i <= lastGroupIndex; i++) {
    const g = groups.value[i]
    if (g) markSeen(g.user.id)
  }
  viewerOpen.value = false
}

function handleStoryDeleted(storyId: string) {
  for (const g of groups.value) {
    g.stories = g.stories.filter((s) => s.id !== storyId)
  }
  groups.value = groups.value.filter((g) => g.stories.length > 0)
}

function handleCreated() {
  composerOpen.value = false
  load()
}

onMounted(load)
defineExpose({ refresh: load })
</script>

<template>
  <div class="stories-rail relative">
    <div class="flex gap-3 overflow-x-auto pb-4 px-1 scrollbar-hide">
      <!-- Add story tile -->
      <button
        v-if="authStore.user"
        @click="composerOpen = true"
        class="story-tile shrink-0 relative w-[70px] h-[70px] rounded-full overflow-hidden group/add"
      >
        <UserAvatar :user="authStore.user" size="lg" class="!w-full !h-full" />
        <div class="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-orange text-white font-bold flex items-center justify-center border-2 border-background text-base">+</div>
      </button>

      <button
        v-for="(group, idx) in groups"
        :key="group.user.id"
        @click="openViewer(idx)"
        class="story-tile shrink-0 relative w-[70px] h-[70px] rounded-full overflow-hidden"
      >
        <span
          :class="[
            'story-ring absolute inset-0 rounded-full transition-opacity duration-300',
            seenGroupIds.has(group.user.id) ? 'story-ring--seen' : 'story-ring--unseen',
          ]"
        ></span>
        <div class="absolute inset-[3px] rounded-full overflow-hidden border-2 border-background">
          <UserAvatar :user="group.user" size="lg" class="!w-full !h-full" />
        </div>
        <span class="absolute -bottom-5 inset-x-0 text-[10px] font-bold truncate text-center text-text-muted">
          {{ group.user.id === authStore.user?.id ? 'You' : group.user.displayName.split(' ')[0] }}
        </span>
      </button>
    </div>

    <StoryViewer
      v-if="viewerOpen"
      :groups="groups"
      :start-index="viewerStartIndex"
      @close="handleViewerClose"
      @advance="(i: number) => { const g = groups[i]; if (g) markSeen(g.user.id) }"
      @delete="handleStoryDeleted"
    />

    <StoryComposer
      v-if="composerOpen"
      @close="composerOpen = false"
      @created="handleCreated"
    />
  </div>
</template>

<style scoped>
.story-tile {
  margin-bottom: 1.25rem;
}

.story-ring--unseen {
  background: conic-gradient(
    from 180deg,
    var(--orange, #ff6b35),
    var(--orange-light, #ffaa6b),
    #ff4d8d,
    var(--orange, #ff6b35)
  );
}

.story-ring--seen {
  background: var(--glass-border, rgba(0, 0, 0, 0.12));
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
