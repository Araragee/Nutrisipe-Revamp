<script setup lang="ts" generic="T">
/**
 * Null-safe port of @yeger/vue-masonry-wall (v6.1.1).
 *
 * The upstream component reads `wall.value.children` / `wall.value.getBoundingClientRect()`
 * inside async (`await nextTick()`) layout passes without guarding the ref. On rapid
 * navigation or a post-login RouterView remount the component unmounts mid-pass, leaving
 * `wall.value` null → "Cannot read properties of null (reading 'children')" surfacing through
 * the Vue error boundary. Every ref access here bails when the element is gone.
 */
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    items: T[]
    columnWidth?: number | number[]
    gap?: number
    rtl?: boolean
    ssrColumns?: number
    scrollContainer?: HTMLElement | null
    minColumns?: number
    maxColumns?: number
    keyMapper?: (item: T, column: number, row: number, index: number) => string | number
  }>(),
  {
  columnWidth: 400,
  gap: 0,
  rtl: false,
  ssrColumns: 0,
  scrollContainer: null,
  minColumns: 1,
})

const emit = defineEmits<{
  redraw: []
  redrawSkip: []
}>()

const columns = ref<number[][]>([])
const wall = useTemplateRef<HTMLDivElement>('wall')

function createColumns(count: number): number[][] {
  return Array.from({ length: count }).map(() => [])
}

function getColumnWidthTarget(columnIndex: number): number {
  const widths = Array.isArray(props.columnWidth) ? props.columnWidth : [props.columnWidth]
  return widths[columnIndex % widths.length]
}

function countIteratively(containerWidth: number, gap: number, count: number, consumed: number): number {
  const nextWidth = getColumnWidthTarget(count)
  if (consumed + gap + nextWidth <= containerWidth) {
    return countIteratively(containerWidth, gap, count + 1, consumed + gap + nextWidth)
  }
  return count
}

function belowMax(count: number): number {
  if (!props.maxColumns) return count
  return Math.min(count, props.maxColumns)
}

function aboveMin(count: number): number {
  return Math.max(count, props.minColumns)
}

function columnCount(): number {
  const el = wall.value
  if (!el) return columns.value.length || props.minColumns
  const boundedCount = aboveMin(belowMax(countIteratively(el.getBoundingClientRect().width, props.gap, 0, -props.gap)))
  return boundedCount > 0 ? boundedCount : 1
}

if (props.ssrColumns > 0) {
  const newColumns = createColumns(props.ssrColumns)
  for (let i = 0; i < props.items.length; i++) newColumns[i % props.ssrColumns].push(i)
  columns.value = newColumns
}

let currentRedrawId = 0

async function fillColumns(itemIndex: number, assignedRedrawId: number): Promise<void> {
  if (itemIndex >= props.items.length) return
  await nextTick()
  if (currentRedrawId !== assignedRedrawId) return
  const el = wall.value
  if (!el) return // unmounted mid-pass — bail instead of dereferencing null
  const children = [...el.children] as HTMLElement[]
  if (children.length === 0) return
  const target = children.reduce((prev, curr) =>
    curr.getBoundingClientRect().height < prev.getBoundingClientRect().height ? curr : prev,
  )
  const targetIndex = Number(target.dataset.index)
  columns.value[targetIndex]?.push(itemIndex)
  await fillColumns(itemIndex + 1, assignedRedrawId)
}

async function redraw(force = false): Promise<void> {
  if (!wall.value) return
  const newColumnCount = columnCount()
  if (columns.value.length === newColumnCount && !force) {
    emit('redrawSkip')
    return
  }
  columns.value = createColumns(newColumnCount)
  const scrollY = props.scrollContainer ? props.scrollContainer.scrollTop : window.scrollY
  await fillColumns(0, ++currentRedrawId)
  if (props.scrollContainer) props.scrollContainer.scrollBy({ top: scrollY - props.scrollContainer.scrollTop })
  else window.scrollTo({ top: scrollY })
  emit('redraw')
}

let resizeObserver: ResizeObserver | undefined
if (typeof ResizeObserver !== 'undefined') {
  let scheduled = false
  resizeObserver = new ResizeObserver(() => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      redraw()
    })
  })
}

onMounted(async () => {
  await redraw()
  if (wall.value) resizeObserver?.observe(wall.value)
})

onBeforeUnmount(() => {
  if (wall.value) resizeObserver?.unobserve(wall.value)
  resizeObserver?.disconnect()
})

watch(() => props.items, () => redraw(true))
watch(
  [() => props.columnWidth, () => props.gap, () => props.minColumns, () => props.maxColumns],
  () => redraw(),
)
</script>

<template>
  <div
    ref="wall"
    class="masonry-wall"
    :style="{ display: 'flex', gap: `${gap}px`, flexDirection: rtl ? 'row-reverse' : undefined }"
  >
    <div
      v-for="(column, columnIndex) in columns"
      :key="columnIndex"
      class="masonry-column"
      :data-index="columnIndex"
      :style="{
        display: 'flex',
        flexBasis: `${getColumnWidthTarget(columnIndex)}px`,
        flexDirection: 'column',
        flexGrow: 1,
        height: 'max-content',
        gap: `${gap}px`,
        minWidth: 0,
      }"
    >
      <div
        v-for="(itemIndex, row) in column"
        :key="keyMapper?.(items[itemIndex], columnIndex, row, itemIndex) ?? itemIndex"
        class="masonry-item"
      >
        <slot
          :item="items[itemIndex]"
          :column="columnIndex"
          :column-count="columns.length"
          :row="row"
          :index="itemIndex"
        >
          {{ items[itemIndex] }}
        </slot>
      </div>
    </div>
  </div>
</template>
