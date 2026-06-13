<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import type * as ThreeTypes from 'three'

interface Props {
  density?: number
}

const props = withDefaults(defineProps<Props>(), {
  density: 18,
})

const container = ref<HTMLDivElement | null>(null)
const ready = ref(false)

let cleanup: (() => void) | null = null

onMounted(async () => {
  const el = container.value
  if (!el) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const THREE = await import('three')

  const width = el.clientWidth || window.innerWidth
  const height = el.clientHeight || window.innerHeight

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
  camera.position.z = 15

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  el.appendChild(renderer.domElement)

  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const key = new THREE.DirectionalLight(0xfff1e0, 1.5)
  key.position.set(5, 8, 7)
  scene.add(key)
  const rim = new THREE.PointLight(0xff6b35, 1.6, 70)
  rim.position.set(-9, -5, 5)
  scene.add(rim)

  // LatheGeometry from [radius, height] pairs — low segment count = stylised low-poly food
  const lathe = (pts: [number, number][], segs = 8) =>
    new THREE.LatheGeometry(pts.map(([r, h]) => new THREE.Vector2(r, h)), segs)

  const stdMat = (color: number, roughness = 0.55, metalness = 0.08) =>
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness, metalness })

  interface GroupResult {
    group: ThreeTypes.Group
    geos: ThreeTypes.BufferGeometry[]
    mats: ThreeTypes.MeshStandardMaterial[]
  }

  const templates: Array<{ make: () => GroupResult; scale: number }> = [
    {
      // Carrot — tip at bottom, widens toward leafy top
      make: () => {
        const geo = lathe([[0,0],[0.08,0.3],[0.22,0.75],[0.36,1.3],[0.4,1.75],[0.32,2.05],[0,2.2]])
        const m = stdMat(0xff7a2f)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.62,
    },
    {
      // Onion — round bulb with narrow papery neck
      make: () => {
        const geo = lathe([[0.06,0],[0.5,0.12],[0.88,0.48],[0.9,0.92],[0.74,1.32],[0.36,1.62],[0.1,1.82],[0,1.9]])
        const m = stdMat(0xd4b483)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.68,
    },
    {
      // Garlic clove — squat teardrop, pointed top
      make: () => {
        const geo = lathe([[0.06,0],[0.38,0.1],[0.5,0.42],[0.46,0.72],[0.3,1.02],[0.1,1.28],[0,1.38]], 7)
        const m = stdMat(0xeee8d6)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.82,
    },
    {
      // Tomato — flattened sphere, slight recess at stem end
      make: () => {
        const geo = lathe([[0.04,0],[0.52,0.1],[0.84,0.4],[0.9,0.78],[0.84,1.14],[0.56,1.38],[0.08,1.52],[0,1.56]])
        const m = stdMat(0xe03020)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.72,
    },
    {
      // Lemon — elongated ellipse, pointed at both tips
      make: () => {
        const geo = lathe([[0,0],[0.18,0.1],[0.52,0.42],[0.58,0.92],[0.52,1.42],[0.18,1.72],[0,1.82]])
        const m = stdMat(0xf5e040)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.72,
    },
    {
      // Avocado — pear: wide round bottom tapering to narrow neck
      make: () => {
        const geo = lathe([[0.04,0],[0.55,0.16],[0.8,0.58],[0.72,1.04],[0.52,1.48],[0.3,1.9],[0.08,2.22],[0,2.32]], 7)
        const m = stdMat(0x3d7030)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.54,
    },
    {
      // Egg — asymmetric ellipse: wider at base, tapers to blunter top
      make: () => {
        const geo = lathe([[0,0],[0.26,0.08],[0.54,0.36],[0.64,0.78],[0.6,1.18],[0.44,1.52],[0.16,1.74],[0,1.82]])
        const m = stdMat(0xf5ead0, 0.42, 0)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.7,
    },
    {
      // Bell pepper — round body with defined shoulder and stem base
      make: () => {
        const geo = lathe([[0.08,0],[0.56,0.14],[0.8,0.52],[0.82,0.94],[0.74,1.34],[0.52,1.58],[0.22,1.72],[0.1,1.88],[0,1.94]])
        const m = stdMat(0xd42010)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.64,
    },
    {
      // Mushroom — stalk (cylinder) + domed cap (lathe)
      make: () => {
        const stalkGeo = new THREE.CylinderGeometry(0.13, 0.16, 1.05, 8)
        const capGeo = lathe([[0.14,0],[0.72,0.06],[0.92,0.32],[0.74,0.62],[0.34,0.84],[0,0.9]], 8)
        const stalkMat = stdMat(0xddd0b2, 0.72, 0)
        const capMat = stdMat(0xb87840, 0.64, 0.05)
        const stalk = new THREE.Mesh(stalkGeo, stalkMat)
        const cap = new THREE.Mesh(capGeo, capMat)
        stalk.position.y = -0.12
        cap.position.y = 0.42
        const g = new THREE.Group(); g.add(stalk, cap)
        return { group: g, geos: [stalkGeo, capGeo], mats: [stalkMat, capMat] }
      },
      scale: 0.68,
    },
    {
      // Cookbook (red)
      make: () => {
        const geo = new THREE.BoxGeometry(1.4, 1.85, 0.22)
        const m = stdMat(0xb84a2e, 0.82, 0)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.65,
    },
    {
      // Cookbook (deep blue)
      make: () => {
        const geo = new THREE.BoxGeometry(1.4, 1.85, 0.22)
        const m = stdMat(0x3d5a9e, 0.82, 0)
        const g = new THREE.Group(); g.add(new THREE.Mesh(geo, m))
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.65,
    },
    {
      // Rolling pin — cylinder rotated on its side
      make: () => {
        const geo = new THREE.CylinderGeometry(0.28, 0.28, 2.5, 10)
        const m = stdMat(0xd4a878, 0.7, 0.05)
        const mesh = new THREE.Mesh(geo, m)
        mesh.rotation.z = Math.PI / 2
        const g = new THREE.Group(); g.add(mesh)
        return { group: g, geos: [geo], mats: [m] }
      },
      scale: 0.58,
    },
  ]

  interface Floater {
    group: ThreeTypes.Group
    geos: ThreeTypes.BufferGeometry[]
    mats: ThreeTypes.MeshStandardMaterial[]
    speed: number
    phase: number
    spinX: number
    spinY: number
    baseY: number
  }

  const parentGroup = new THREE.Group()
  scene.add(parentGroup)
  const floaters: Floater[] = []

  for (let i = 0; i < props.density; i++) {
    const tpl = templates[i % templates.length]
    const { group, geos, mats } = tpl.make()
    const s = tpl.scale * (0.65 + Math.random() * 0.7)
    group.scale.setScalar(s)
    group.position.set(
      (Math.random() - 0.5) * 24,
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 9 - 2,
    )
    group.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0)
    parentGroup.add(group)
    floaters.push({
      group, geos, mats,
      speed: 0.12 + Math.random() * 0.28,
      phase: Math.random() * Math.PI * 2,
      spinX: (Math.random() - 0.5) * 0.4,
      spinY: (Math.random() - 0.5) * 0.5,
      baseY: group.position.y,
    })
  }

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }
  const onPointerMove = (e: PointerEvent) => {
    pointer.targetX = e.clientX / window.innerWidth - 0.5
    pointer.targetY = e.clientY / window.innerHeight - 0.5
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true })

  const ro = new ResizeObserver(() => {
    const w = el.clientWidth || window.innerWidth
    const h = el.clientHeight || window.innerHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })
  ro.observe(el)

  const clock = new THREE.Clock()
  let frame = 0
  let stopped = false

  const renderFrame = () => {
    const t = clock.getElapsedTime()
    pointer.x += (pointer.targetX - pointer.x) * 0.05
    pointer.y += (pointer.targetY - pointer.y) * 0.05

    parentGroup.rotation.y = pointer.x * 0.3
    parentGroup.rotation.x = pointer.y * 0.2
    camera.position.x = pointer.x * 2.2
    camera.position.y = -pointer.y * 1.6
    camera.lookAt(0, 0, 0)

    for (const f of floaters) {
      f.group.position.y = f.baseY + Math.sin(t * f.speed + f.phase) * 0.7
      f.group.rotation.x += f.spinX * 0.01
      f.group.rotation.y += f.spinY * 0.01
    }
    renderer.render(scene, camera)
  }

  const loop = () => {
    if (stopped) return
    frame = requestAnimationFrame(loop)
    renderFrame()
  }

  ready.value = true

  if (reduceMotion) {
    renderFrame()
  } else {
    loop()
  }

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(frame)
    } else if (!stopped && !reduceMotion) {
      loop()
    }
  }
  document.addEventListener('visibilitychange', onVisibility)

  cleanup = () => {
    stopped = true
    cancelAnimationFrame(frame)
    window.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('visibilitychange', onVisibility)
    ro.disconnect()
    floaters.forEach((f) => {
      f.geos.forEach((g) => g.dispose())
      f.mats.forEach((m) => m.dispose())
    })
    renderer.dispose()
    if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div ref="container" class="absolute inset-0 transition-opacity duration-700" :class="ready ? 'opacity-100' : 'opacity-0'" aria-hidden="true"></div>
</template>
