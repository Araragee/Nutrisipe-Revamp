<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storiesApi, type StoryGroup } from '@/http/endpoints/stories'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { resolveImage } from '@/utils/imageUrl'
import UserAvatar from '@/components/user/UserAvatar.vue'

const props = defineProps<{
  groups: StoryGroup[]
  startIndex: number
}>()

const emit = defineEmits<{
  close: [lastGroupIndex: number]
  delete: [storyId: string]
  advance: [groupIndex: number]
}>()

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const groupIndex = ref(props.startIndex)
const storyIndex = ref(0)
const progress = ref(0)
const isPaused = ref(false)

const STORY_DURATION = 5000

let rafId: number | null = null
let lastTimestamp = 0

// Touch / swipe state
let touchStartX = 0
let touchStartY = 0
let isSwiping = false

const currentGroup = computed(() => props.groups[groupIndex.value] ?? null)
const currentStory = computed(() => currentGroup.value?.stories[storyIndex.value] ?? null)
const isOwn = computed(() => currentGroup.value?.user.id === authStore.user?.id)

function tick(timestamp: number) {
  if (!lastTimestamp) lastTimestamp = timestamp
  const delta = timestamp - lastTimestamp
  lastTimestamp = timestamp

  if (!isPaused.value && currentStory.value) {
    progress.value += (delta / STORY_DURATION) * 100
    if (progress.value >= 100) {
      progress.value = 100
      nextStory()
      return
    }
  }
  rafId = requestAnimationFrame(tick)
}

function start() {
  cancel()
  lastTimestamp = 0
  progress.value = 0
  rafId = requestAnimationFrame(tick)
  if (currentStory.value) {
    storiesApi.view(currentStory.value.id).catch(() => {})
  }
}

function cancel() {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
}

function nextStory() {
  cancel()
  if (!currentGroup.value) return
  if (storyIndex.value < currentGroup.value.stories.length - 1) {
    storyIndex.value++
    start()
  } else if (groupIndex.value < props.groups.length - 1) {
    groupIndex.value++
    emit('advance', groupIndex.value)
    storyIndex.value = 0
    start()
  } else {
    emit('close', groupIndex.value)
  }
}

function prevStory() {
  cancel()
  if (storyIndex.value > 0) {
    storyIndex.value--
    start()
  } else if (groupIndex.value > 0) {
    groupIndex.value--
    storyIndex.value = props.groups[groupIndex.value].stories.length - 1
    start()
  } else {
    progress.value = 0
    start()
  }
}

// Swipe to jump between story groups (horizontal) or dismiss (vertical)
function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
  isSwiping = false
  isPaused.value = true
}

function onTouchMove(e: TouchEvent) {
  const dx = Math.abs(e.touches[0].clientX - touchStartX)
  const dy = Math.abs(e.touches[0].clientY - touchStartY)
  if (dx > 10 || dy > 10) isSwiping = true
}

function onTouchEnd(e: TouchEvent) {
  isPaused.value = false
  // Reset lastTimestamp so the RAF loop doesn't count the pause duration
  // as elapsed story time (prevents the progress bar from jumping forward)
  lastTimestamp = 0
  if (!isSwiping) return

  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  // Vertical swipe down → dismiss
  if (absDy > absDx && dy > 60) {
    emit('close', groupIndex.value)
    return
  }

  // Horizontal swipe → next / prev group (threshold 60px)
  if (absDx > absDy && absDx > 60) {
    if (dx < 0) {
      // swipe left = next group
      if (groupIndex.value < props.groups.length - 1) {
        cancel()
        groupIndex.value++
        emit('advance', groupIndex.value)
        storyIndex.value = 0
        start()
      } else {
        emit('close', groupIndex.value)
      }
    } else {
      // swipe right = prev group
      if (groupIndex.value > 0) {
        cancel()
        groupIndex.value--
        storyIndex.value = 0
        start()
      }
    }
  }
}

function onTap(side: 'left' | 'right') {
  if (isSwiping) return
  if (side === 'left') prevStory()
  else nextStory()
}

function handleKey(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') prevStory()
  else if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault()
    nextStory()
  } else if (e.key === 'Escape') emit('close', groupIndex.value)
}

async function deleteCurrent() {
  if (!currentStory.value) return
  if (!confirm('Delete this story?')) return
  try {
    await storiesApi.delete(currentStory.value.id)
    emit('delete', currentStory.value.id)
    nextStory()
  } catch {
    uiStore.showToast('Failed to delete story', 'error')
  }
}

function openLinkedPost() {
  if (currentStory.value?.postId) {
    emit('close', groupIndex.value)
    router.push(`/recipes/${currentStory.value.postId}`)
  }
}

watch(groupIndex, () => {
  storyIndex.value = 0
})

onMounted(() => {
  document.addEventListener('keydown', handleKey)
  start()
})

onUnmounted(() => {
  cancel()
  document.removeEventListener('keydown', handleKey)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="currentStory && currentGroup"
      class="fixed inset-0 z-[200] bg-black flex flex-col select-none"
      @mousedown="isPaused = true"
      @mouseup="isPaused = false"
      @mouseleave="isPaused = false"
      @touchstart.passive="onTouchStart"
      @touchmove.passive="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- Progress bars -->
      <div class="flex gap-1 p-3 pt-5">
        <div
          v-for="(_, i) in currentGroup.stories"
          :key="i"
          class="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
        >
          <div
            class="h-full bg-white"
            :style="{
              width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
            }"
          ></div>
        </div>
      </div>

      <!-- Header -->
      <header class="flex items-center justify-between px-5 pb-3">
        <div class="flex items-center gap-3">
          <UserAvatar :user="currentGroup.user" size="sm" class="border-2 border-white" />
          <div>
            <p class="text-white text-sm font-bold">{{ currentGroup.user.displayName }}</p>
            <p class="text-white/65 text-[10px]">@{{ currentGroup.user.username }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="isOwn"
            @click="deleteCurrent"
            class="w-9 h-9 rounded-full bg-white/10 text-white text-sm flex items-center justify-center"
            aria-label="Delete"
          >🗑</button>
          <button
            @click="emit('close', groupIndex)"
            class="w-9 h-9 rounded-full bg-white/10 text-white text-xl flex items-center justify-center"
            aria-label="Close"
          >✕</button>
        </div>
      </header>

      <!-- Image -->
      <div class="flex-1 relative overflow-hidden">
        <img
          :src="resolveImage(currentStory.imageUrl, currentStory.id)"
          class="absolute inset-0 w-full h-full object-contain"
          :alt="currentStory.caption || ''"
        />

        <!-- Tap zones (only fire when not a swipe gesture) -->
        <button @click="onTap('left')" class="absolute top-0 left-0 bottom-0 w-1/3" aria-label="Previous"></button>
        <button @click="onTap('right')" class="absolute top-0 right-0 bottom-0 w-1/3" aria-label="Next"></button>

        <!-- Caption -->
        <div
          v-if="currentStory.caption"
          class="absolute inset-x-6 bottom-20 text-white font-bold text-base text-center drop-shadow-md"
        >
          {{ currentStory.caption }}
        </div>

        <!-- Linked post CTA -->
        <button
          v-if="currentStory.postId"
          @click="openLinkedPost"
          class="absolute inset-x-0 bottom-8 mx-auto px-6 py-3 rounded-full bg-white/15 backdrop-blur text-white text-xs font-bold uppercase tracking-widest w-fit border border-white/20"
        >
          View Recipe →
        </button>
      </div>
    </div>
  </Teleport>
</template>
