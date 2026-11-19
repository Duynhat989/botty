<template>
  <div
    v-if="board?.showTeachingCard"
    class="teaching-card-window"
    :style="{
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      width: `${collapsed ? 320 : 520}px`,
    }"
    @pointerdown.stop
  >
    <!-- Tiêu đề cửa sổ & Thanh kéo di chuyển (Draggable Header) -->
    <header class="tc-header" @pointerdown="onHeaderPointerDown">
      <div class="tc-title-wrap">
        <GraduationCap :size="18" class="tc-title-icon" />
        <span class="tc-title">Giáo trình & Hướng dẫn giải toán AI</span>
      </div>
      <div class="tc-head-actions">
        <button
          type="button"
          class="tc-hbtn"
          :title="collapsed ? 'Mở rộng' : 'Thu gọn'"
          @click="collapsed = !collapsed"
        >
          {{ collapsed ? '▼' : '▲' }}
        </button>
        <button
          type="button"
          class="tc-hbtn tc-hbtn--close"
          title="Đóng thẻ giáo trình"
          @click="board.toggleTeachingCard(false)"
        >
          ✕
        </button>
      </div>
    </header>

    <div v-show="!collapsed" class="tc-body">
      <!-- Thanh chuyển Tab: Bài toán SGK chuẩn vs Trợ lý giải toán Gemini AI -->
      <div class="tc-tabs">
        <button
          type="button"
          class="tc-tab-btn"
          :class="{ active: currentTab === 'sgk' }"
          @click="currentTab = 'sgk'"
        >
          <BookOpen :size="15" />
          <span>Bài toán mẫu SGK</span>
        </button>
        <button
          type="button"
          class="tc-tab-btn tc-tab-btn--gemini"
          :class="{ active: currentTab === 'gemini' }"
          @click="currentTab = 'gemini'"
        >
          <Sparkles :size="15" />
          <span>Trợ lý Gemini AI</span>
        </button>
      </div>

      <!-- ==================== TAB 1: BÀI TOÁN MẪU SGK (Video Frame 5) ==================== -->
      <div v-if="currentTab === 'sgk'" class="tc-tab-content">
        <!-- Danh sách bài toán kinh điển -->
        <div class="tc-preset-selector">
          <button
            v-for="p in problemPresets"
            :key="p.id"
            type="button"
            class="tc-problem-chip"
            :class="{ active: activeProblemId === p.id }"
            @click="activeProblemId = p.id"
          >
            {{ p.shortTitle }}
          </button>
        </div>

        <article class="tc-problem-article">
          <h3 class="tc-problem-title">{{ activeProblem.title }}</h3>

          <!-- Phần 1: Đề bài toán -->
          <div class="tc-block tc-block--debai">
            <h4 class="tc-sec-title">📝 Đề bài</h4>
            <p class="tc-text">{{ activeProblem.statement }}</p>
          </div>

          <!-- Phần 2: Tóm tắt Giả thiết (GT) & Kết luận (KL) -->
          <div class="tc-gt-kl-grid">
            <div class="tc-block tc-block--gt">
              <h5 class="tc-sec-sub">Giả thiết (GT)</h5>
              <ul class="tc-list">
                <li v-for="(item, idx) in activeProblem.gt" :key="`gt-${idx}`">{{ item }}</li>
              </ul>
            </div>
            <div class="tc-block tc-block--kl">
              <h5 class="tc-sec-sub">Kết luận (KL)</h5>
              <ul class="tc-list">
                <li v-for="(item, idx) in activeProblem.kl" :key="`kl-${idx}`">{{ item }}</li>
              </ul>
            </div>
          </div>

          <!-- Phần 3: Phân tích & Định lý áp dụng -->
          <div class="tc-block tc-block--hints">
            <h4 class="tc-sec-title">💡 Định hướng & Định lý then chốt</h4>
            <ul class="tc-list-ordered">
              <li v-for="(hint, idx) in activeProblem.hints" :key="`hint-${idx}`">{{ hint }}</li>
            </ul>
          </div>

          <!-- Phần 4: Lời giải chi tiết từng bước -->
          <div class="tc-block tc-block--solution">
            <h4 class="tc-sec-title">🎯 Lời giải chi tiết</h4>
            <div class="tc-steps">
              <div v-for="(st, idx) in activeProblem.steps" :key="`st-${idx}`" class="tc-step-item">
                <strong class="tc-step-num">Bước {{ idx + 1 }}:</strong>
                <span class="tc-step-text">{{ st }}</span>
              </div>
            </div>
          </div>

          <!-- Thanh nút tương tác nhanh -->
          <div class="tc-actions-bar">
            <button
              v-if="activeProblem.actionType === '3d_prism'"
              type="button"
              class="tc-act-btn primary"
              @click="openDemoPrism"
            >
              🎮 Dựng Lăng trụ 3D trên bảng
            </button>
            <button
              v-else-if="activeProblem.actionType === '3d_cube'"
              type="button"
              class="tc-act-btn primary"
              @click="openDemoCube"
            >
              🎮 Dựng Lập phương cắt thiết diện
            </button>
            <button
              v-else-if="activeProblem.actionType === 'graph'"
              type="button"
              class="tc-act-btn primary"
              @click="openGraph"
            >
              📈 Mở Đồ thị hàm số tương tác
            </button>

            <button
              type="button"
              class="tc-act-btn"
              title="Chép tóm tắt bài toán lên bảng"
              @click="copyProblemToBoard"
            >
              📋 Chép lên bảng viết
            </button>
          </div>
        </article>
      </div>

      <!-- ==================== TAB 2: TRỢ LÝ GIẢI TOÁN GEMINI AI ==================== -->
      <div v-else class="tc-tab-content">
        <div class="tc-gemini-card">
          <div class="gemini-banner">
            <Sparkles :size="18" class="gemini-star" />
            <div class="gemini-banner-text">
              <strong>Trợ lý Gemini 2.0 / Flash AI</strong>
              <small>Nhận diện chữ viết tay, hình vẽ và sinh lời giải từng bước</small>
            </div>
          </div>

          <!-- Nút kích hoạt chụp bảng giải toán -->
          <div class="gemini-main-triggers">
            <button
              type="button"
              class="gemini-big-btn"
              :disabled="loading"
              @click="runGeminiAnalyze('solve')"
            >
              <template v-if="loading">
                <span class="gemini-spinner" />
                <span>Gemini đang đọc bảng & giải bài...</span>
              </template>
              <template v-else>
                <ScanText :size="18" />
                <span>📸 Đọc bảng & Giải bài toán</span>
              </template>
            </button>

            <button
              type="button"
              class="gemini-sub-btn"
              :disabled="loading"
              @click="runGeminiAnalyze('explain')"
            >
              <Lightbulb :size="15" />
              <span>Gợi ý định lý</span>
            </button>
          </div>

          <!-- Lỗi nếu có -->
          <p v-if="errorText" class="gemini-err-msg">⚠️ {{ errorText }}</p>

          <!-- Kết quả AI trả về -->
          <div v-if="geminiResult" class="gemini-result-sheet">
            <div v-if="geminiResult.summary" class="gr-block">
              <span class="gr-badge">Tóm tắt bài toán</span>
              <p class="gr-text">{{ geminiResult.summary }}</p>
            </div>

            <div v-if="geminiResult.latex && geminiResult.latex.length" class="gr-block">
              <span class="gr-badge">Công thức nhận diện</span>
              <div class="gr-latex-list">
                <code v-for="(lx, idx) in geminiResult.latex" :key="`lx-${idx}`">{{ lx }}</code>
              </div>
            </div>

            <div v-if="geminiResult.suggestions && geminiResult.suggestions.length" class="gr-block">
              <span class="gr-badge gr-badge--steps">Các bước giải & Gợi ý SGK</span>
              <ol class="gr-steps-ol">
                <li v-for="(sg, idx) in geminiResult.suggestions" :key="`sg-${idx}`">{{ sg }}</li>
              </ol>
            </div>

            <div class="gemini-result-footer">
              <button
                type="button"
                class="gr-copy-btn"
                @click="copyGeminiToBoard"
              >
                📋 Chép gợi ý lên bảng viết
              </button>
            </div>
          </div>

          <!-- Khung chat hỏi đáp thêm với Gemini -->
          <div class="gemini-qa-row">
            <input
              v-model="customQuestion"
              type="text"
              class="gemini-input"
              placeholder="Hỏi thêm Gemini AI về bài này (VD: Tại sao AH vuông góc với đáy?)..."
              :disabled="loading"
              @keyup.enter="askCustomQuestion"
            />
            <button
              type="button"
              class="gemini-send-btn"
              :disabled="loading || !customQuestion.trim()"
              @click="askCustomQuestion"
            >
              Gửi
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject } from 'vue'
import { GraduationCap, BookOpen, Sparkles, ScanText, Lightbulb } from '@lucide/vue'
import { WRITING_BOARD_KEY } from '@/composables/useWritingBoard'
import { api } from '@/api'

const board = inject(WRITING_BOARD_KEY)

const collapsed = ref(false)
const pos = reactive({ x: 80, y: 80 })
const currentTab = ref('sgk')

// -------------------------------------------------------------
// DỮ LIỆU CÁC BÀI TOÁN MẪU KINH ĐIỂN SGK (TƯƠNG ĐỒNG VIDEO)
// -------------------------------------------------------------
const problemPresets = [
  {
    id: 'prism_angle',
    shortTitle: '1. Góc lăng trụ tam giác (Video)',
    title: 'Bài toán: Góc giữa đường thẳng và mặt phẳng trong lăng trụ đứng tam giác',
    statement:
      'Cho lăng trụ đứng tam giác ABC.A\'B\'C\' có đáy ABC là tam giác đều cạnh a, cạnh bên AA\' = a√3. Gọi M là trung điểm của cạnh BC. Xác định và tính số đo góc giữa đường thẳng A\'M và mặt phẳng (ABC).',
    gt: [
      'Lăng trụ đứng ABC.A\'B\'C\' ⇒ AA\' ⟂ (ABC)',
      'ΔABC đều cạnh a, AA\' = a√3',
      'M là trung điểm cạnh BC',
    ],
    kl: [
      'Xác định góc α = (A\'M, (ABC))',
      'Tính tan(α) và số đo góc α',
    ],
    hints: [
      'Tìm hình chiếu vuông góc của đoạn thẳng A\'M lên mặt phẳng đáy (ABC).',
      'Vì AA\' ⟂ (ABC) tại A, điểm M thuộc (ABC) nên hình chiếu của A\'M là đoạn thẳng AM.',
      'Góc giữa A\'M và (ABC) là góc A\'MA (vì ΔA\'AM vuông tại A).',
    ],
    steps: [
      'Do ABC là tam giác đều cạnh a có M là trung điểm BC, AM là đường trung tuyến đồng thời là đường cao: AM = (a√3)/2.',
      'Vì lăng trụ đứng nên AA\' ⟂ (ABC) ⇒ AA\' ⟂ AM. Suy ra ΔA\'AM vuông tại đỉnh A.',
      'Hình chiếu của A\' lên (ABC) là A, hình chiếu của M là chính nó ⇒ Hình chiếu của A\'M lên (ABC) là AM. Do đó góc giữa A\'M và (ABC) là góc A\'MA.',
      'Xét tam giác vuông A\'AM: tan(A\'MA) = AA\' / AM = (a√3) / ((a√3)/2) = 2.',
      'Vậy số đo góc cần tìm là α = arctan(2) ≈ 63°26\'.',
    ],
    actionType: '3d_prism',
  },
  {
    id: 'cube_cross_section',
    shortTitle: '2. Thiết diện Lập phương (Video)',
    title: 'Bài toán: Khảo sát các dạng thiết diện của hình lập phương ABCD.A\'B\'C\'',
    statement:
      'Dùng một mặt phẳng (P) cắt khối lập phương ABCD.A\'B\'C\'. Khảo sát hình dạng của thiết diện khi mặt phẳng đi qua 3 điểm nằm trên các cạnh của hình lập phương.',
    gt: [
      'Hình lập phương ABCD.A\'B\'C\' có 6 mặt là hình vuông bằng nhau',
      'Mặt phẳng (P) cắt các mặt của khối lập phương',
    ],
    kl: [
      'Xác định các dạng đa giác thiết diện: Tam giác, Tứ giác, Ngũ giác, Lục giác',
    ],
    hints: [
      'Giao tuyến của (P) với hai mặt đối diện song song của hình lập phương luôn là hai đoạn thẳng song song.',
      'Một mặt phẳng có thể cắt tối đa 6 mặt của khối lập phương ⇒ Thiết diện có tối đa 6 cạnh (lục giác).',
    ],
    steps: [
      'Tam giác: Khi (P) cắt 3 cạnh xuất phát từ cùng một đỉnh. Nếu 3 đoạn chắn bằng nhau thì thiết diện là tam giác đều (góc 60°).',
      'Tứ giác: Khi (P) cắt 4 mặt (hình thang, hình bình hành hoặc hình chữ nhật 90°).',
      'Ngũ giác: Khi (P) cắt 5 mặt của hình lập phương.',
      'Lục giác đều 120°: Khi (P) đi qua trung điểm của 6 cạnh không chứa cùng một đỉnh và song song với một mặt chéo.',
    ],
    actionType: '3d_cube',
  },
  {
    id: 'parabola_study',
    shortTitle: '3. Khảo sát hàm số y = x² - 3',
    title: 'Bài toán: Khảo sát sự biến thiên và vẽ đồ thị hàm số y = x² - 3',
    statement:
      'Lập bảng biến thiên và biểu diễn đồ thị hàm số bậc hai y = x² - 3 trên hệ trục tọa độ Descartes Oxy.',
    gt: ['Hàm số y = f(x) = x² - 3 (hệ số a = 1 > 0, b = 0, c = -3)'],
    kl: ['Tập xác định D, Tọa độ đỉnh S, Trục đối xứng, Điểm giao trục, Đồ thị'],
    hints: [
      'Đỉnh Parabol: x = -b/(2a) = 0 ⇒ y = -3.',
      'Hệ số a = 1 > 0 nên parabol quay bề lõm lên trên, hàm số nghịch biến trên (-∞, 0) và đồng biến trên (0, +∞).',
      'Giao với trục hoành Ox: x² - 3 = 0 ⇒ x = ±√3 ≈ ±1.73.',
    ],
    steps: [
      'Tập xác định: D = ℝ.',
      'Tọa độ đỉnh: S(0, -3). Trục đối xứng: đường thẳng x = 0 (trục Oy).',
      'Bảng biến thiên: Giảm từ +∞ xuống -3 khi x tăng từ -∞ đến 0; tăng từ -3 lên +∞ khi x tăng từ 0 đến +∞.',
      'Giao trục tung: (0, -3). Giao trục hoành: (-√3, 0) và (√3, 0).',
    ],
    actionType: 'graph',
  },
]

const activeProblemId = ref('prism_angle')
const activeProblem = computed(() => problemPresets.find(p => p.id === activeProblemId.value) || problemPresets[0])

// -------------------------------------------------------------
// TRỢ LÝ GEMINI AI
// -------------------------------------------------------------
const loading = ref(false)
const errorText = ref('')
const geminiResult = ref(null)
const customQuestion = ref('')

async function runGeminiAnalyze(action = 'solve') {
  if (loading.value) return
  loading.value = true
  errorText.value = ''
  geminiResult.value = null

  try {
    const pngBase64 = board?.captureBoardPng?.() || ''
    const data = await api.draw.boardGemini({
      prompt: customQuestion.value.trim() || 'Đọc nội dung bài toán trên bảng, tóm tắt GT, KL và đưa ra các bước gợi ý giải toán chi tiết theo chuẩn SGK.',
      imageBase64: pngBase64,
      regionAction: action,
    })
    geminiResult.value = data
  } catch (err) {
    errorText.value = err?.message || 'Không thể kết nối đến Gemini AI. Vui lòng kiểm tra GEMINI_API_KEY trong file backend/.env.'
  } finally {
    loading.value = false
  }
}

async function askCustomQuestion() {
  if (!customQuestion.value.trim()) return
  await runGeminiAnalyze('solve')
}

// -------------------------------------------------------------
// THAO TÁC LIÊN KẾT BẢNG VẼ & MÔ HÌNH 3D / ĐỒ THỊ
// -------------------------------------------------------------
function openDemoPrism() {
  board?.addInteractiveDemo?.({
    type: '3d',
    model: 'prism_triangular',
    x: 180,
    y: 120,
    width: 440,
    height: 380,
  })
}

function openDemoCube() {
  board?.addInteractiveDemo?.({
    type: '3d',
    model: 'cube',
    x: 200,
    y: 120,
    width: 440,
    height: 380,
  })
}

function openGraph() {
  board?.toggleFunctionGrapher?.(true)
}

function copyProblemToBoard() {
  if (!board) return
  const text = `${activeProblem.value.title}\nGT: ${activeProblem.value.gt.join('; ')}\nKL: ${activeProblem.value.kl.join('; ')}`
  board.standardLabels.push({
    nx: 0.15,
    ny: 0.2,
    text,
    color: '#38bdf8',
  })
  board.recordAction?.('Chép đề bài SGK lên bảng')
  board.repaint?.()
}

function copyGeminiToBoard() {
  if (!board || !geminiResult.value) return
  const steps = geminiResult.value.suggestions || []
  const text = `Gợi ý giải:\n${steps.slice(0, 3).join('\n')}`
  board.standardLabels.push({
    nx: 0.5,
    ny: 0.3,
    text,
    color: '#facc15',
  })
  board.recordAction?.('Chép gợi ý Gemini lên bảng')
  board.repaint?.()
}

function onHeaderPointerDown(e) {
  if (e.button !== 0) return
  const startX = e.clientX
  const startY = e.clientY
  const initX = pos.x
  const initY = pos.y

  function onMove(me) {
    pos.x = initX + (me.clientX - startX)
    pos.y = initY + (me.clientY - startY)
  }
  function onUp() {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
}
</script>

<style scoped>
.teaching-card-window {
  position: absolute;
  z-index: 52;
  pointer-events: auto;
  user-select: none;
  border-radius: 14px;
  background: linear-gradient(175deg, rgba(15, 23, 42, 0.97) 0%, rgba(30, 41, 59, 0.98) 100%);
  border: 1.5px solid rgba(16, 185, 129, 0.4);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(16, 185, 129, 0.18);
  backdrop-filter: blur(16px);
  overflow: hidden;
  font-family: system-ui, sans-serif;
}

.tc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: rgba(16, 185, 129, 0.12);
  border-bottom: 1px solid rgba(16, 185, 129, 0.25);
  cursor: grab;
}
.tc-header:active {
  cursor: grabbing;
}
.tc-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tc-title-icon {
  color: #10b981;
}
.tc-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #f1f5f9;
}
.tc-head-actions {
  display: flex;
  gap: 6px;
}
.tc-hbtn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(51, 65, 85, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 4px;
  color: #94a3b8;
  font-size: 11px;
  cursor: pointer;
}
.tc-hbtn:hover {
  background: #475569;
  color: #ffffff;
}
.tc-hbtn--close:hover {
  background: #dc2626;
  color: #ffffff;
}

.tc-body {
  padding: 14px;
  max-height: 520px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tc-tabs {
  display: flex;
  gap: 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  padding-bottom: 8px;
}
.tc-tab-btn {
  flex: 1;
  padding: 7px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(30, 41, 59, 0.6);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.14s ease;
}
.tc-tab-btn:hover {
  color: #ffffff;
  border-color: rgba(56, 189, 248, 0.4);
}
.tc-tab-btn.active {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}
.tc-tab-btn--gemini.active {
  background: #059669;
  border-color: #10b981;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
}

.tc-preset-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.tc-problem-chip {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.tc-problem-chip.active {
  background: #1e293b;
  border-color: #10b981;
  color: #10b981;
  font-weight: 700;
}

.tc-problem-article {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tc-problem-title {
  margin: 0;
  font-size: 13.5px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.4;
}

.tc-block {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.15);
}
.tc-sec-title {
  margin: 0 0 6px 0;
  font-size: 11.5px;
  font-weight: 700;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tc-sec-sub {
  margin: 0 0 4px 0;
  font-size: 11px;
  font-weight: 700;
  color: #f59e0b;
}
.tc-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: #e2e8f0;
}

.tc-gt-kl-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.tc-list {
  margin: 0;
  padding-left: 14px;
  font-size: 11.5px;
  color: #cbd5e1;
  line-height: 1.45;
}
.tc-list-ordered {
  margin: 0;
  padding-left: 16px;
  font-size: 11.5px;
  color: #cbd5e1;
  line-height: 1.5;
}

.tc-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tc-step-item {
  font-size: 11.5px;
  line-height: 1.45;
  color: #e2e8f0;
}
.tc-step-num {
  color: #10b981;
  margin-right: 4px;
}

.tc-actions-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}
.tc-act-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.8);
  color: #f1f5f9;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s ease;
}
.tc-act-btn:hover {
  background: #334155;
  border-color: #38bdf8;
}
.tc-act-btn.primary {
  background: #059669;
  border-color: #10b981;
  font-weight: 700;
}
.tc-act-btn.primary:hover {
  background: #047857;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
}

/* ==================== TAB 2: GEMINI STYLING ==================== */
.tc-gemini-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.gemini-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 8px;
}
.gemini-star {
  color: #10b981;
  animation: pulse 2s infinite ease-in-out;
}
@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); }
}
.gemini-banner-text strong {
  display: block;
  font-size: 12.5px;
  color: #10b981;
}
.gemini-banner-text small {
  font-size: 10.5px;
  color: #94a3b8;
}

.gemini-main-triggers {
  display: flex;
  gap: 8px;
}
.gemini-big-btn {
  flex: 1;
  height: 38px;
  background: linear-gradient(135deg, #059669 0%, #0284c7 100%);
  border: 1px solid rgba(56, 189, 248, 0.4);
  border-radius: 8px;
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);
  transition: all 0.15s ease;
}
.gemini-big-btn:hover:not(:disabled) {
  opacity: 0.95;
  box-shadow: 0 4px 20px rgba(5, 150, 105, 0.5);
}
.gemini-big-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.gemini-sub-btn {
  padding: 0 12px;
  height: 38px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.gemini-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.gemini-err-msg {
  margin: 0;
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.15);
  border: 1px solid #dc2626;
  color: #fca5a5;
  font-size: 11.5px;
}

.gemini-result-sheet {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.3);
}
.gr-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.gr-badge {
  font-size: 10.5px;
  font-weight: 800;
  color: #38bdf8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.gr-badge--steps {
  color: #f59e0b;
}
.gr-text {
  margin: 0;
  font-size: 12px;
  color: #f1f5f9;
  line-height: 1.45;
}
.gr-latex-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.gr-latex-list code {
  padding: 3px 6px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 4px;
  color: #38bdf8;
  font-size: 11.5px;
  font-family: monospace;
}
.gr-steps-ol {
  margin: 0;
  padding-left: 16px;
  font-size: 11.5px;
  color: #cbd5e1;
  line-height: 1.5;
}
.gemini-result-footer {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
}
.gr-copy-btn {
  padding: 4px 10px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.gr-copy-btn:hover {
  background: #334155;
  color: #ffffff;
}

.gemini-qa-row {
  display: flex;
  gap: 6px;
}
.gemini-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #f8fafc;
  font-size: 11.5px;
}
.gemini-input:focus {
  outline: none;
  border-color: #10b981;
}
.gemini-send-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 6px;
  background: #059669;
  border: none;
  color: #ffffff;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}
.gemini-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

