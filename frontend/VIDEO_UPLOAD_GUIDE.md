# Video Upload Support Feature Guide

## Overview

The Video Upload Support feature allows users to upload cooking videos alongside recipe images, enhancing content with visual demonstrations. Videos are stored on Cloudinary with automatic thumbnail generation and optimized playback.

## ✅ Implementation Status: COMPLETE

### Database Schema ✅
- **Post Model Updates**: Added video support fields
- **Migration Applied**: `20260120063242_add_video_support`

### Backend Implementation ✅

#### New Fields in Post Model
```prisma
videoUrl      String?   // URL to video file
thumbnailUrl  String?   // Video thumbnail URL
videoDuration Int?      // Duration in seconds
```

#### Routes (`/api/upload`)
- `POST /video` - Upload video only
- `POST /image` - Upload image only
- `POST /video-with-thumbnail` - Upload video with optional custom thumbnail

#### Files Created/Modified
- `backend/src/config/cloudinary.ts` - Cloudinary configuration & helpers
- `backend/src/config/env.ts` - Added Cloudinary env variables
- `backend/src/middleware/upload.ts` - Multer configuration for file uploads
- `backend/src/controllers/uploadController.ts` - Upload controllers
- `backend/src/routes/upload.ts` - Upload routes
- `backend/src/index.ts` - Registered upload routes
- `backend/uploads/temp/` - Temporary storage directory

### Frontend Implementation ✅

#### Vue Components
1. **VideoPlayer.vue** - Full-featured video player
2. **VideoUpload.vue** - Video upload UI with progress

---

## 🎯 Key Features

### Backend Features
✅ Video file upload (MP4, WebM, MOV, AVI)
✅ 100MB file size limit
✅ Automatic thumbnail generation from video
✅ Custom thumbnail upload support
✅ Cloud storage integration (Cloudinary)
✅ Video duration extraction
✅ Automatic video optimization
✅ Temporary file cleanup

### Frontend Features
✅ Drag & drop video upload
✅ Upload progress indicator
✅ Video preview with controls
✅ Custom thumbnail upload (optional)
✅ File validation (type, size)
✅ Full-featured video player with:
  - Play/pause controls
  - Progress bar with seeking
  - Volume control
  - Fullscreen mode
  - Time display
  - Auto-generated thumbnail
  - Mobile-optimized

---

## 📖 Usage Guide

### Environment Setup

Add these variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Backend API Usage

#### Upload Video Only
```typescript
POST /api/upload/video
Content-Type: multipart/form-data

FormData:
  video: File

Response:
{
  success: true,
  message: "Video uploaded successfully",
  data: {
    videoUrl: "https://...",
    thumbnailUrl: "https://...",
    duration: 125,
    publicId: "nutrisipe/videos/..."
  }
}
```

#### Upload Video with Custom Thumbnail
```typescript
POST /api/upload/video-with-thumbnail
Content-Type: multipart/form-data

FormData:
  video: File
  thumbnail: File (optional)

Response:
{
  success: true,
  message: "Video and thumbnail uploaded successfully",
  data: {
    videoUrl: "https://...",
    thumbnailUrl: "https://...",
    duration: 125,
    publicId: "nutrisipe/videos/..."
  }
}
```

#### Upload Image Only
```typescript
POST /api/upload/image
Content-Type: multipart/form-data

FormData:
  image: File

Response:
{
  success: true,
  message: "Image uploaded successfully",
  data: {
    imageUrl: "https://...",
    publicId: "nutrisipe/images/..."
  }
}
```

### Frontend Component Usage

#### Video Upload Component

```vue
<script setup>
import { ref } from 'vue'
import VideoUpload from '@/components/common/VideoUpload.vue'

const videoData = ref(null)

const handleVideoUpload = (data) => {
  console.log('Video uploaded:', data)
  // data: { videoUrl, thumbnailUrl, duration }
}

const handleError = (error) => {
  console.error('Upload error:', error)
}
</script>

<template>
  <VideoUpload
    v-model="videoData"
    :allow-thumbnail="true"
    @error="handleError"
  />
</template>
```

#### Video Player Component

```vue
<script setup>
import VideoPlayer from '@/components/common/VideoPlayer.vue'

const post = {
  videoUrl: 'https://res.cloudinary.com/...',
  thumbnailUrl: 'https://res.cloudinary.com/...'
}
</script>

<template>
  <VideoPlayer
    :video-url="post.videoUrl"
    :thumbnail-url="post.thumbnailUrl"
    :autoplay="false"
    :allow-fullscreen="true"
  />
</template>
```

#### Integration in Post Creation Form

```vue
<script setup>
import { ref } from 'vue'
import VideoUpload from '@/components/common/VideoUpload.vue'

const formData = ref({
  title: '',
  description: '',
  imageUrl: '',
  videoUrl: '',
  thumbnailUrl: '',
  videoDuration: 0
})

const handleVideoUpload = (videoData) => {
  if (videoData) {
    formData.value.videoUrl = videoData.videoUrl
    formData.value.thumbnailUrl = videoData.thumbnailUrl
    formData.value.videoDuration = videoData.duration
  } else {
    // Video removed
    formData.value.videoUrl = ''
    formData.value.thumbnailUrl = ''
    formData.value.videoDuration = 0
  }
}
</script>

<template>
  <form @submit.prevent="createPost">
    <!-- Other form fields -->

    <div class="form-section">
      <label>Recipe Video (Optional)</label>
      <VideoUpload
        v-model="videoData"
        @update:modelValue="handleVideoUpload"
      />
    </div>

    <button type="submit">Create Post</button>
  </form>
</template>
```

#### Display Video in Post View

```vue
<script setup>
import VideoPlayer from '@/components/common/VideoPlayer.vue'

const post = ref(/* fetch post data */)
</script>

<template>
  <div class="post-detail">
    <!-- Post header, title, etc. -->

    <div v-if="post.videoUrl" class="post-video">
      <VideoPlayer
        :video-url="post.videoUrl"
        :thumbnail-url="post.thumbnailUrl"
      />
    </div>
    <div v-else class="post-image">
      <img :src="post.imageUrl" :alt="post.title" />
    </div>

    <!-- Rest of post content -->
  </div>
</template>
```

---

## 🔧 Technical Details

### Video Processing

**Cloudinary Configuration:**
- Chunk size: 6MB for reliable uploads
- Auto-optimization enabled
- Responsive format delivery
- Automatic thumbnail generation at 0.1s
- Quality: auto
- Format: auto (best for browser)

**Thumbnail Generation:**
- Extracted at 0.1 seconds of video
- Dimensions: 640x360
- Format: JPEG
- Automatically uploaded to Cloudinary

### File Validation

**Video Files:**
- Allowed formats: MP4, WebM, MOV, AVI, WMV
- Max size: 100MB
- Recommended max duration: 10 minutes

**Image Files (Thumbnails):**
- Allowed formats: JPEG, PNG, WebP, GIF
- Max size: 10MB

### Storage Structure

**Cloudinary Folders:**
- Videos: `nutrisipe/videos/`
- Images: `nutrisipe/images/`

**Local Temporary Storage:**
- Path: `backend/uploads/temp/`
- Auto-cleanup after upload
- Gitignored (except .gitkeep)

### Video Player Features

**Controls:**
- Play/Pause toggle
- Seek bar with progress indicator
- Volume control with slider
- Mute/unmute
- Fullscreen mode
- Time display (current / total)

**Responsive Design:**
- 16:9 aspect ratio
- Mobile-optimized controls
- Touch-friendly buttons
- Fullscreen support

**Performance:**
- Lazy loading
- Poster image (thumbnail) before play
- Smooth progress updates
- No unnecessary re-renders

---

## 🚀 Integration Steps

### 1. Update Post Creation Form

Add video upload field to your post creation/edit form:

```vue
<VideoUpload
  v-model="postData.video"
  @update:modelValue="handleVideoUpdate"
/>
```

### 2. Update Post API

Modify post creation/update to include video fields:

```typescript
// When creating/updating post
const postData = {
  title,
  description,
  imageUrl,
  videoUrl: video?.videoUrl || null,
  thumbnailUrl: video?.thumbnailUrl || null,
  videoDuration: video?.duration || null,
  // ... other fields
}
```

### 3. Display Videos in Feed

Update post cards to show video indicator:

```vue
<div class="post-card">
  <div class="post-media">
    <img :src="post.imageUrl" :alt="post.title" />
    <div v-if="post.videoUrl" class="video-badge">
      <svg><!-- video icon --></svg>
      <span>{{ formatDuration(post.videoDuration) }}</span>
    </div>
  </div>
</div>
```

### 4. Show Video in Post Detail

Replace static image with video player when video exists:

```vue
<VideoPlayer
  v-if="post.videoUrl"
  :video-url="post.videoUrl"
  :thumbnail-url="post.thumbnailUrl"
/>
<img
  v-else
  :src="post.imageUrl"
  :alt="post.title"
/>
```

---

## 🎨 UI/UX Features

### VideoUpload Component
- Clean drag-and-drop interface
- Visual upload progress with percentage
- File size and format validation
- Error messages with icons
- Video preview after upload
- Duration display
- Easy video removal
- Optional custom thumbnail upload
- Thumbnail preview
- Responsive design

### VideoPlayer Component
- Modern, intuitive controls
- Auto-hide controls when playing
- Hover to show controls
- Large play button overlay
- Smooth progress bar
- Volume slider (desktop)
- Time remaining display
- Fullscreen support
- Mobile touch controls
- Responsive sizing
- Keyboard shortcuts (space, arrows)

---

## 📊 Performance Considerations

**Upload Optimization:**
- Chunked uploads for large files
- Progress tracking for UX
- Automatic retry on network errors
- Temporary file cleanup

**Playback Optimization:**
- Lazy loading (loads on demand)
- Poster/thumbnail prevents autoplay
- Efficient progress updates
- Minimal re-renders

**Storage Optimization:**
- Cloudinary handles transcoding
- Multiple quality versions
- Adaptive bitrate delivery
- CDN distribution

---

## 🔒 Security & Validation

**Backend:**
- ✅ Authentication required for uploads
- ✅ File type validation (whitelist)
- ✅ File size limits enforced
- ✅ Secure filename generation
- ✅ Temporary file cleanup
- ✅ SQL injection prevention (Prisma)

**Frontend:**
- ✅ Client-side validation
- ✅ Progress feedback
- ✅ Error handling
- ✅ XSS prevention (Vue escaping)

---

## 🐛 Error Handling

**Upload Errors:**
- File too large (>100MB)
- Invalid file format
- Network errors
- Cloudinary errors
- Storage quota exceeded

**Playback Errors:**
- Video not found
- Format not supported
- Network errors
- Decoding errors

All errors are gracefully handled with user-friendly messages.

---

## 📝 Example Use Cases

1. **Cooking Tutorial:**
   - Upload step-by-step cooking video
   - Auto-generated thumbnail shows first frame
   - Users can pause and follow along

2. **Technique Demonstration:**
   - Short videos showing specific techniques
   - Seeking allows reviewing specific steps
   - Fullscreen for detailed viewing

3. **Recipe Walkthroughs:**
   - Full recipe preparation from start to finish
   - Time stamps for different stages
   - Custom thumbnail showing final dish

4. **Quick Tips:**
   - Short-form content (<2 minutes)
   - Auto-play on mobile for engagement
   - Easy sharing on social media

---

## 🎉 Feature Complete!

All components, services, and routes are implemented and ready to use. The feature supports:

- ✅ Video upload with progress tracking
- ✅ Automatic thumbnail generation
- ✅ Custom thumbnail upload
- ✅ Cloud storage integration
- ✅ Full-featured video player
- ✅ Mobile-optimized playback
- ✅ Fullscreen mode
- ✅ File validation
- ✅ Error handling
- ✅ Responsive design
- ✅ Accessibility features

**Ready for integration into your Nutrisipe application!** 🚀

---

## 📦 Required Dependencies

**Backend:**
```json
{
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.11",
  "cloudinary": "^2.0.0"
}
```

**Frontend:**
No additional dependencies required! Uses native HTML5 video API.

---

## 🔄 Migration Instructions

When ready to deploy:

1. **Set up Cloudinary account** (free tier available)
2. **Add environment variables** to production
3. **Run migration**: `npx prisma migrate deploy`
4. **Test video upload** with small file first
5. **Monitor storage quota** in Cloudinary dashboard

---

## 💡 Future Enhancements

Potential improvements for future iterations:

- [ ] Video trimming/editing in-browser
- [ ] Multiple video support per post
- [ ] Video chapters/timestamps
- [ ] Playback speed control
- [ ] Picture-in-picture mode
- [ ] Video analytics (views, watch time)
- [ ] HLS/DASH streaming for longer videos
- [ ] Video captions/subtitles
- [ ] Live streaming support
- [ ] Video comments with timestamps

**Current implementation provides solid foundation for all video needs!** 🎬
