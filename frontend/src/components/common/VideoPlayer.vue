<template>
  <div class="video-player" :class="{ fullscreen: isFullscreen }">
    <div class="video-container" ref="containerRef">
      <video
        ref="videoRef"
        :src="videoUrl"
        :poster="thumbnailUrl"
        class="video-element"
        @click="togglePlay"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleMetadata"
        @ended="handleEnded"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        playsinline
      />

      <div v-if="!isPlaying && !hasStarted" class="play-overlay" @click="togglePlay">
        <button class="play-button">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
      </div>

      <div class="controls" :class="{ visible: showControls || !isPlaying }">
        <div class="progress-bar" @click="seek">
          <div class="progress-filled" :style="{ width: progressPercent + '%' }">
            <div class="progress-thumb"></div>
          </div>
        </div>

        <div class="controls-row">
          <div class="controls-left">
            <button class="control-button" @click="togglePlay">
              <svg v-if="!isPlaying" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <svg v-else fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            </button>

            <div class="volume-control">
              <button class="control-button" @click="toggleMute">
                <svg v-if="!isMuted && volume > 0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                </svg>
                <svg v-else-if="!isMuted && volume > 0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 9v6h4l5 5V4l-5 5H7z"/>
                </svg>
                <svg v-else fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                </svg>
              </button>
              <input
                v-show="showVolumeSlider"
                type="range"
                min="0"
                max="100"
                :value="volume * 100"
                @input="handleVolumeChange"
                class="volume-slider"
              />
            </div>

            <div class="time-display">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </div>
          </div>

          <div class="controls-right">
            <button v-if="allowFullscreen" class="control-button" @click="toggleFullscreen">
              <svg v-if="!isFullscreen" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
              </svg>
              <svg v-else fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'

interface Props {
  videoUrl: string
  thumbnailUrl?: string
  autoplay?: boolean
  allowFullscreen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  allowFullscreen: true
})

const videoRef = ref<HTMLVideoElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)

const isPlaying = ref(false)
const hasStarted = ref(false)
const isMuted = ref(false)
const isFullscreen = ref(false)
const showControls = ref(false)
const showVolumeSlider = ref(false)

const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)

const progressPercent = computed(() => {
  if (duration.value === 0) return 0
  return (currentTime.value / duration.value) * 100
})

let controlsTimeout: NodeJS.Timeout | null = null

onMounted(() => {
  if (props.autoplay && videoRef.value) {
    videoRef.value.play()
  }

  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  if (controlsTimeout) clearTimeout(controlsTimeout)
})

const togglePlay = () => {
  if (!videoRef.value) return

  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
    hasStarted.value = true
  }
}

const toggleMute = () => {
  if (!videoRef.value) return

  videoRef.value.muted = !videoRef.value.muted
  isMuted.value = videoRef.value.muted
}

const handleVolumeChange = (e: Event) => {
  if (!videoRef.value) return

  const target = e.target as HTMLInputElement
  const newVolume = parseFloat(target.value) / 100
  videoRef.value.volume = newVolume
  volume.value = newVolume

  if (newVolume > 0) {
    isMuted.value = false
    videoRef.value.muted = false
  }
}

const handleTimeUpdate = () => {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
}

const handleMetadata = () => {
  if (!videoRef.value) return
  duration.value = videoRef.value.duration
}

const handleEnded = () => {
  isPlaying.value = false
  hasStarted.value = false
}

const seek = (e: MouseEvent) => {
  if (!videoRef.value) return

  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const percent = (e.clientX - rect.left) / rect.width
  videoRef.value.currentTime = percent * duration.value
}

const toggleFullscreen = async () => {
  if (!containerRef.value) return

  try {
    if (!isFullscreen.value) {
      if (containerRef.value.requestFullscreen) {
        await containerRef.value.requestFullscreen()
      } else if ((containerRef.value as any).webkitRequestFullscreen) {
        await (containerRef.value as any).webkitRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      }
    }
  } catch (err) {
    console.error('Fullscreen error:', err)
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
}

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return '0:00'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleMouseMove = () => {
  showControls.value = true

  if (controlsTimeout) clearTimeout(controlsTimeout)

  controlsTimeout = setTimeout(() => {
    if (isPlaying.value) {
      showControls.value = false
    }
  }, 3000)
}
</script>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
}

.video-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 Aspect Ratio */
}

.video-element {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  cursor: pointer;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: background 0.2s;
}

.play-overlay:hover {
  background: rgba(0, 0, 0, 0.4);
}

.play-button {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.play-button:hover {
  background: white;
  transform: scale(1.1);
}

.play-button svg {
  width: 2.5rem;
  height: 2.5rem;
  color: #000;
  margin-left: 0.25rem;
}

.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  padding: 2rem 1rem 1rem;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.controls.visible {
  opacity: 1;
  pointer-events: all;
}

.progress-bar {
  width: 100%;
  height: 0.375rem;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0.25rem;
  cursor: pointer;
  margin-bottom: 0.75rem;
  position: relative;
}

.progress-filled {
  height: 100%;
  background: #10b981;
  border-radius: 0.25rem;
  position: relative;
  transition: width 0.1s linear;
}

.progress-thumb {
  position: absolute;
  right: -0.375rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0.75rem;
  height: 0.75rem;
  background: white;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;
}

.progress-bar:hover .progress-thumb {
  opacity: 1;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-button {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.control-button svg {
  width: 1.5rem;
  height: 1.5rem;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.volume-slider {
  width: 5rem;
  height: 0.25rem;
  appearance: none;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0.125rem;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 0.75rem;
  height: 0.75rem;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}

.time-display {
  color: white;
  font-size: 0.875rem;
  font-family: monospace;
  white-space: nowrap;
}

.fullscreen .video-container {
  padding-top: 0;
  height: 100vh;
}

@media (max-width: 768px) {
  .play-button {
    width: 4rem;
    height: 4rem;
  }

  .play-button svg {
    width: 2rem;
    height: 2rem;
  }

  .volume-slider {
    display: none;
  }
}
</style>
