import { computed, ref, watch } from 'vue'
import { useI18n } from '@/i18n'
import { useDrawSessionStore } from '@/stores/drawSession'
import {
  recognizeStrokes,
  generateBeautifiedStrokes,
  createGeometryShapeFromResult,
  createSgkPresetGeometryShape,
  SGK_GEOMETRY_PRESETS,
  extractCleanCorners,
  getShapeLabel,
  boundingBox,
  generateSampleVideoEquations,
} from '@/utils/strokeRecognizer'

export const WRITING_BOARD_KEY = Symbol('writingBoard')

const DEFAULT_PEN = '#c2410c'
const BOARD_PEN = '#f8fafc'
const PEN_PALETTE = ['#f8fafc', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#fb7185']

const STORAGE_PEN_COLOR = 'dynageo_board_pen_color'
const STORAGE_PEN_WIDTH = 'dynageo_board_pen_width'
const STORAGE_PEN_OPACITY = 'dynageo_board_pen_opacity'
const STORAGE_PEN_STYLE = 'dynageo_board_pen_style'

function normToPixel(nx, ny, w, h) {
  return { x: nx * w, y: ny * h }
}

function distPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-12) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const qx = ax + t * dx
  const qy = ay + t * dy
  return Math.hypot(px - qx, py - qy)
}

export function createWritingBoard(mainCanvasRef) {
  const drawSession = useDrawSessionStore()
  const { t } = useI18n()

  const overlayRef = ref(null)
  const strokes = ref([])
  const writingPointerId = ref(null)
  const writingDraft = ref(null)
  const writingTool = ref('pen')
  const selectedStrokeIds = ref([])
  const selectedStrokeId = computed({
    get: () => selectedStrokeIds.value[0] || null,
    set: (id) => {
      selectedStrokeIds.value = id ? [id] : []
    },
  })
  const savedPenWidth = Number(localStorage.getItem(STORAGE_PEN_WIDTH)) || 3
  const savedPenColor = localStorage.getItem(STORAGE_PEN_COLOR) || DEFAULT_PEN
  const savedPenOpacity = Number(localStorage.getItem(STORAGE_PEN_OPACITY)) || 1
  const savedPenStyle = localStorage.getItem(STORAGE_PEN_STYLE) || 'solid'

  const penWidth = ref(savedPenWidth)
  const penColor = ref(savedPenColor)
  const penOpacity = ref(savedPenOpacity) // 0.1 -> 1.0 (Độ đậm nhạt của nét vẽ)
  const penStyle = ref(savedPenStyle) // 'solid' | 'dashed' | 'dotted' | 'arrow'

  watch(penWidth, (val) => {
    try {
      localStorage.setItem(STORAGE_PEN_WIDTH, String(val))
    } catch {
      /* ignore */
    }
  })

  watch(penColor, (val) => {
    try {
      localStorage.setItem(STORAGE_PEN_COLOR, String(val))
    } catch {
      /* ignore */
    }
  })

  watch(penOpacity, (val) => {
    try {
      localStorage.setItem(STORAGE_PEN_OPACITY, String(val))
    } catch {
      /* ignore */
    }
    repaint()
  })

  watch(penStyle, (val) => {
    try {
      localStorage.setItem(STORAGE_PEN_STYLE, String(val))
    } catch {
      /* ignore */
    }
    repaint()
  })
  const showGrid = ref(false)
  const moveDrag = ref(null)
  const regionDraft = ref(null)
  const regionSelection = ref(null)
  const standardLabels = ref([])
  const regionSidePanels = ref([])
  const smartShapeMode = ref(true)
  const interactiveDemos = ref([])
  const geometricShapes = ref([])
  const lastBeautifiedNotice = ref(null)
  const lastBeautifiedUndo = ref(null)
  let writingStrokeSeq = 0
  let demoSeq = 0

  // ==================== CÔNG CỤ GIẢNG DẠY (TEACHING TOOLS) ====================
  // 1. Hệ thống đơn vị đo lường bảng
  const boardUnit = ref('cm') // 'cm' | 'mm' | 'dm' | 'm' | 'đv'
  const unitDefinitions = {
    cm: { label: 'cm', pxPerUnit: 37.8, defaultLength: 378 }, // ~10cm = 378px
    mm: { label: 'mm', pxPerUnit: 3.78, defaultLength: 378 },
    dm: { label: 'dm', pxPerUnit: 378, defaultLength: 378 },
    m: { label: 'm', pxPerUnit: 3780, defaultLength: 378 },
    đv: { label: 'đv', pxPerUnit: 37.8, defaultLength: 378 },
  }

  function pxToUnit(px, unit = boardUnit.value) {
    const def = unitDefinitions[unit] || unitDefinitions.cm
    return px / def.pxPerUnit
  }

  function unitToPx(val, unit = boardUnit.value) {
    const def = unitDefinitions[unit] || unitDefinitions.cm
    return Number(val) * def.pxPerUnit
  }

  function formatBoardLength(px, unit = boardUnit.value) {
    const val = pxToUnit(px, unit)
    if (unit === 'mm') return `${Math.round(val)} mm`
    if (unit === 'm') return `${val.toFixed(2)} m`
    if (unit === 'dm') return `${val.toFixed(2)} dm`
    return `${val.toFixed(1)} ${unit}`
  }

  function setBoardUnit(unit) {
    if (unitDefinitions[unit]) {
      boardUnit.value = unit
    }
  }

  const laserPoints = ref([])
  const showRuler = ref(false)
  const rulerState = ref({
    x: 280,
    y: 260,
    angle: 0,
    length: 378,
    alignMode: 'free', // 'free' | 'horizontal' | 'vertical'
  })
  const rulerDrawingLive = ref({
    active: false,
    lengthPx: 0,
    text: '',
    px: 0,
    py: 0,
  })

  function setRulerAlignMode(mode) {
    if (!rulerState.value) return
    rulerState.value.alignMode = mode
    if (mode === 'horizontal') {
      rulerState.value.angle = 0
    } else if (mode === 'vertical') {
      rulerState.value.angle = 90
    }
  }

  // 2. Compa (Drafting Compass)
  const showCompass = ref(false)
  const compassState = ref({
    centerX: 420,
    centerY: 320,
    radius: 132.3, // ~3.5 cm
    angle: 0,
    sweepAngle: 360,
    isSweeping: false,
    mode: 'free', // 'free' | 'pickCenter'
  })

  function toggleCompass(val) {
    showCompass.value = typeof val === 'boolean' ? val : !showCompass.value
  }

  function insertCircleStroke({
    cx,
    cy,
    radius,
    startAngle = 0,
    sweepAngle = 360,
    color = penColor.value,
    width = penWidth.value,
  }) {
    const ann = overlayRef.value
    if (!ann) return
    const rect = ann.getBoundingClientRect()
    const w = rect.width || ann.width || 800
    const h = rect.height || ann.height || 600

    const span = Math.abs(sweepAngle)
    const steps = Math.max(16, Math.min(120, Math.round((span / 360) * 72)))
    const pts = []
    for (let i = 0; i <= steps; i++) {
      const frac = i / steps
      const deg = startAngle + frac * sweepAngle
      const rad = (deg * Math.PI) / 180
      const px = cx + radius * Math.cos(rad)
      const py = cy + radius * Math.sin(rad)
      pts.push({
        nx: Math.max(0, Math.min(1, px / w)),
        ny: Math.max(0, Math.min(1, py / h)),
      })
    }

    const isFull = span >= 355
    const lenText = formatBoardLength(radius)
    strokes.value.push({
      id: nextWritingStrokeId(),
      color,
      width,
      points: pts,
    })
    recordAction(isFull ? `Vẽ đường tròn R = ${lenText}` : `Vẽ cung tròn ${Math.round(span)}° (R = ${lenText})`)
    repaint()
  }

  const showProtractor = ref(false)
  const protractorState = ref({ x: 380, y: 300, angle: 0, radius: 145, needleAngle: 50 })
  const showFunctionGrapher = ref(false)
  const showTeachingCard = ref(false)

  function toggleRuler(val) {
    showRuler.value = typeof val === 'boolean' ? val : !showRuler.value
  }

  function toggleProtractor(val) {
    showProtractor.value = typeof val === 'boolean' ? val : !showProtractor.value
  }

  function toggleFunctionGrapher(val) {
    showFunctionGrapher.value = typeof val === 'boolean' ? val : !showFunctionGrapher.value
  }

  function toggleTeachingCard(val) {
    showTeachingCard.value = typeof val === 'boolean' ? val : !showTeachingCard.value
  }

  function projectPointToRulerEdge(px, py) {
    if (!showRuler.value || !rulerState.value) return null
    const { x, y, angle, length } = rulerState.value
    const rad = (angle * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    // Cạnh trên của thước: y' = -34px relative to center
    const topEdgeCx = x + 34 * sin
    const topEdgeCy = y - 34 * cos

    const dx = px - topEdgeCx
    const dy = py - topEdgeCy

    const tau = dx * cos + dy * sin
    const perpDist = Math.abs(-dx * sin + dy * cos)
    const half = length / 2

    if (perpDist <= 32 && tau >= -half - 20 && tau <= half + 20) {
      const clampedTau = Math.max(-half, Math.min(half, tau))
      const snappedX = topEdgeCx + clampedTau * cos
      const snappedY = topEdgeCy + clampedTau * sin
      return {
        snappedX,
        snappedY,
        tau: clampedTau,
        topEdgeCx,
        topEdgeCy,
        cos,
        sin,
        half,
      }
    }
    return null
  }

  function drawRulerLine() {
    const ann = overlayRef.value
    if (!ann) return
    const rect = ann.getBoundingClientRect()
    const w = rect.width || ann.width || 800
    const h = rect.height || ann.height || 600
    const { x, y, angle, length } = rulerState.value
    const rad = (angle * Math.PI) / 180
    const half = length / 2
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    // Cạnh trên của thước kẻ
    const topEdgeCx = x + 34 * sin
    const topEdgeCy = y - 34 * cos
    const p1x = topEdgeCx - half * cos
    const p1y = topEdgeCy - half * sin
    const p2x = topEdgeCx + half * cos
    const p2y = topEdgeCy + half * sin
    const newStroke = {
      id: nextWritingStrokeId(),
      color: penColor.value,
      width: penWidth.value,
      points: [
        { nx: Math.max(0, Math.min(1, p1x / w)), ny: Math.max(0, Math.min(1, p1y / h)) },
        { nx: Math.max(0, Math.min(1, p2x / w)), ny: Math.max(0, Math.min(1, p2y / h)) },
      ],
    }
    strokes.value.push(newStroke)
    recordAction(`Vẽ đoạn thẳng ${formatBoardLength(length)} theo thước kẻ`)
    repaint()
  }

  function insertFunctionGraphStrokes({ points, axes, label, centerNx = 0.5, centerNy = 0.5 }) {
    if (axes?.length) {
      for (const ax of axes) {
        strokes.value.push({
          id: nextWritingStrokeId(),
          color: 'rgba(148, 163, 184, 0.75)',
          width: 2,
          points: ax.map(p => ({ nx: p.nx, ny: p.ny })),
        })
      }
    }
    if (points?.length) {
      strokes.value.push({
        id: nextWritingStrokeId(),
        color: '#38bdf8',
        width: 3.5,
        points: points.map(p => ({ nx: p.nx, ny: p.ny })),
      })
    }
    if (label) {
      standardLabels.value.push({
        nx: centerNx,
        ny: Math.max(0.08, centerNy - 0.16),
        text: label,
        color: '#38bdf8',
      })
    }
    recordAction(`Chèn đồ thị ${label || 'hàm số'}`)
    repaint()
  }

  // ==================== CÔNG CỤ VẼ HÌNH TỪ ĐỀ BÀI (PROBLEM GEOMETRY TOOL) ====================
  const showProblemGeometryTool = ref(false)
  const problemGeometryFrames = ref([])
  let problemFrameSeq = 0

  function toggleProblemGeometryTool(val) {
    showProblemGeometryTool.value = typeof val === 'boolean' ? val : !showProblemGeometryTool.value
  }

  function addProblemGeometryFrame({ problem, spec, meta, paramValues, x, y, width, height }) {
    problemFrameSeq += 1
    const frameId = `pgf_${problemFrameSeq}_${Date.now()}`
    const defaultX = x ?? (160 + (problemGeometryFrames.value.length % 4) * 40)
    const defaultY = y ?? (90 + (problemGeometryFrames.value.length % 4) * 30)
    const newFrame = {
      id: frameId,
      problem: String(problem || '').trim(),
      spec,
      meta: meta || {},
      paramValues: { ...(paramValues || {}) },
      x: defaultX,
      y: defaultY,
      width: width || 460,
      height: height || 380,
      view: {
        yaw: 35,
        pitch: -20,
        roll: 0,
        zoom: 1,
        panX: 0,
        panY: 0,
      },
    }
    problemGeometryFrames.value.push(newFrame)
    recordAction(`Vẽ hình: ${meta?.title || spec?.title || 'Đề bài toán'}`)
    return newFrame
  }

  function removeProblemGeometryFrame(id) {
    problemGeometryFrames.value = problemGeometryFrames.value.filter(f => f.id !== id)
    recordAction('Xóa khung hình bài toán')
  }

  // ==================== LỊCH SỬ THAO TÁC & HOÀN TÁC (UNDO / REDO) ====================
  const historyStack = ref([])
  const historyIndex = ref(-1)
  let isRestoringHistory = false
  let erasedAnyDuringDrag = false

  function createSnapshot(title = 'Thao tác') {
    return {
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      strokes: JSON.parse(JSON.stringify(strokes.value || [])),
      geometricShapes: JSON.parse(JSON.stringify(geometricShapes.value || [])),
      interactiveDemos: JSON.parse(JSON.stringify(interactiveDemos.value || [])),
      problemGeometryFrames: JSON.parse(JSON.stringify(problemGeometryFrames.value || [])),
      standardLabels: JSON.parse(JSON.stringify(standardLabels.value || [])),
    }
  }

  function recordAction(title = 'Thao tác') {
    if (isRestoringHistory) return
    const snap = createSnapshot(title)
    if (historyIndex.value < historyStack.value.length - 1) {
      historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
    }
    historyStack.value.push(snap)
    if (historyStack.value.length > 60) {
      historyStack.value.shift()
    }
    historyIndex.value = historyStack.value.length - 1
  }

  function restoreSnapshot(snap) {
    if (!snap) return
    isRestoringHistory = true
    try {
      strokes.value = JSON.parse(JSON.stringify(snap.strokes || []))
      geometricShapes.value = JSON.parse(JSON.stringify(snap.geometricShapes || []))
      interactiveDemos.value = JSON.parse(JSON.stringify(snap.interactiveDemos || []))
      problemGeometryFrames.value = JSON.parse(JSON.stringify(snap.problemGeometryFrames || []))
      standardLabels.value = JSON.parse(JSON.stringify(snap.standardLabels || []))
      selectedStrokeId.value = null
      clearRegionSelection()
      repaint()
    } finally {
      isRestoringHistory = false
    }
  }

  function undo() {
    if (historyIndex.value <= 0) return false
    historyIndex.value -= 1
    restoreSnapshot(historyStack.value[historyIndex.value])
    return true
  }

  function redo() {
    if (historyIndex.value >= historyStack.value.length - 1) return false
    historyIndex.value += 1
    restoreSnapshot(historyStack.value[historyIndex.value])
    return true
  }

  function jumpToHistory(idx) {
    if (idx < 0 || idx >= historyStack.value.length) return
    historyIndex.value = idx
    restoreSnapshot(historyStack.value[idx])
  }

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value >= 0 && historyIndex.value < historyStack.value.length - 1)

  // Khởi tạo snapshot trạng thái bảng ban đầu
  recordAction('Bảng ban đầu')

  const active = computed(() => drawSession.writingBoard)

  const toolHint = computed(() => {
    if (writingTool.value === 'hand') return t('structure.writingHandHint')
    if (writingTool.value === 'eraser') return t('board.toolEraserHint')
    if (writingTool.value === 'region') return t('board.toolRegionHint')
    if (writingTool.value === 'highlighter') return 'Bút dạ quang: Đánh dấu làm nổi bật dữ kiện & kết luận bài toán'
    if (writingTool.value === 'laser') return 'Bút laser: Thuyết trình giảng giải với vệt sáng tự động mờ dần'
    return t('structure.writingPenHint')
  })

  watch(
    () => drawSession.writingOnly,
    (board) => {
      const storedColor = localStorage.getItem(STORAGE_PEN_COLOR)
      if (board) {
        penColor.value = storedColor || BOARD_PEN
        showGrid.value = true
      } else {
        penColor.value = storedColor || DEFAULT_PEN
        showGrid.value = false
      }
    },
    { immediate: true },
  )

  function toggleGrid() {
    showGrid.value = !showGrid.value
    repaint()
  }

  function setPenColor(color) {
    if (typeof color === 'string' && color) penColor.value = color
  }

  function setPenOpacity(val) {
    const num = Math.max(0.1, Math.min(1, Number(val) || 1))
    penOpacity.value = Math.round(num * 100) / 100
  }

  function setPenStyle(style) {
    if (['solid', 'dashed', 'dotted', 'arrow'].includes(style)) {
      penStyle.value = style
    }
  }

  function setOverlayEl(el) {
    overlayRef.value = el
    if (active.value) repaint()
  }

  function nextWritingStrokeId() {
    writingStrokeSeq += 1
    return `wb_${writingStrokeSeq}`
  }

  function normalizeRegion(rect) {
    if (!rect) return null
    let x0 = rect.nx0 !== undefined ? rect.nx0 : (rect.minX !== undefined ? rect.minX : rect.x0)
    let x1 = rect.nx1 !== undefined ? rect.nx1 : (rect.maxX !== undefined ? rect.maxX : rect.x1)
    let y0 = rect.ny0 !== undefined ? rect.ny0 : (rect.minY !== undefined ? rect.minY : rect.y0)
    let y1 = rect.ny1 !== undefined ? rect.ny1 : (rect.maxY !== undefined ? rect.maxY : rect.y1)

    if (x0 === undefined && rect.cx !== undefined && rect.width !== undefined) {
      x0 = rect.cx - rect.width / 2
      x1 = rect.cx + rect.width / 2
    }
    if (y0 === undefined && rect.cy !== undefined && rect.height !== undefined) {
      y0 = rect.cy - rect.height / 2
      y1 = rect.cy + rect.height / 2
    }

    if (
      typeof x0 !== 'number' || Number.isNaN(x0) ||
      typeof x1 !== 'number' || Number.isNaN(x1) ||
      typeof y0 !== 'number' || Number.isNaN(y0) ||
      typeof y1 !== 'number' || Number.isNaN(y1)
    ) {
      return null
    }

    return {
      nx0: Math.min(x0, x1),
      nx1: Math.max(x0, x1),
      ny0: Math.min(y0, y1),
      ny1: Math.max(y0, y1),
    }
  }

  function regionMeaningful(rect) {
    const r = normalizeRegion(rect)
    if (!r) return false
    return r.nx1 - r.nx0 >= 0.02 && r.ny1 - r.ny0 >= 0.02
  }

  function strokeIntersectsRegion(stroke, rect) {
    const r = normalizeRegion(rect)
    if (!r || !stroke?.points?.length) return false
    for (const p of stroke.points) {
      if (p.nx >= r.nx0 && p.nx <= r.nx1 && p.ny >= r.ny0 && p.ny <= r.ny1) return true
    }
    return false
  }

  function overlayNormFromEvent(e) {
    const ann = overlayRef.value
    if (!ann) return null
    const rect = ann.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    return {
      nx: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      ny: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
  }

  function hitTestWritingStroke(nx, ny) {
    const ann = overlayRef.value
    if (!ann) return null
    const w = ann.width
    const h = ann.height
    const px = nx * w
    const py = ny * h
    let bestId = null
    let bestD = Infinity
    const extra = writingTool.value === 'eraser' ? 14 : 0
    for (let i = strokes.value.length - 1; i >= 0; i -= 1) {
      const stroke = strokes.value[i]
      const pts = stroke.points || []
      const thresh = (stroke.width || 3) + 10 + extra
      if (pts.length === 1) {
        const a = normToPixel(pts[0].nx, pts[0].ny, w, h)
        const d = Math.hypot(px - a.x, py - a.y)
        if (d < thresh && d < bestD) {
          bestD = d
          bestId = stroke.id
        }
        continue
      }
      for (let j = 1; j < pts.length; j += 1) {
        const a = normToPixel(pts[j - 1].nx, pts[j - 1].ny, w, h)
        const b = normToPixel(pts[j].nx, pts[j].ny, w, h)
        const d = distPointToSegment(px, py, a.x, a.y, b.x, b.y)
        if (d < thresh && d < bestD) {
          bestD = d
          bestId = stroke.id
        }
      }
    }
    return bestId
  }

  let laserAnimFrame = null

  function drawLaserTrail(ctx, w, h) {
    if (!laserPoints.value.length) return
    const now = performance.now()
    laserPoints.value = laserPoints.value.filter(pt => now - pt.time < 1200)
    if (!laserPoints.value.length) return

    const pts = laserPoints.value
    ctx.save()
    for (let i = 1; i < pts.length; i++) {
      const p1 = pts[i - 1]
      const p2 = pts[i]
      const age = now - p2.time
      const alpha = Math.max(0, 1 - age / 1200)
      if (alpha <= 0.02) continue

      ctx.lineWidth = Math.max(2, 6 * alpha)
      ctx.strokeStyle = `rgba(244, 63, 94, ${alpha * 0.95})`
      ctx.shadowColor = '#f43f5e'
      ctx.shadowBlur = 12 * alpha
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }

    // Glowing head at latest point
    const last = pts[pts.length - 1]
    const lastAge = now - last.time
    if (lastAge < 500) {
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#fb7185'
      ctx.shadowBlur = 16
      ctx.beginPath()
      ctx.arc(last.x, last.y, 4.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()

    if (laserAnimFrame) cancelAnimationFrame(laserAnimFrame)
    laserAnimFrame = requestAnimationFrame(repaint)
  }

  function repaint() {
    const ann = overlayRef.value
    const main = mainCanvasRef.value
    if (!ann || !main) return
    const w = main.width
    const h = main.height
    if (w < 1 || h < 1) return
    if (ann.width !== w || ann.height !== h) {
      ann.width = w
      ann.height = h
    }
    const ctx = ann.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, w, h)
    if (showGrid.value) drawCoordinateGrid(ctx, w, h)
    const hasInk =
      strokes.value.length ||
      writingDraft.value ||
      laserPoints.value.length ||
      standardLabels.value.length ||
      regionSidePanels.value.length ||
      regionSelection.value ||
      regionDraft.value
    if (!active.value && !hasInk) return

    paintInk(ctx, w, h, { highlightSelected: true })
    if (selectedStrokeId.value && writingTool.value === 'hand') {
      const sel = strokes.value.find((s) => s.id === selectedStrokeId.value)
      if (sel?.points?.length) {
        ctx.save()
        ctx.setLineDash([6, 4])
        ctx.lineWidth = 2
        ctx.strokeStyle = '#22c55e'
        ctx.beginPath()
        sel.points.forEach((p, i) => {
          const { x, y } = normToPixel(p.nx, p.ny, w, h)
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }
    }
    drawSidePanels(ctx, w, h)
    drawRegionOverlay(ctx, w, h)
    drawLaserTrail(ctx, w, h)
  }

  function computeSideRect(sourceRect, opts = {}) {
    const widthFrac = opts.widthFrac ?? 0.34
    const gap = opts.gap ?? 0.012
    const r = normalizeRegion(sourceRect)
    if (!r) return { nx: 0.55, ny: 0.2, nw: widthFrac, nh: 0.28, place: 'right' }
    const rh = Math.max(0.1, r.ny1 - r.ny0)
    const nh = Math.min(0.52, Math.max(rh + 0.04, 0.22))
    const nw = Math.min(widthFrac, 0.44)
    let nx = r.nx1 + gap
    let place = 'right'
    if (nx + nw > 0.985) {
      nx = r.nx0 - gap - nw
      place = 'left'
    }
    nx = Math.max(0.01, Math.min(0.99 - nw, nx))
    let ny = (r.ny0 + r.ny1) / 2 - nh / 2
    ny = Math.max(0.02, Math.min(0.98 - nh, ny))
    return { nx, ny, nw, nh, place }
  }

  function addSideTextPanel(sourceRect, kind, payload) {
    const pos = computeSideRect(sourceRect)
    regionSidePanels.value.push({
      id: nextWritingStrokeId(),
      kind,
      ...pos,
      title: String(payload?.title || '').trim(),
      lines: (payload?.lines || []).map(String).filter(Boolean),
    })
    repaint()
  }

  function addSideGraphPanel(sourceRect, spec, paramValues = {}) {
    if (!spec) return
    const pos = computeSideRect(sourceRect, { widthFrac: 0.38 })
    regionSidePanels.value.push({
      id: nextWritingStrokeId(),
      kind: 'graph',
      ...pos,
      spec,
      paramValues: { ...paramValues },
    })
  }

  function drawSidePanels(ctx, w, h) {
    for (const panel of regionSidePanels.value) {
      if (panel.kind === 'graph') continue
      const x = panel.nx * w
      const y = panel.ny * h
      const pw = panel.nw * w
      const ph = panel.nh * h
      const r = 10
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + pw - r, y)
      ctx.quadraticCurveTo(x + pw, y, x + pw, y + r)
      ctx.lineTo(x + pw, y + ph - r)
      ctx.quadraticCurveTo(x + pw, y + ph, x + pw - r, y + ph)
      ctx.lineTo(x + r, y + ph)
      ctx.quadraticCurveTo(x, y + ph, x, y + ph - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)'
      ctx.fill()
      ctx.strokeStyle =
        panel.kind === 'solve' ? 'rgba(250, 204, 21, 0.55)' : 'rgba(96, 165, 250, 0.5)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      let ty = y + 14
      const padX = 10
      const innerW = pw - padX * 2
      if (panel.title) {
        ctx.font = '700 12px system-ui, sans-serif'
        ctx.fillStyle = '#f1f5f9'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText(panel.title, x + padX, ty, innerW)
        ty += 18
      }
      ctx.font = '500 13px system-ui, sans-serif'
      ctx.fillStyle = '#e2e8f0'
      for (const line of panel.lines || []) {
        const wrapped = wrapTextLines(ctx, line, innerW)
        for (const ln of wrapped) {
          if (ty > y + ph - 12) break
          ctx.fillText(ln, x + padX, ty, innerW)
          ty += 16
        }
        ty += 4
      }
      ctx.restore()
    }
  }

  function wrapTextLines(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/)
    const lines = []
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    return lines.length ? lines : ['']
  }

  function paintInk(ctx, w, h, { highlightSelected = false } = {}) {
    const ann = overlayRef.value
    const scale = ann?.clientWidth ? w / ann.clientWidth : 1

    const drawStrokePath = (stroke) => {
      if (!stroke?.points?.length) return
      ctx.beginPath()
      stroke.points.forEach((p, i) => {
        const { x, y } = normToPixel(p.nx, p.ny, w, h)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
    }

    const drawStroke = (stroke, selected) => {
      if (!stroke?.points?.length) return
      ctx.save()
      if (stroke.isHighlighter) {
        ctx.globalAlpha = 0.38
        ctx.strokeStyle = stroke.color || '#facc15'
        ctx.lineWidth = (stroke.width || 20) * scale
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      } else {
        ctx.globalAlpha = stroke.opacity !== undefined ? stroke.opacity : 1
        const style = stroke.style || (stroke.dashed ? 'dashed' : 'solid')
        if (style === 'dashed') {
          ctx.setLineDash([7 * scale, 5 * scale])
        } else if (style === 'dotted') {
          ctx.setLineDash([2 * scale, 4 * scale])
        } else {
          ctx.setLineDash([])
        }
        ctx.strokeStyle = stroke.color || penColor.value
        ctx.lineWidth = (stroke.width || 3) * scale
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
      drawStrokePath(stroke)
      ctx.stroke()
      ctx.setLineDash([])

      // Nếu nét vẽ có mũi tên ở điểm cuối (style === 'arrow')
      if (stroke.style === 'arrow' && stroke.points?.length >= 2) {
        const pts = stroke.points
        const pEnd = pts[pts.length - 1]
        // Tìm điểm lùi về trước một khoảng để tính vector hướng mũi tên
        let pPrev = pts[pts.length - 2]
        for (let i = pts.length - 2; i >= 0; i--) {
          if (Math.hypot(pEnd.nx - pts[i].nx, pEnd.ny - pts[i].ny) > 0.005) {
            pPrev = pts[i]
            break
          }
        }
        const endPix = normToPixel(pEnd.nx, pEnd.ny, w, h)
        const prevPix = normToPixel(pPrev.nx, pPrev.ny, w, h)
        const angle = Math.atan2(endPix.y - prevPix.y, endPix.x - prevPix.x)
        const arrowLen = Math.max(10, Math.min(26, ((stroke.width || 3) * 2.8 + 6) * scale))

        ctx.fillStyle = stroke.color || penColor.value
        ctx.beginPath()
        ctx.moveTo(endPix.x, endPix.y)
        ctx.lineTo(
          endPix.x - arrowLen * Math.cos(angle - Math.PI / 6),
          endPix.y - arrowLen * Math.sin(angle - Math.PI / 6),
        )
        ctx.lineTo(
          endPix.x - arrowLen * 0.65 * Math.cos(angle),
          endPix.y - arrowLen * 0.65 * Math.sin(angle),
        )
        ctx.lineTo(
          endPix.x - arrowLen * Math.cos(angle + Math.PI / 6),
          endPix.y - arrowLen * Math.sin(angle + Math.PI / 6),
        )
        ctx.closePath()
        ctx.fill()
      }
      if (selected && highlightSelected && !stroke.isHighlighter) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.9)'
        ctx.lineWidth = ((stroke.width || 3) + 4) * scale
        ctx.globalAlpha = 0.35
        drawStrokePath(stroke)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      ctx.restore()
    }

    const selSet = new Set(selectedStrokeIds.value)
    for (const s of strokes.value) drawStroke(s, highlightSelected && selSet.has(s.id))
    if (writingDraft.value) drawStroke(writingDraft.value, false)
    drawStandardLabels(ctx, w, h)
  }

  function drawStandardLabels(ctx, w, h) {
    const ann = overlayRef.value
    const scale = ann?.clientWidth ? w / ann.clientWidth : 1
    for (const lb of standardLabels.value) {
      const text = String(lb.text || '').trim()
      if (!text) continue
      const { x, y } = normToPixel(lb.nx, lb.ny, w, h)
      ctx.save()
      const fontSize = Math.round(20 * scale)
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`
      ctx.fillStyle = lb.color || '#f8fafc'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.shadowColor = 'rgba(0,0,0,0.45)'
      ctx.shadowBlur = 4 * scale
      const maxW = lb.maxWidth ? Math.min(lb.maxWidth * scale, w) : Math.min(w * 0.5, 420 * scale)
      wrapFillText(ctx, text, x, y, maxW, Math.round(22 * scale))
      ctx.restore()
    }
  }

  function wrapFillText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/)
    const lines = []
    let line = ''
    for (const word of words) {
      const test = line ? `${line} ${word}` : word
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = word
      } else {
        line = test
      }
    }
    if (line) lines.push(line)
    const startY = y - ((lines.length - 1) * lineHeight) / 2
    lines.forEach((ln, i) => {
      ctx.fillText(ln, x, startY + i * lineHeight)
    })
  }

  function drawRegionOverlay(ctx, w, h) {
    const rect = regionDraft.value
    if (!rect) return
    const r = normalizeRegion(rect)
    if (!r) return
    const x = r.nx0 * w
    const y = r.ny0 * h
    const rw = (r.nx1 - r.nx0) * w
    const rh = (r.ny1 - r.ny0) * h
    ctx.save()
    ctx.fillStyle = 'rgba(56, 189, 248, 0.05)'
    ctx.fillRect(x, y, rw, rh)
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    ctx.strokeRect(x + 0.5, y + 0.5, rw, rh)
    ctx.setLineDash([])
    ctx.restore()
  }

  function drawCoordinateGrid(ctx, w, h) {
    const ann = overlayRef.value
    const scale = ann?.clientWidth ? w / ann.clientWidth : 1
    // 1. Ô lưới nhỏ hơn, tỷ lệ 1:1 hoàn hảo: 26px kích thước chuẩn ô tập ca-rô
    const screenStep = 26
    const step = screenStep * scale

    // 2. Giao điểm tâm (cx, cy) làm mốc neo chuẩn của lưới:
    const cx = Math.round(w / 2) + 0.5
    const cy = Math.round(h / 2) + 0.5

    ctx.save()

    // Đường lưới phụ (mảnh, sắc nét)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.13)'
    ctx.lineWidth = Math.max(1, Math.round(scale))

    ctx.beginPath()
    // Kẻ các đường dọc đối xứng từ trục tâm cx sang hai bên trái - phải
    for (let x = cx - step; x >= 0; x -= step) {
      const rx = Math.round(x) + 0.5
      ctx.moveTo(rx, 0)
      ctx.lineTo(rx, h)
    }
    for (let x = cx + step; x <= w; x += step) {
      const rx = Math.round(x) + 0.5
      ctx.moveTo(rx, 0)
      ctx.lineTo(rx, h)
    }

    // Kẻ các đường ngang đối xứng từ trục tâm cy lên trên - xuống dưới
    for (let y = cy - step; y >= 0; y -= step) {
      const ry = Math.round(y) + 0.5
      ctx.moveTo(0, ry)
      ctx.lineTo(w, ry)
    }
    for (let y = cy + step; y <= h; y += step) {
      const ry = Math.round(y) + 0.5
      ctx.moveTo(0, ry)
      ctx.lineTo(w, ry)
    }
    ctx.stroke()

    // 3. Hai đường trục giao tâm điểm (đậm hơn, trùng khít 100% với lưới)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
    ctx.lineWidth = Math.max(1.5, Math.round(1.5 * scale))
    ctx.beginPath()
    // Trục dọc đi qua tâm
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, h)
    // Trục ngang đi qua tâm
    ctx.moveTo(0, cy)
    ctx.lineTo(w, cy)
    ctx.stroke()

    ctx.restore()
  }

  function getStrokesBounds(strokeIds) {
    const ids = Array.isArray(strokeIds) ? strokeIds : [strokeIds]
    if (!ids.length) return null
    const idSet = new Set(ids)
    let minX = 1
    let maxX = 0
    let minY = 1
    let maxY = 0
    let found = false

    for (const s of strokes.value) {
      if (!idSet.has(s.id) || !s.points?.length) continue
      for (const pt of s.points) {
        found = true
        if (pt.nx < minX) minX = pt.nx
        if (pt.nx > maxX) maxX = pt.nx
        if (pt.ny < minY) minY = pt.ny
        if (pt.ny > maxY) maxY = pt.ny
      }
    }
    if (!found) return null
    const pad = 0.015
    return {
      nx0: Math.max(0, minX - pad),
      ny0: Math.max(0, minY - pad),
      nx1: Math.min(1, maxX + pad),
      ny1: Math.min(1, maxY + pad),
    }
  }

  function eraseAt(nx, ny) {
    const hit = hitTestWritingStroke(nx, ny)
    if (!hit) return false
    strokes.value = strokes.value.filter((s) => s.id !== hit)
    selectedStrokeIds.value = selectedStrokeIds.value.filter((id) => id !== hit)
    if (selectedStrokeIds.value.length) {
      regionSelection.value = getStrokesBounds(selectedStrokeIds.value)
    } else {
      regionSelection.value = null
    }
    erasedAnyDuringDrag = true
    repaint()
    return true
  }

  function selectStroke(id, multi = false) {
    if (!id) {
      selectedStrokeIds.value = []
      regionSelection.value = null
    } else if (multi) {
      const idx = selectedStrokeIds.value.indexOf(id)
      if (idx >= 0) {
        selectedStrokeIds.value = selectedStrokeIds.value.filter((x) => x !== id)
      } else {
        selectedStrokeIds.value = [...selectedStrokeIds.value, id]
      }
      regionSelection.value = selectedStrokeIds.value.length ? getStrokesBounds(selectedStrokeIds.value) : null
    } else {
      selectedStrokeIds.value = [id]
      regionSelection.value = getStrokesBounds([id])
    }
    writingTool.value = 'hand'
    repaint()
  }

  function selectStrokes(ids) {
    selectedStrokeIds.value = Array.isArray(ids) ? [...ids] : []
    regionSelection.value = selectedStrokeIds.value.length ? getStrokesBounds(selectedStrokeIds.value) : null
    writingTool.value = 'hand'
    repaint()
  }

  function nudgeSelected(dx, dy) {
    if (!selectedStrokeIds.value.length) return
    const selSet = new Set(selectedStrokeIds.value)
    for (const stroke of strokes.value) {
      if (!selSet.has(stroke.id) || !stroke?.points?.length) continue
      stroke.points = stroke.points.map((pt) => ({
        nx: Math.min(1, Math.max(0, pt.nx + dx)),
        ny: Math.min(1, Math.max(0, pt.ny + dy)),
      }))
    }
    regionSelection.value = getStrokesBounds(selectedStrokeIds.value)
    repaint()
  }

  function deleteSelected() {
    if (!selectedStrokeIds.value.length) return
    const selSet = new Set(selectedStrokeIds.value)
    strokes.value = strokes.value.filter((s) => !selSet.has(s.id))
    selectedStrokeIds.value = []
    regionSelection.value = null
    recordAction('Xóa các nét vẽ đã chọn')
    repaint()
  }

  function clearAll() {
    strokes.value = []
    geometricShapes.value = []
    interactiveDemos.value = []
    problemGeometryFrames.value = []
    writingDraft.value = null
    selectedStrokeIds.value = []
    regionSelection.value = null
    standardLabels.value = []
    regionSidePanels.value = []
    laserPoints.value = []
    recordAction('Xóa toàn bộ bảng')
    repaint()
  }

  /** Khởi tạo phiên làm việc bảng viết hoàn toàn mới: xóa sạch các nét vẽ, khối hình và đặt lại lịch sử */
  function resetForNewSession() {
    strokes.value = []
    geometricShapes.value = []
    interactiveDemos.value = []
    problemGeometryFrames.value = []
    writingDraft.value = null
    selectedStrokeIds.value = []
    regionSelection.value = null
    standardLabels.value = []
    regionSidePanels.value = []
    laserPoints.value = []
    lastBeautifiedNotice.value = null
    lastBeautifiedUndo.value = null
    historyStack.value = []
    historyIndex.value = -1
    boardZoom.value = 1.0
    recordAction('Bảng ban đầu')
    repaint()
  }

  function applyStrokeMove(p) {
    const drag = moveDrag.value
    if (!drag?.items?.length) return
    const dx = p.nx - drag.startNx
    const dy = p.ny - drag.startNy
    for (const item of drag.items) {
      item.stroke.points = item.basePoints.map((pt) => ({
        nx: Math.min(1, Math.max(0, pt.nx + dx)),
        ny: Math.min(1, Math.max(0, pt.ny + dy)),
      }))
    }
    regionSelection.value = getStrokesBounds(selectedStrokeIds.value)
    repaint()
  }

  function beginHandDrag(p, targetStrokeIds) {
    const idSet = new Set(Array.isArray(targetStrokeIds) ? targetStrokeIds : [targetStrokeIds])
    const items = []
    for (const s of strokes.value) {
      if (idSet.has(s.id) && s.points?.length) {
        items.push({
          stroke: s,
          basePoints: s.points.map((pt) => ({ ...pt })),
        })
      }
    }
    if (!items.length) return
    moveDrag.value = {
      startNx: p.nx,
      startNy: p.ny,
      items,
    }
  }

  let rulerSnapStroke = null

  function onPointerDown(e) {
    if (!active.value || e.button !== 0) return
    const p = overlayNormFromEvent(e)
    if (!p) return

    // Nhấp chọn tâm O cho compa
    if (showCompass.value && compassState.value.mode === 'pickCenter') {
      const ann = overlayRef.value
      const rect = ann?.getBoundingClientRect()
      if (rect) {
        compassState.value.centerX = Math.round(e.clientX - rect.left)
        compassState.value.centerY = Math.round(e.clientY - rect.top)
      }
      compassState.value.mode = 'free'
      return
    }

    if (writingTool.value === 'hand') {
      const isMultiModifier = e.shiftKey || e.ctrlKey || e.metaKey
      const hit = hitTestWritingStroke(p.nx, p.ny)

      if (hit) {
        if (isMultiModifier) {
          // Toggle nét này trong danh sách đã chọn
          const exists = selectedStrokeIds.value.includes(hit)
          if (exists) {
            selectedStrokeIds.value = selectedStrokeIds.value.filter((id) => id !== hit)
          } else {
            selectedStrokeIds.value = [...selectedStrokeIds.value, hit]
          }
        } else {
          // Nếu click vào một nét chưa nằm trong tập đã chọn thì chọn riêng nét đó
          if (!selectedStrokeIds.value.includes(hit)) {
            selectedStrokeIds.value = [hit]
          }
        }

        // Cập nhật khung bao chữ nhật phong cách PTS
        regionSelection.value = selectedStrokeIds.value.length ? getStrokesBounds(selectedStrokeIds.value) : null

        // Bắt đầu kéo di chuyển nhóm nét đã chọn
        beginHandDrag(p, selectedStrokeIds.value)
        writingPointerId.value = e.pointerId
        overlayRef.value?.setPointerCapture(e.pointerId)
      } else {
        // Nhấp vào vùng trống
        if (!isMultiModifier) {
          selectedStrokeIds.value = []
          regionSelection.value = null
        }
        moveDrag.value = null
        // Kéo chuột trên vùng trống để quét chọn nhiều đối tượng (marquee selection)
        regionDraft.value = { nx0: p.nx, ny0: p.ny, nx1: p.nx, ny1: p.ny }
        writingPointerId.value = e.pointerId
        overlayRef.value?.setPointerCapture(e.pointerId)
      }
      repaint()
      return
    }
    if (writingTool.value === 'eraser') {
      erasedAnyDuringDrag = false
      eraseAt(p.nx, p.ny)
      writingPointerId.value = e.pointerId
      overlayRef.value?.setPointerCapture(e.pointerId)
      return
    }
    if (writingTool.value === 'region') {
      regionSelection.value = null
      regionDraft.value = { nx0: p.nx, ny0: p.ny, nx1: p.nx, ny1: p.ny }
      writingPointerId.value = e.pointerId
      overlayRef.value?.setPointerCapture(e.pointerId)
      repaint()
      return
    }
    if (writingTool.value === 'laser') {
      const ann = overlayRef.value
      const w = ann?.width || 800
      const h = ann?.height || 560
      laserPoints.value = [{ x: p.nx * w, y: p.ny * h, time: performance.now() }]
      writingPointerId.value = e.pointerId
      overlayRef.value?.setPointerCapture(e.pointerId)
      repaint()
      return
    }

    // Kiểm tra snap theo mép thước kẻ khi vẽ với bút hoặc dạ quang
    if (showRuler.value) {
      const ann = overlayRef.value
      const rect = ann?.getBoundingClientRect()
      if (rect) {
        const cX = e.clientX - rect.left
        const cY = e.clientY - rect.top
        const snap = projectPointToRulerEdge(cX, cY)
        if (snap) {
          const startPt = { nx: snap.snappedX / rect.width, ny: snap.snappedY / rect.height }
          rulerSnapStroke = {
            startTau: snap.tau,
            currentTau: snap.tau,
            snap,
            startPt,
          }
          writingPointerId.value = e.pointerId
          writingDraft.value = {
            color: writingTool.value === 'highlighter' ? '#facc15' : penColor.value,
            width: writingTool.value === 'highlighter' ? penWidth.value * 5 : penWidth.value,
            isHighlighter: writingTool.value === 'highlighter',
            points: [startPt, { ...startPt }],
          }
          rulerDrawingLive.value = {
            active: true,
            lengthPx: 0,
            text: formatBoardLength(0),
            px: snap.snappedX,
            py: snap.snappedY,
          }
          overlayRef.value?.setPointerCapture(e.pointerId)
          repaint()
          return
        }
      }
    }

    if (writingTool.value === 'highlighter') {
      writingPointerId.value = e.pointerId
      writingDraft.value = {
        color: penColor.value === BOARD_PEN ? '#facc15' : penColor.value,
        width: penWidth.value * 5,
        isHighlighter: true,
        points: [p],
      }
      overlayRef.value?.setPointerCapture(e.pointerId)
      repaint()
      return
    }
    writingPointerId.value = e.pointerId
    writingDraft.value = {
      color: penColor.value,
      width: penWidth.value,
      opacity: penOpacity.value,
      style: penStyle.value,
      points: [p],
    }
    overlayRef.value?.setPointerCapture(e.pointerId)
    repaint()
  }

  function onPointerMove(e) {
    if (!active.value || e.pointerId !== writingPointerId.value) return
    const p = overlayNormFromEvent(e)
    if (!p) return
    if (writingTool.value === 'hand' && moveDrag.value) {
      applyStrokeMove(p)
      return
    }
    if (writingTool.value === 'hand' && regionDraft.value) {
      regionDraft.value.nx1 = p.nx
      regionDraft.value.ny1 = p.ny
      repaint()
      return
    }
    if (writingTool.value === 'eraser') {
      eraseAt(p.nx, p.ny)
      return
    }
    if (writingTool.value === 'region' && regionDraft.value) {
      regionDraft.value.nx1 = p.nx
      regionDraft.value.ny1 = p.ny
      repaint()
      return
    }
    if (writingTool.value === 'laser') {
      const ann = overlayRef.value
      const w = ann?.width || 800
      const h = ann?.height || 560
      laserPoints.value.push({ x: p.nx * w, y: p.ny * h, time: performance.now() })
      repaint()
      return
    }

    // Đang vẽ snap theo mép thước kẻ
    if (rulerSnapStroke) {
      const ann = overlayRef.value
      const rect = ann?.getBoundingClientRect()
      if (rect) {
        const cX = e.clientX - rect.left
        const cY = e.clientY - rect.top
        const { topEdgeCx, topEdgeCy, cos, sin, half } = rulerSnapStroke.snap
        const dx = cX - topEdgeCx
        const dy = cY - topEdgeCy
        const tau = Math.max(-half, Math.min(half, dx * cos + dy * sin))
        rulerSnapStroke.currentTau = tau
        const curX = topEdgeCx + tau * cos
        const curY = topEdgeCy + tau * sin
        const endPt = { nx: curX / rect.width, ny: curY / rect.height }
        if (writingDraft.value?.points) {
          writingDraft.value.points = [rulerSnapStroke.startPt, endPt]
        }
        const lenPx = Math.abs(tau - rulerSnapStroke.startTau)
        rulerDrawingLive.value = {
          active: true,
          lengthPx: lenPx,
          text: formatBoardLength(lenPx),
          px: curX,
          py: curY,
        }
        repaint()
      }
      return
    }
    if (!writingDraft.value) return
    const pts = writingDraft.value.points
    const last = pts[pts.length - 1]
    if (last && Math.hypot(p.nx - last.nx, p.ny - last.ny) < 0.0015) return
    pts.push(p)
    const ann = overlayRef.value
    const ctx = ann?.getContext('2d')
    if (!ann || !ctx || pts.length < 2) return
    const w = ann.width
    const h = ann.height
    const scale = ann.clientWidth ? w / ann.clientWidth : 1
    const a = normToPixel(pts[pts.length - 2].nx, pts[pts.length - 2].ny, w, h)
    const b = normToPixel(p.nx, p.ny, w, h)
    ctx.strokeStyle = writingDraft.value.color
    ctx.lineWidth = (writingDraft.value.width || 3) * scale
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
  }

  function onPointerUp(e) {
    if (e.pointerId !== writingPointerId.value) return
    writingPointerId.value = null
    moveDrag.value = null
    try {
      overlayRef.value?.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    if (writingTool.value === 'region' && regionDraft.value) {
      if (regionMeaningful(regionDraft.value)) {
        regionSelection.value = { ...regionDraft.value }
      }
      regionDraft.value = null
      repaint()
      return
    }
    if (writingTool.value === 'eraser') {
      if (erasedAnyDuringDrag) {
        recordAction('Tẩy xóa nét vẽ')
        erasedAnyDuringDrag = false
      }
      repaint()
      return
    }
    if (writingTool.value === 'hand') {
      if (regionDraft.value) {
        if (regionMeaningful(regionDraft.value)) {
          const normR = normalizeRegion(regionDraft.value)
          // Tìm tất cả strokes giao cắt với vùng marquee
          const hitStrokes = strokes.value.filter((s) => strokeIntersectsRegion(s, normR))
          if (hitStrokes.length) {
            const hitIds = hitStrokes.map((s) => s.id)
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
              const merged = new Set([...selectedStrokeIds.value, ...hitIds])
              selectedStrokeIds.value = Array.from(merged)
            } else {
              selectedStrokeIds.value = hitIds
            }
            regionSelection.value = getStrokesBounds(selectedStrokeIds.value)
          } else if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
            selectedStrokeIds.value = []
            regionSelection.value = null
          }
        }
        regionDraft.value = null
      }
      if (moveDrag.value) {
        recordAction('Di chuyển các nét vẽ')
      }
      repaint()
      return
    }
    if (writingTool.value === 'laser') {
      repaint()
      return
    }
    if (rulerSnapStroke) {
      const lenPx = rulerDrawingLive.value.lengthPx
      if (lenPx > 5 && writingDraft.value?.points?.length >= 2) {
        const newStroke = {
          id: nextWritingStrokeId(),
          color: writingDraft.value.color,
          width: writingDraft.value.width,
          isHighlighter: Boolean(writingDraft.value.isHighlighter),
          points: [...writingDraft.value.points],
        }
        strokes.value.push(newStroke)
        selectedStrokeId.value = newStroke.id
        recordAction(`Vẽ đoạn thẳng ${formatBoardLength(lenPx)} theo thước kẻ`)
      }
      rulerSnapStroke = null
      rulerDrawingLive.value = { active: false, lengthPx: 0, text: '', px: 0, py: 0 }
      writingDraft.value = null
      repaint()
      return
    }
    if (writingDraft.value?.points?.length) {
      const newStroke = {
        id: nextWritingStrokeId(),
        color: writingDraft.value.color,
        width: writingDraft.value.width,
        opacity: writingDraft.value.opacity !== undefined ? writingDraft.value.opacity : 1,
        style: writingDraft.value.style || 'solid',
        dashed: writingDraft.value.style === 'dashed',
        isHighlighter: Boolean(writingDraft.value.isHighlighter),
        points: [...writingDraft.value.points],
      }
      strokes.value.push(newStroke)
      selectedStrokeId.value = newStroke.id
      if (smartShapeMode.value && !newStroke.isHighlighter) {
        checkAutoBeautify(newStroke)
      } else {
        recordAction(newStroke.isHighlighter ? 'Dạ quang đánh dấu' : 'Nét vẽ bút viết')
      }
    }
    writingDraft.value = null
    repaint()
  }

  function onKeyDown(e) {
    if (!active.value) return
    const tag = String(e.target?.tagName || '').toLowerCase()
    if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return

    const isMod = e.ctrlKey || e.metaKey
    if (isMod && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault()
      if (e.shiftKey) {
        redo()
      } else {
        undo()
      }
      return
    }
    if (isMod && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault()
      redo()
      return
    }

    if (selectedStrokeId.value && writingTool.value === 'hand') {
      const step = e.shiftKey ? 0.016 : 0.005
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nudgeSelected(-step, 0)
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        nudgeSelected(step, 0)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        nudgeSelected(0, -step)
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        nudgeSelected(0, step)
        return
      }
    }

    // Phím tắt thu phóng giao diện bảng (Ctrl +, Ctrl -, Ctrl 0)
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
      e.preventDefault()
      zoomIn()
      return
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
      e.preventDefault()
      zoomOut()
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      e.preventDefault()
      resetZoom()
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      selectedStrokeIds.value = []
      clearRegionSelection()
      return
    }

    if (!selectedStrokeIds.value.length || (e.key !== 'Delete' && e.key !== 'Backspace')) return
    e.preventDefault()
    deleteSelected()
  }

  function clearRegionSelection() {
    regionDraft.value = null
    regionSelection.value = null
    selectedStrokeIds.value = []
    repaint()
  }

  function toggleSmartShape() {
    smartShapeMode.value = !smartShapeMode.value
  }

  function nextDemoId() {
    demoSeq += 1
    return `demo_${Date.now()}_${demoSeq}`
  }

  function addInteractiveDemo(options = {}) {
    const id = nextDemoId()
    const main = mainCanvasRef.value
    const w = main?.clientWidth || (main?.width ? Math.round(main.width / (window.devicePixelRatio || 1)) : 800)
    const h = main?.clientHeight || (main?.height ? Math.round(main.height / (window.devicePixelRatio || 1)) : 560)
    const model = options.model || 'cube'
    const type = options.type || (model === 'graph' ? 'graph' : '3d')

    let width = Number.isFinite(options.width) && options.width >= 240
      ? Math.round(options.width)
      : Math.min(480, Math.max(360, Math.round(w * 0.45)))
    let height = Number.isFinite(options.height) && options.height >= 220
      ? Math.round(options.height)
      : Math.min(440, Math.max(320, Math.round(h * 0.55)))

    width = Math.min(width, Math.max(260, w - 32))
    height = Math.min(height, Math.max(240, h - 32))

    const x = Number.isFinite(options.x)
      ? Math.max(16, Math.min(Math.max(16, w - width - 16), Math.round(options.x)))
      : Math.max(20, Math.round((w - width) / 2))
    const y = Number.isFinite(options.y)
      ? Math.max(16, Math.min(Math.max(16, h - height - 60), Math.round(options.y)))
      : Math.max(20, Math.round((h - height) / 2))

    const demo = {
      id,
      type,
      model,
      title: options.title || '',
      x,
      y,
      width,
      height,
      minimized: false,
      expanded: false,
      yaw: 0.62,
      pitch: 0.42,
      zoom: 1.0,
      interactionMode: options.interactionMode || 'point_slice',
      edgePoints: options.edgePoints || [],
      slicingActive: options.slicingActive ?? false,
      slicePreset: options.slicePreset ?? 'custom',
      sliceNormal: { x: 1, y: 1, z: 1 },
      sliceHeight: 0,
      showCrossSection2d: options.showCrossSection2d ?? true,
      unfoldingActive: false,
      unfoldAngle: 0,
      showProblemCard: options.showProblemCard ?? false,
      activeStep: 1,
      cutInfo: {
        polygonName: 'Chấm 3 điểm trên cạnh để cắt',
        edgesCount: 0,
        edgeFormula: '—',
        angleDeg: '—',
        areaFormula: '—',
      },
      graphParams: {
        A: 1.5,
        B: 0,
      },
      customFormulas: {
        f1: options.formula !== undefined ? options.formula : (options.customFormulas?.f1 ?? ''),
        f2: options.formula2 !== undefined ? options.formula2 : (options.customFormulas?.f2 ?? ''),
      },
      ...options,
    }
    interactiveDemos.value.push(demo)
    recordAction('Thêm mô hình: ' + (options.model || '3D'))
    return demo
  }

  function removeInteractiveDemo(id) {
    interactiveDemos.value = interactiveDemos.value.filter((d) => d.id !== id)
    recordAction('Xóa mô hình 3D')
  }

  /**
   * Chèn nhanh hình học 2D/3D SGK hoặc Khối 3D tương tác tại vị trí bất kỳ (kéo thả hoặc click)
   */
  function insertPresetShapeAt(payload = {}) {
    const { key, model, type, kind, name, clientX, clientY, nx: inNx, ny: inNy } = payload
    let main = overlayRef.value || mainCanvasRef.value
    if (!main && typeof document !== 'undefined') {
      main = document.querySelector('.canvas') || document.querySelector('.board-geometry-overlay') || document.querySelector('.draw-writing-board')
    }

    let nx = Number.isFinite(inNx) ? inNx : 0.5
    let ny = Number.isFinite(inNy) ? inNy : 0.45
    let px = null
    let py = null

    let cw = 1200
    let ch = 750
    if (main) {
      const rect = main.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        cw = rect.width
        ch = rect.height
        if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
          px = clientX - rect.left
          py = clientY - rect.top
          nx = Math.max(0.08, Math.min(0.92, px / rect.width))
          ny = Math.max(0.08, Math.min(0.92, py / rect.height))
        }
      }
    } else if (Number.isFinite(clientX) && Number.isFinite(clientY) && typeof window !== 'undefined') {
      cw = window.innerWidth
      ch = window.innerHeight
      nx = Math.max(0.08, Math.min(0.92, clientX / window.innerWidth))
      ny = Math.max(0.08, Math.min(0.92, clientY / window.innerHeight))
      px = clientX
      py = clientY
    }

    // 1. Khối 3D tương tác xoay 360° / Đồ thị
    if (kind === '3d' || (model && !key)) {
      const targetModel = model || 'cube'
      const demoW = 420
      const demoH = 360
      const finalX = px !== null ? Math.round(px - demoW / 2) : undefined
      const finalY = py !== null ? Math.round(py - demoH / 2) : undefined
      return addInteractiveDemo({
        model: targetModel,
        type: targetModel === 'graph' ? 'graph' : '3d',
        title: name || '',
        x: finalX,
        y: finalY,
      })
    }

    // 2. Hình học phẳng 2D hoặc hình không gian SGK nét đứt
    const shapeKey = key === 'circle' ? 'inscribed_circle_abc' : (key || 'triangle_abc')
    const bbox = {
      cx: nx,
      cy: ny,
      cw,
      ch,
      minX: Math.max(0.02, nx - 0.15),
      maxX: Math.min(0.98, nx + 0.15),
      minY: Math.max(0.02, ny - 0.15),
      maxY: Math.min(0.98, ny + 0.15),
      width: 0.3,
      height: 0.3,
    }

    const shape = createSgkPresetGeometryShape(shapeKey, bbox, penColor.value || '#f8fafc')
    if (shape) {
      if (!Array.isArray(geometricShapes.value)) {
        geometricShapes.value = []
      }
      geometricShapes.value.push(shape)
      recordAction('Thêm hình: ' + (name || shape.name || shapeKey))
      repaint()
      return shape
    }
  }

  // ==================== THU PHÓNG GIAO DIỆN BẢNG VẼ (ZOOM IN / OUT) ====================
  const boardZoom = ref(1.0)

  function zoomIn(step = 0.15) {
    boardZoom.value = Math.min(2.5, Math.round((boardZoom.value + step) * 100) / 100)
  }

  function zoomOut(step = 0.15) {
    boardZoom.value = Math.max(0.4, Math.round((boardZoom.value - step) * 100) / 100)
  }

  function resetZoom() {
    boardZoom.value = 1.0
  }

  function setZoom(val) {
    boardZoom.value = Math.max(0.4, Math.min(2.5, Math.round(val * 100) / 100))
  }

  function checkAutoBeautify(newStroke) {
    if (!newStroke?.points?.length) return
    const pts = newStroke.points
    if (pts.length < 2) return
    const sb = boundingBox(pts)
    const strokeDiag = Math.hypot(sb.width, sb.height)

    // Bỏ qua nếu chỉ là chấm bút cực nhỏ
    if (strokeDiag < 0.02) return

    const singleRes = recognizeStrokes([newStroke])
    if (!singleRes) return

    // 1. TỰ ĐỘNG NẮN THẲNG ĐOẠN THẲNG: Khi bật nắn nét, vẽ nét thẳng sẽ thẳng tắp không bị lệch
    if (singleRes.type === 'line' || singleRes.type === 'segment') {
      const beautified = generateBeautifiedStrokes(
        singleRes,
        newStroke.color,
        newStroke.width,
        newStroke.style || 'solid',
        newStroke.opacity !== undefined ? newStroke.opacity : 1,
      )
      if (beautified.length) {
        lastBeautifiedUndo.value = {
          original: [newStroke],
          createdIds: beautified.map((b) => b.id),
        }
        strokes.value = strokes.value.filter((s) => s.id !== newStroke.id)
        strokes.value.push(...beautified)
        lastBeautifiedNotice.value = {
          type: 'line',
          label: 'Đoạn thẳng',
          bbox: singleRes.bbox,
          result: singleRes,
        }
        recordAction('Tự nắn thẳng đoạn thẳng')
        repaint()
        return
      }
    }

    // 2. CÁC HÌNH KHÉP KÍN 2D (Đường tròn, elip, tam giác, hình chữ nhật, hình vuông)
    if (
      singleRes.confidence >= 0.82 &&
      (singleRes.type === 'circle' ||
        singleRes.type === 'ellipse' ||
        singleRes.type === 'triangle' ||
        singleRes.type === 'rectangle' ||
        singleRes.type === 'square') &&
      sb.width >= 0.045 &&
      sb.height >= 0.045
    ) {
      const beautified = generateBeautifiedStrokes(
        singleRes,
        newStroke.color,
        newStroke.width,
        newStroke.style || 'solid',
        newStroke.opacity !== undefined ? newStroke.opacity : 1,
      )
      if (beautified.length) {
        lastBeautifiedUndo.value = {
          original: [newStroke],
          createdIds: beautified.map((b) => b.id),
        }
        strokes.value = strokes.value.filter((s) => s.id !== newStroke.id)
        strokes.value.push(...beautified)
        lastBeautifiedNotice.value = {
          type: singleRes.type,
          label: getShapeLabel(singleRes.type, singleRes.subType),
          bbox: singleRes.bbox,
          result: singleRes,
        }
        recordAction('Tự nắn hình: ' + getShapeLabel(singleRes.type, singleRes.subType))
        repaint()
      }
    }
  }

  function beautifyStrokesInRegion(rectIn = regionSelection.value) {
    const rect = rectIn
    if (!rect) return null
    const targetStrokes = strokes.value.filter((s) => strokeIntersectsRegion(s, rect))
    if (!targetStrokes.length) return null

    const result = recognizeStrokes(targetStrokes)
    if (!result) return null

    const color = targetStrokes[0]?.color || penColor.value
    const width = targetStrokes[0]?.width || penWidth.value
    const style = targetStrokes[0]?.style || penStyle.value || 'solid'
    const opacity = targetStrokes[0]?.opacity !== undefined ? targetStrokes[0].opacity : (penOpacity.value ?? 1)
    const beautified = generateBeautifiedStrokes(result, color, width, style, opacity)

    if (beautified.length) {
      lastBeautifiedUndo.value = {
        original: [...targetStrokes],
        createdIds: beautified.map((b) => b.id),
      }
      const targetIds = new Set(targetStrokes.map((s) => s.id))
      strokes.value = strokes.value.filter((s) => !targetIds.has(s.id))
      strokes.value.push(...beautified)

      lastBeautifiedNotice.value = {
        type: result.type,
        label: getShapeLabel(result.type, result.subType),
        bbox: result.bbox || rect,
        result,
      }
      recordAction('Nắn nét: ' + getShapeLabel(result.type, result.subType))
      clearRegionSelection()
      repaint()
      return result
    }
    return null
  }

  function beautifyStrokesToGeometry(rectIn = regionSelection.value) {
    const rect = rectIn
    if (!rect) return null
    const targetStrokes = strokes.value.filter((s) => strokeIntersectsRegion(s, rect))
    if (!targetStrokes.length) return null

    const result = recognizeStrokes(targetStrokes)
    if (!result) return null

    const color = targetStrokes[0]?.color || penColor.value
    const geomShape = createGeometryShapeFromResult(result, color)
    if (!geomShape) return null

    // Lưu undo
    lastBeautifiedUndo.value = {
      original: [...targetStrokes],
      createdGeomId: geomShape.id,
    }

    // Xóa các nét vẽ tay thô trong vùng
    const targetIds = new Set(targetStrokes.map((s) => s.id))
    strokes.value = strokes.value.filter((s) => !targetIds.has(s.id))

    // Thêm đối tượng hình học tương tác
    geometricShapes.value.push(geomShape)
    recordAction('Tạo hình: ' + (geomShape.name || 'Hình học'))

    clearRegionSelection()
    repaint()
    return geomShape
  }

  function removeGeometricShape(id) {
    geometricShapes.value = geometricShapes.value.filter((s) => s.id !== id)
    recordAction('Xóa hình học')
    repaint()
  }

  function convertStrokesToInteractiveDemo(rectIn = regionSelection.value, forcedModel = null, extraOpts = {}) {
    const rect = rectIn
    let targetStrokes = []
    if (rect) {
      targetStrokes = strokes.value.filter((s) => strokeIntersectsRegion(s, rect))
    } else {
      targetStrokes = strokes.value.slice(-8)
    }

    const rec = targetStrokes.length ? recognizeStrokes(targetStrokes) : null
    let model = forcedModel
    // Nếu chưa chỉ định model cụ thể, luôn ưu tiên dạng khối thực tế nhận diện được từ nét vẽ
    if (!model) {
      if (rec?.type === 'equation' || rec?.type === 'graph_2d') model = 'graph'
      else if (rec?.type === 'trapezoid_prism' || rec?.type === 'truncated_prism') model = 'trapezoid_prism'
      else if (rec?.type === 'prism_3d' || rec?.type === 'triangular_prism') model = 'triangular_prism'
      else if (rec?.type === 'pyramid_3d' || rec?.type === 'tetrahedron_3d') model = 'pyramid'
      else if (rec?.type === 'cylinder_3d') model = 'cylinder'
      else if (rec?.type === 'cone_3d') model = 'cone'
      else if (rec?.type === 'cube_3d') {
        const asp = rec.aspect || (rec.bbox ? rec.bbox.width / Math.max(1e-4, rec.bbox.height) : 1)
        model = rec.subType === 'rectangular_prism' || asp > 1.15 || asp < 0.85 ? 'box' : 'cube'
      } else {
        const asp = rec?.bbox ? rec.bbox.width / Math.max(1e-4, rec.bbox.height) : 1
        model = asp > 1.18 ? 'trapezoid_prism' : (asp < 0.82 ? 'box' : 'cube')
      }
    }

    const r = normalizeRegion(rect) || normalizeRegion(rec?.bbox) || { nx0: 0.35, ny0: 0.2, nx1: 0.72, ny1: 0.65 }
    const main = mainCanvasRef.value
    const w = main?.clientWidth || (main?.width ? Math.round(main.width / (window.devicePixelRatio || 1)) : 800)
    const h = main?.clientHeight || (main?.height ? Math.round(main.height / (window.devicePixelRatio || 1)) : 560)

    if (model === 'graph') {
      // Giống hệt video (00:16 - 00:22): Giữ nguyên chữ viết công thức trên bảng,
      // dựng khung Hệ trục tọa độ 2D ngay bên trái (hoặc bên phải nếu viết sát lề trái)!
      const graphW = Math.min(420, Math.max(320, Math.round(w * 0.44)))
      const graphH = Math.min(380, Math.max(280, Math.round(h * 0.56)))
      const leftSpace = r.nx0 * w
      const gx = leftSpace >= graphW + 24
        ? Math.max(16, Math.round(r.nx0 * w - graphW - 20))
        : Math.min(Math.max(16, w - graphW - 16), Math.round(r.nx1 * w + 20))
      const gy = Math.max(20, Math.min(Math.max(20, h - graphH - 50), Math.round(((r.ny0 + r.ny1) / 2) * h - graphH / 2)))

      const demo = addInteractiveDemo({
        model: 'graph',
        type: 'graph',
        x: gx,
        y: gy,
        width: graphW,
        height: graphH,
        formula: extraOpts.formula !== undefined ? extraOpts.formula : '',
        formula2: extraOpts.formula2 !== undefined ? extraOpts.formula2 : '',
        rawLabel: extraOpts.rawLabel || '',
      })
      clearRegionSelection()
      lastBeautifiedNotice.value = null
      repaint()
      return demo
    }

    // Nếu là mô hình 3D (Hình lập phương / Hình chóp / Lăng trụ): Thay thế các nét vẽ tay tại chỗ trên bảng
    if (targetStrokes.length) {
      const targetIds = new Set(targetStrokes.map((s) => s.id))
      lastBeautifiedUndo.value = {
        original: [...targetStrokes],
      }
      strokes.value = strokes.value.filter((s) => !targetIds.has(s.id))
    }

    const rawBoxW = (r.nx1 - r.nx0) * w + 60
    const rawBoxH = (r.ny1 - r.ny0) * h + 60
    const boxW = Math.max(340, Math.min(520, Number.isFinite(rawBoxW) ? Math.round(rawBoxW) : 420))
    const boxH = Math.max(300, Math.min(460, Number.isFinite(rawBoxH) ? Math.round(rawBoxH) : 380))
    const cx = ((r.nx0 + r.nx1) / 2) * w
    const cy = ((r.ny0 + r.ny1) / 2) * h
    const minY = drawSession?.isExpanded ? 20 : 72
    const px = Math.max(20, Math.min(Math.max(20, w - boxW - 20), Number.isFinite(cx) ? Math.round(cx - boxW / 2) : 100))
    const py = Math.max(minY, Math.min(Math.max(minY, h - boxH - 60), Number.isFinite(cy) ? Math.round(cy - boxH / 2) : minY + 20))

    const demo = addInteractiveDemo({
      model,
      type: '3d',
      aspect: rec?.aspect || (r ? (r.nx1 - r.nx0) / Math.max(1e-4, r.ny1 - r.ny0) : 1.35),
      x: px,
      y: py,
      width: boxW,
      height: boxH,
      slicingActive: false,
      edgePoints: [],
      interactionMode: 'point_slice',
      showCrossSection2d: true,
    })

    if (lastBeautifiedUndo.value) {
      lastBeautifiedUndo.value.createdDemoId = demo.id
    }

    clearRegionSelection()
    lastBeautifiedNotice.value = null
    repaint()
    return demo
  }

  function insertVideoEquationSample() {
    const sample = generateSampleVideoEquations(penColor.value || '#f8fafc', 2.6)
    strokes.value.push(...sample.strokes)
    regionSelection.value = sample.region
    writingTool.value = 'region'
    recordAction('Chèn mẫu công thức f(x)')
    repaint()
  }

  function deleteStrokesInRegion(rectIn = regionSelection.value) {
    if (!rectIn) return
    strokes.value = strokes.value.filter((s) => !strokeIntersectsRegion(s, rectIn))
    clearRegionSelection()
    recordAction('Xóa vùng nét vẽ')
    repaint()
  }

  function undoLastBeautify() {
    if (!lastBeautifiedUndo.value) return
    const { original, createdIds, createdGeomId, createdDemoId } = lastBeautifiedUndo.value
    if (createdDemoId) {
      interactiveDemos.value = interactiveDemos.value.filter((d) => d.id !== createdDemoId)
    }
    if (createdGeomId) {
      geometricShapes.value = geometricShapes.value.filter((s) => s.id !== createdGeomId)
    }
    if (createdIds) {
      const createdSet = new Set(createdIds)
      strokes.value = strokes.value.filter((s) => !createdSet.has(s.id))
    }
    if (original) {
      strokes.value.push(...original)
    }
    lastBeautifiedUndo.value = null
    lastBeautifiedNotice.value = null
    repaint()
  }

  function clearLastBeautifiedNotice() {
    lastBeautifiedNotice.value = null
  }

  function applyStandardToRegion(standardText, rectIn = regionSelection.value) {
    const text = String(standardText || '').trim()
    const rect = rectIn
    if (!text || !rect) return
    const r = normalizeRegion(rect)
    strokes.value = strokes.value.filter((s) => !strokeIntersectsRegion(s, rect))
    const main = mainCanvasRef.value
    const boxW = main ? (r.nx1 - r.nx0) * main.width : 200
    standardLabels.value.push({
      id: nextWritingStrokeId(),
      nx: (r.nx0 + r.nx1) / 2,
      ny: (r.ny0 + r.ny1) / 2,
      text,
      color: '#f8fafc',
      maxWidth: Math.max(48, boxW * 0.92),
    })
    regionSelection.value = null
    repaint()
  }

  watch(active, (on) => {
    if (on) repaint()
    else {
      writingDraft.value = null
      writingPointerId.value = null
    }
  })

  watch(writingTool, (tool, prev) => {
    writingDraft.value = null
    writingPointerId.value = null
    moveDrag.value = null
    if (tool === 'pen' || tool === 'highlighter') {
      regionSelection.value = null
      selectedStrokeIds.value = []
      regionDraft.value = null
    }
    if (prev === 'region' && tool !== 'region') regionDraft.value = null
    repaint()
  })

  watch(
    () => [mainCanvasRef.value?.width, mainCanvasRef.value?.height, active.value],
    () => {
      if (active.value || strokes.value.length) repaint()
    },
  )

  function setWritingTool(tool) {
    if (tool === 'hand' || tool === 'pen' || tool === 'eraser' || tool === 'region' || tool === 'highlighter' || tool === 'laser') {
      writingTool.value = tool
      if (tool === 'pen' || tool === 'highlighter') {
        regionSelection.value = null
        selectedStrokeIds.value = []
        regionDraft.value = null
      }
      repaint()
    }
  }

  function strokesSummaryInRegion(rect) {
    const picked = strokes.value.filter((s) => strokeIntersectsRegion(s, rect))
    if (!picked.length) return ''
    return picked
      .map((s, i) => {
        const n = s.points?.length || 0
        return `- Nét trong vùng ${i + 1}: id=${s.id}, ${n} điểm`
      })
      .join('\n')
  }

  function compositeBoardCanvas({ inkOnly = false } = {}) {
    const main = mainCanvasRef.value
    const overlay = overlayRef.value
    if (!main) return null
    const w = main.width
    const h = main.height
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')
    if (!ctx) return null
    const bg = drawSession.writingOnly ? '#2a2f36' : '#ffffff'
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)
    ctx.drawImage(main, 0, 0)
    if (inkOnly) {
      if (showGrid.value) drawCoordinateGrid(ctx, w, h)
      paintInk(ctx, w, h, { highlightSelected: false })
    } else if (overlay) {
      ctx.drawImage(overlay, 0, 0)
    }
    return { canvas: c, ctx, w, h }
  }

  function captureRegionPng(rect) {
    const base = compositeBoardCanvas({ inkOnly: true })
    if (!base || !rect) return ''
    const r = normalizeRegion(rect)
    if (!r) return ''
    const x = Math.max(0, Math.floor(r.nx0 * base.w))
    const y = Math.max(0, Math.floor(r.ny0 * base.h))
    const x2 = Math.min(base.w, Math.ceil(r.nx1 * base.w))
    const y2 = Math.min(base.h, Math.ceil(r.ny1 * base.h))
    const rw = Math.max(1, x2 - x)
    const rh = Math.max(1, y2 - y)
    const crop = document.createElement('canvas')
    crop.width = rw
    crop.height = rh
    const cctx = crop.getContext('2d')
    if (!cctx) return ''
    cctx.drawImage(base.canvas, x, y, rw, rh, 0, 0, rw, rh)
    const dataUrl = crop.toDataURL('image/png')
    return dataUrl.split(',')[1] || ''
  }

  function strokesSummaryText() {
    if (!strokes.value.length) return ''
    return strokes.value
      .map((s, i) => {
        const n = s.points?.length || 0
        return `- Nét ${i + 1}: id=${s.id}, ${n} điểm, độ dày ${s.width || 3}px`
      })
      .join('\n')
  }

  function captureBoardPng() {
    const base = compositeBoardCanvas()
    if (!base) return ''
    const dataUrl = base.canvas.toDataURL('image/png')
    return dataUrl.split(',')[1] || ''
  }

  return {
    active,
    strokes,
    writingTool,
    setWritingTool,
    selectedStrokeId,
    selectedStrokeIds,
    getStrokesBounds,
    selectStrokes,
    penWidth,
    penOpacity,
    setPenOpacity,
    penStyle,
    setPenStyle,
    toolHint,
    penColor,
    penPalette: PEN_PALETTE,
    setPenColor,
    showGrid,
    toggleGrid,
    setOverlayEl,
    overlayRef,
    overlayEl: computed(() => overlayRef.value),
    repaint,
    selectStroke,
    deleteSelected,
    clearAll,
    resetForNewSession,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onKeyDown,
    strokesSummaryText,
    captureBoardPng,
    captureRegionPng,
    strokesSummaryInRegion,
    regionSelection,
    regionDraft,
    normalizeRegion,
    strokeIntersectsRegion,
    clearRegionSelection,
    applyStandardToRegion,
    standardLabels,
    regionSidePanels,
    addSideTextPanel,
    addSideGraphPanel,
    smartShapeMode,
    toggleSmartShape,
    interactiveDemos,
    addInteractiveDemo,
    removeInteractiveDemo,
    geometricShapes,
    beautifyStrokesToGeometry,
    removeGeometricShape,
    beautifyStrokesInRegion,
    convertStrokesToInteractiveDemo,
    insertVideoEquationSample,
    deleteStrokesInRegion,
    undoLastBeautify,
    lastBeautifiedNotice,
    clearLastBeautifiedNotice,
    historyStack,
    historyIndex,
    canUndo,
    canRedo,
    recordAction,
    undo,
    redo,
    jumpToHistory,
    boardZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    laserPoints,
    boardUnit,
    unitDefinitions,
    setBoardUnit,
    pxToUnit,
    unitToPx,
    formatBoardLength,
    showRuler,
    rulerState,
    setRulerAlignMode,
    rulerDrawingLive,
    toggleRuler,
    drawRulerLine,
    showCompass,
    compassState,
    toggleCompass,
    insertCircleStroke,
    showProtractor,
    protractorState,
    toggleProtractor,
    showFunctionGrapher,
    toggleFunctionGrapher,
    showTeachingCard,
    toggleTeachingCard,
    insertFunctionGraphStrokes,
    showProblemGeometryTool,
    problemGeometryFrames,
    toggleProblemGeometryTool,
    addProblemGeometryFrame,
    removeProblemGeometryFrame,
    insertPresetShapeAt,
  }
}
