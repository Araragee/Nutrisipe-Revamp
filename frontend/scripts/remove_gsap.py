import re
with open('/Users/dex/Documents/Nutrisipe-Revamp/frontend/src/views/LoginView.vue', 'r') as f:
    content = f.read()

# Remove gsap imports
content = re.sub(r"import \{ gsap \}.*\n", "", content)
content = re.sub(r"import \{ ScrollTrigger \}.*\n", "", content)
content = re.sub(r"gsap\.registerPlugin\(ScrollTrigger\)\n", "", content)
content = re.sub(r"let gsapCtx: gsap\.Context \| null = null\n", "", content)

# Remove onBeforeUnmount gsaptCtx
content = re.sub(r"onBeforeUnmount\(\(\) => gsapCtx\?\.revert\(\)\)\n", "", content)

# Remove gsap logic in onMounted
gsap_logic = """  gsapCtx = gsap.context(() => {
    // ── Hero stat counters ──
    STATS.forEach((stat, i) => {
      const obj = { v: 0 }
      gsap.to(obj, {
        v: stat.target,
        duration: 1.6,
        delay: 0.3,
        ease: 'power2.out',
        onUpdate: () => {
          statDisplays.value[i] = formatStat(obj.v, stat)
        },
      })
    })

    // ── Scroll reveals ── (clear inline props on finish so CSS hover/tilt still works)
    gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            onComplete: () => {
              el.classList.add('revealed')
              gsap.set(el, { clearProps: 'opacity,transform' })
            },
          })
        },
      })
    })

    // ── "How it works" — bowl fills as each step scrolls in (desktop) ──
    const isDesktop = window.matchMedia('(min-width: 768px)').matches
    if (isDesktop) {
      // Hide every layer; reveal cumulatively per step.
      gsap.set('.pl-item', { opacity: 0, scale: 0.4, transformBox: 'fill-box', transformOrigin: 'center' })
      gsap.set('.pl-fork', { opacity: 0, y: 28, transformBox: 'fill-box', transformOrigin: 'center' })

      const stages: string[][] = [
        ['.pl-base'],
        ['.pl-grain', '.pl-top'],
        ['.pl-garnish', '.pl-fork'],
      ]
      const stepEls = gsap.utils.toArray<HTMLElement>('.how-step')
      let reached = -1

      const revealStage = (target: number) => {
        for (let s = reached + 1; s <= target; s++) {
          const sel = stages[s]
          if (sel.includes('.pl-fork')) {
            gsap.to('.pl-fork', { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.6)' })
          }
          const itemSel = sel.filter((x) => x !== '.pl-fork').map((x) => `${x} .pl-item`).join(',')
          if (itemSel) {
            gsap.to(itemSel, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.7)' })
          }
        }
        reached = Math.max(reached, target)
      }

      stepEls.forEach((step, i) => {
        const activate = () => {
          stepEls.forEach((s, idx) => s.classList.toggle('is-active', idx === i))
          revealStage(i)
        }
        ScrollTrigger.create({
          trigger: step,
          start: 'top 65%',
          end: 'bottom 35%',
          onEnter: activate,
          onEnterBack: activate,
        })
      })
    } else {
      // ── Mobile: pin section, stack step cards one-by-one then unpin ──
      const howSection = document.querySelector<HTMLElement>('.section-how')!
      const mStepEls = gsap.utils.toArray<HTMLElement>('.how-step')
      const plateWrapper = document.querySelector<HTMLElement>('.plate-stage > div')!
      const vh = window.innerHeight
      const N = mStepEls.length - 1 // transitions needed = 2

      // Compact layout so bowl + all 3 cards fit in one viewport
      gsap.set(howSection, { paddingTop: 32, paddingBottom: 0 })
      gsap.set('.section-how .max-w-2xl', { marginBottom: 12 })
      gsap.set(plateWrapper, { maxWidth: '200px' })
      gsap.set('.section-how .grid', { rowGap: 16 })

      // Bowl layers
      gsap.set('.pl-item', { opacity: 0, scale: 0.4, transformBox: 'fill-box', transformOrigin: 'center' })
      gsap.set('.pl-fork', { opacity: 0, y: 28, transformBox: 'fill-box', transformOrigin: 'center' })

      const mStages: string[][] = [
        ['.pl-base'],
        ['.pl-grain', '.pl-top'],
        ['.pl-garnish', '.pl-fork'],
      ]
      let mReached = -1
      const revealM = (i: number) => {
        for (let s = mReached + 1; s <= i; s++) {
          const sel = mStages[s]
          if (sel.includes('.pl-fork'))
            gsap.to('.pl-fork', { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.6)' })
          const itemSel = sel.filter((x) => x !== '.pl-fork').map((x) => `${x} .pl-item`).join(',')
          if (itemSel) gsap.to(itemSel, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.7)' })
        }
        mReached = Math.max(mReached, i)
      }

      // Card 01 visible; cards 02+ hidden below their natural positions
      mStepEls.forEach((el, i) => {
        gsap.set(el, {
          paddingTop: 10, paddingBottom: 10,
          opacity: i === 0 ? 1 : 0,
          y: i === 0 ? 0 : 40,
        })
      })
      revealM(0)

      const mShown = new Set<number>([0])

      // Pin for (N+1) × 40vh; cards reveal at each 40vh, last interval holds all 3 before unpin
      ScrollTrigger.create({
        trigger: howSection,
        start: 'top top',
        end: `+=${(N + 1) * vh * 0.4}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const numVisible = 1 + Math.min(Math.floor(self.progress * (N + 1) + 0.001), N)
          for (let i = 1; i < numVisible; i++) {
            if (!mShown.has(i)) {
              mShown.add(i)
              gsap.to(mStepEls[i], { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', delay: i === N ? 0.35 : 0 })
              revealM(i)
            }
          }
        },
      })
    }
  }, pageRef.value ?? undefined)"""

intersection_observer_logic = """  // Use IntersectionObserver instead of GSAP
  statDisplays.value = STATS.map(s => formatStat(s.target, s))

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
        entry.target.classList.add('is-active')
        // For bowl layers, we can just reveal them all if we scroll, or just let CSS do it.
        const plItems = document.querySelectorAll('.pl-item, .pl-fork')
        plItems.forEach(el => {
          el.classList.add('revealed-pl')
        })
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.1 })

  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    document.querySelectorAll('.how-step').forEach(el => observer.observe(el))
  }, 100)
"""

content = content.replace(gsap_logic, intersection_observer_logic)

# Replace IngredientField3D
content = re.sub(r"import IngredientField3D from '@/components/common/IngredientField3D\.vue'\n", "", content)
content = re.sub(r"<IngredientField3D :density=\"11\" />", "", content)

with open('/Users/dex/Documents/Nutrisipe-Revamp/frontend/src/views/LoginView.vue', 'w') as f:
    f.write(content)
