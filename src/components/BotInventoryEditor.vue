<template>
  <div class="inv">
    <p class="b-caption panel-intro">
      Nhập kho <strong>thủ công</strong> hoặc <strong>dán nội dung shop</strong> — AI đọc và điền danh sách sản phẩm giúp bạn.
    </p>

    <div class="mode-tabs" role="tablist" aria-label="Nguồn kho hàng">
      <button
        v-for="opt in modeOptions"
        :key="opt.id"
        type="button"
        role="tab"
        class="mode-tab"
        :class="{ on: local.mode === opt.id }"
        :aria-selected="local.mode === opt.id"
        @click="setMode(opt.id)"
      >
        {{ opt.label }}
      </button>
    </div>

    <template v-if="local.mode === 'manual'">
      <div class="manual-toolbar">
        <p class="b-micro manual-toolbar-meta">
          <strong>{{ local.products.length }}</strong> sản phẩm · bấm dòng để xem / chỉnh chi tiết
        </p>
        <button type="button" class="b-btn b-btn--primary b-btn--sm" @click="openNewProduct">
          + Thêm sản phẩm
        </button>
      </div>

      <p v-if="!local.products.length" class="b-caption manual-empty">
        Chưa có sản phẩm trong kho. Thêm thủ công hoặc dùng tab <strong>AI tự kho</strong>.
      </p>

      <div v-else class="table-wrap inv-table-wrap">
        <table class="inv-table">
          <thead>
            <tr>
              <th class="col-idx">#</th>
              <th>Tên</th>
              <th class="col-sku">SKU</th>
              <th class="col-type">Loại</th>
              <th class="col-price">Giá</th>
              <th class="col-stock">Tồn</th>
              <th class="col-variants">Biến thể</th>
              <th class="col-actions" aria-label="Thao tác" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(p, idx) in local.products"
              :key="p.id"
              class="inv-row"
              tabindex="0"
              role="button"
              @click="openProductEditor(idx)"
              @keydown.enter.prevent="openProductEditor(idx)"
            >
              <td class="col-idx b-micro">{{ idx + 1 }}</td>
              <td class="col-name">
                <span class="name-cell">{{ productDisplayName(p, idx) }}</span>
                <span v-if="p.link" class="link-chip" :title="p.link">Link</span>
              </td>
              <td class="col-sku mono">{{ p.sku || '—' }}</td>
              <td class="col-type">
                <span class="type-pill" :class="'type-pill--' + (p.productType || 'physical')">
                  {{ productTypeLabel(p) }}
                </span>
              </td>
              <td class="col-price">{{ priceSummary(p) }}</td>
              <td class="col-stock">{{ stockSummary(p) }}</td>
              <td class="col-variants">{{ variantCountLabel(p) }}</td>
              <td class="col-actions" @click.stop>
                <button type="button" class="row-btn" @click="openProductEditor(idx)">Sửa</button>
                <button type="button" class="row-btn row-btn--danger" @click="removeProductAt(idx)">Xóa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Teleport to="body">
        <div
          v-if="editIndex !== null && editingProduct"
          class="inv-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inv-edit-title"
          @click.self="closeProductEditor"
        >
          <div class="inv-modal b-card">
            <header class="inv-modal-head">
              <div>
                <p class="b-kicker">Chi tiết sản phẩm</p>
                <h2 id="inv-edit-title" class="b-title-sm">
                  {{ productDisplayName(editingProduct, editIndex) }}
                </h2>
              </div>
              <button type="button" class="inv-modal-close" aria-label="Đóng" @click="closeProductEditor">×</button>
            </header>

            <div class="inv-modal-body product">
              <fieldset class="type-row">
                <legend class="sr-only">Loại sản phẩm</legend>
                <span class="field-label">Loại</span>
                <label class="chip-opt">
                  <input v-model="editingProduct.productType" type="radio" value="physical" />
                  Vật lý
                </label>
                <label class="chip-opt">
                  <input v-model="editingProduct.productType" type="radio" value="digital" />
                  Sản phẩm số
                </label>
              </fieldset>
              <label class="b-field">
                <span>Tên</span>
                <input v-model="editingProduct.name" class="b-input" type="text" />
              </label>
              <label class="b-field">
                <span>SKU / mã</span>
                <input v-model="editingProduct.sku" class="b-input" type="text" />
              </label>
              <div class="b-field stock-block">
                <span>Tồn kho (SP đơn hoặc từng biến thể)</span>
                <div class="stock-modes">
                  <label class="chip-opt chip-opt--sm">
                    <input v-model="editingProduct.stockMode" type="radio" value="limited" />
                    Giới hạn
                  </label>
                  <label class="chip-opt chip-opt--sm">
                    <input v-model="editingProduct.stockMode" type="radio" value="unlimited" />
                    Không giới hạn
                  </label>
                </div>
                <input
                  v-if="editingProduct.stockMode !== 'unlimited' && !editingProduct.variants.length"
                  v-model.number="editingProduct.stock"
                  class="b-input stock-qty"
                  type="number"
                  min="0"
                  placeholder="0"
                />
                <small v-else-if="editingProduct.stockMode === 'unlimited'" class="b-micro stock-hint">
                  Bot có thể chốt không giới hạn SL (trừ khi ghi chú khác).
                </small>
                <small v-else-if="editingProduct.variants.length" class="b-micro stock-hint">
                  Nhập tồn từng biến thể bên dưới.
                </small>
              </div>
              <label class="b-field">
                <span>{{ editingProduct.productType === 'digital' ? 'Link giao hàng (tải/key)' : 'Link sản phẩm' }}</span>
                <input v-model="editingProduct.link" class="b-input" type="url" placeholder="https://..." />
              </label>

              <section class="variants-block">
                <div class="variants-head">
                  <div>
                    <span class="variants-title">Biến thể (style / size / gói giá)</span>
                    <p class="b-micro variants-hint">Một SP có thể có nhiều mẫu, mỗi mẫu một giá (và tồn nếu giới hạn).</p>
                  </div>
                  <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="addVariant(editIndex)">
                    + Biến thể
                  </button>
                </div>

                <template v-if="!editingProduct.variants.length">
                  <div class="grid2">
                    <label class="b-field">
                      <span>Giá (SP không có biến thể)</span>
                      <input v-model="editingProduct.price" class="b-input" type="text" placeholder="99000" />
                    </label>
                    <label class="b-field">
                      <span>Ghi chú</span>
                      <input v-model="editingProduct.note" class="b-input" type="text" />
                    </label>
                  </div>
                </template>
                <template v-else>
                  <label class="b-field">
                    <span>Ghi chú chung</span>
                    <input v-model="editingProduct.note" class="b-input" type="text" />
                  </label>
                  <div
                    v-for="(v, vIdx) in editingProduct.variants"
                    :key="v.id"
                    class="variant-row b-card b-card-pad"
                  >
                    <div class="variant-head">
                      <span class="b-micro">Biến thể {{ vIdx + 1 }}</span>
                      <button type="button" class="text-danger" @click="removeVariant(editIndex, vIdx)">Xóa</button>
                    </div>
                    <div class="grid2">
                      <label class="b-field">
                        <span>Tên biến thể</span>
                        <input v-model="v.label" class="b-input" type="text" placeholder="VD: Đen / Size M, Gói 12 tháng" />
                      </label>
                      <label class="b-field">
                        <span>SKU phụ (tuỳ chọn)</span>
                        <input v-model="v.sku" class="b-input" type="text" />
                      </label>
                    </div>
                    <div class="grid2">
                      <label class="b-field">
                        <span>Giá</span>
                        <input v-model="v.price" class="b-input" type="text" placeholder="199000" />
                      </label>
                      <label v-if="editingProduct.stockMode !== 'unlimited'" class="b-field">
                        <span>Tồn biến thể</span>
                        <input v-model.number="v.stock" class="b-input" type="number" min="0" placeholder="0" />
                      </label>
                    </div>
                    <label class="b-field">
                      <span>Mô tả (tuỳ chọn)</span>
                      <textarea
                        v-model="v.description"
                        class="b-textarea"
                        rows="2"
                        placeholder="VD: vải cotton, dài 65cm, gồm quà kèm…"
                      />
                    </label>
                  </div>
                </template>
              </section>
            </div>

            <footer class="inv-modal-foot">
              <button type="button" class="text-danger" @click="removeProductAt(editIndex)">Xóa sản phẩm</button>
              <button type="button" class="b-btn b-btn--primary b-btn--sm" @click="closeProductEditor">Xong</button>
            </footer>
          </div>
        </div>
      </Teleport>
    </template>

    <template v-else-if="local.mode === 'links'">
      <section class="ai-block b-card b-card-pad">
        <h3 class="ai-title">AI tự điền kho</h3>
        <p class="b-micro ai-note">
          Dán bảng giá, mô tả Facebook/web, catalog copy lộn xộn — AI trích tên, giá, tồn (nếu có) vào kho. Cần Gemini API key hoặc gói Botty AI.
        </p>
        <label class="b-field">
          <span>Nội dung shop (dán vào đây)</span>
          <textarea
            v-model="aiSourceText"
            class="b-textarea ai-paste"
            rows="12"
            placeholder="VD:&#10;Áo thun basic — 149k — còn 20&#10;Quần jean nam size 28-34 — 320k&#10;Gói tư vấn online 3 tháng — 990k — sản phẩm số&#10;..."
          />
        </label>
        <div class="ai-actions">
          <button
            type="button"
            class="b-btn b-btn--primary b-btn--sm"
            :disabled="analyzeBusy || !botId"
            @click="runAiFill"
          >
            {{ analyzeBusy ? analyzeProgress : 'Phân tích & điền kho' }}
          </button>
          <span class="b-micro ai-actions-hint">Sau đó bấm <strong>Lưu cấu hình</strong> ở tab Thiết lập.</span>
        </div>
        <p v-if="analyzeErr" class="b-msg-err">{{ analyzeErr }}</p>
        <p v-if="analyzeOk" class="ok-hint">{{ analyzeOk }}</p>
      </section>

      <p v-if="local.products.length" class="b-caption link-preview">
        Kho hiện có <strong>{{ local.products.length }}</strong> sản phẩm.
        <button type="button" class="link-btn" @click="setMode('manual')">Chỉnh thủ công</button>
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { api, ApiError, apiMessage } from '@/api'

function newVariant() {
  return {
    id: `var_${crypto.randomUUID().slice(0, 8)}`,
    label: '',
    sku: '',
    price: '',
    stock: 0,
    description: '',
  }
}

function newProduct() {
  return {
    id: `prod_${crypto.randomUUID().slice(0, 8)}`,
    name: '',
    sku: '',
    link: '',
    productType: 'physical',
    stockMode: 'limited',
    stock: 0,
    price: '',
    note: '',
    variants: [],
  }
}

function normalizeVariant(v) {
  return {
    ...newVariant(),
    ...v,
    id: v?.id || newVariant().id,
    label: String(v?.label || ''),
    sku: String(v?.sku || ''),
    price: v?.price != null ? String(v.price) : '',
    stock: Math.max(0, Number(v?.stock) || 0),
    description: String(v?.description || v?.note || ''),
  }
}

function normalizeProduct(p) {
  const base = { ...newProduct(), ...p, id: p.id || newProduct().id }
  base.productType = base.productType === 'digital' ? 'digital' : 'physical'
  base.stockMode = base.stockMode === 'unlimited' ? 'unlimited' : 'limited'
  base.variants = Array.isArray(p?.variants) ? p.variants.map((v) => normalizeVariant(v)) : []
  if (base.variants.length) {
    base.price = ''
    base.stock = null
  } else if (base.stockMode === 'unlimited') {
    base.stock = null
  } else {
    base.stock = Math.max(0, Number(base.stock) || 0)
  }
  return base
}

function mapVariantRow(v, stockMode, { trimLabel = false } = {}) {
  const label = trimLabel ? String(v.label || '').trim() : String(v.label || '')
  return {
    id: v.id,
    label,
    sku: trimLabel ? String(v.sku || '').trim() : String(v.sku || ''),
    price: trimLabel ? String(v.price).trim() : String(v.price ?? ''),
    stock: stockMode === 'unlimited' ? null : Math.max(0, Number(v.stock) || 0),
    description: trimLabel ? String(v.description || '').trim() : String(v.description || ''),
  }
}

function serializeProduct(p, { forSave = false } = {}) {
  const row = normalizeProduct(p)
  let variants = row.variants.map((v) => mapVariantRow(v, row.stockMode, { trimLabel: forSave }))
  if (forSave) {
    variants = variants.filter((v) => v.label)
  }
  const out = {
    id: row.id,
    name: row.name,
    sku: row.sku,
    link: row.link,
    productType: row.productType,
    stockMode: row.stockMode,
    note: row.note,
    variants,
  }
  if (variants.length) {
    out.stock = null
    out.price = ''
  } else {
    out.price = row.price != null ? String(row.price) : ''
    out.stock = row.stockMode === 'unlimited' ? null : Math.max(0, Number(row.stock) || 0)
  }
  return out
}

function normalizeMode(m) {
  if (m === 'links') return 'links'
  if (m === 'api') return 'manual'
  return 'manual'
}

const modeOptions = [
  { id: 'manual', label: 'Thủ công' },
  { id: 'links', label: 'AI tự kho' },
]

function setMode(id) {
  if (syncingFromParent) return
  local.mode = normalizeMode(id)
  local.api.enabled = false
  scheduleEmit(0)
}

function cloneInventory(src) {
  const base =
    src && typeof src === 'object' && !Array.isArray(src) ? src : { mode: 'manual', products: [], api: {}, links: {} }
  const mode = normalizeMode(base.mode)
  return {
    mode,
    products: Array.isArray(base.products) ? base.products.map((p) => normalizeProduct(p)) : [],
    api: {
      enabled: false,
      url: base.api?.url || '',
      urls: Array.isArray(base.api?.urls) ? base.api.urls.map(String).filter(Boolean) : [],
      method: 'GET',
      headers: base.api?.headers && typeof base.api.headers === 'object' ? { ...base.api.headers } : {},
      listPath: base.api?.listPath || '',
      mapName: base.api?.mapName || 'name',
      mapStock: base.api?.mapStock || 'stock',
      mapLink: base.api?.mapLink || 'url',
      mapPrice: base.api?.mapPrice || 'price',
      mapProductType: base.api?.mapProductType || 'productType',
      mapStockMode: base.api?.mapStockMode || 'stockMode',
    },
    links: {
      urls: Array.isArray(base.links?.urls) ? base.links.urls.map(String).filter(Boolean) : [],
      sourceText: String(base.links?.sourceText || ''),
    },
  }
}

let syncingFromParent = false
let lastEmitted = ''
let emitTimer = null

function buildApiBlock(api) {
  return {
    enabled: false,
    url: String(api?.url || ''),
    urls: Array.isArray(api?.urls) ? api.urls : [],
    method: 'GET',
    headers: api?.headers && typeof api.headers === 'object' ? { ...api.headers } : {},
    listPath: String(api?.listPath || ''),
    mapName: String(api?.mapName || 'name'),
    mapStock: String(api?.mapStock || 'stock'),
    mapLink: String(api?.mapLink || 'url'),
    mapPrice: String(api?.mapPrice || 'price'),
    mapProductType: String(api?.mapProductType || 'productType'),
    mapStockMode: String(api?.mapStockMode || 'stockMode'),
  }
}

function buildLinksBlock() {
  return {
    urls: [],
    sourceText: String(aiSourceText.value || ''),
  }
}

function buildEmitPayload() {
  const mode = normalizeMode(local.mode)
  return {
    mode,
    products: local.products.map((p) => serializeProduct(p, { forSave: false })),
    api: buildApiBlock(local.api),
    links: buildLinksBlock(),
  }
}

function inventorySnapshotFromPlain(v) {
  const c = cloneInventory(v)
  return JSON.stringify({
    mode: c.mode,
    products: c.products.map((p) => serializeProduct(p, { forSave: false })),
    api: buildApiBlock(c.api),
    links: {
      urls: [],
      sourceText: String(c.links?.sourceText || ''),
    },
  })
}

function emitUpstream() {
  if (syncingFromParent) return
  const payload = buildEmitPayload()
  const snap = JSON.stringify(payload)
  if (snap === lastEmitted) return
  lastEmitted = snap
  emit('update:modelValue', payload)
}

function scheduleEmit(ms = 120) {
  if (syncingFromParent) return
  clearTimeout(emitTimer)
  emitTimer = setTimeout(() => {
    emitUpstream()
  }, ms)
}

function applyInventory(v) {
  syncingFromParent = true
  const next = cloneInventory(v)
  local.mode = next.mode
  local.products.splice(0, local.products.length, ...next.products)
  if (!local.links) local.links = { urls: [], sourceText: '' }
  local.links.urls = [...next.links.urls]
  local.links.sourceText = next.links.sourceText
  Object.assign(local.api, next.api)
  aiSourceText.value = next.links.sourceText || ''
  lastEmitted = JSON.stringify(buildEmitPayload())
  nextTick(() => {
    syncingFromParent = false
  })
}

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  botId: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const local = reactive(cloneInventory(props.modelValue))
const aiSourceText = ref(local.links?.sourceText || '')
const analyzeBusy = ref(false)
const analyzeErr = ref('')
const analyzeOk = ref('')
const analyzeProgress = ref('AI đang đọc…')
const editIndex = ref(null)

const editingProduct = computed(() => {
  if (editIndex.value == null) return null
  return local.products[editIndex.value] ?? null
})

function parsePriceNumber(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return null
  const n = Number(s.replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) && n > 0 ? n : null
}

function formatPriceDisplay(price) {
  const n = typeof price === 'number' ? price : parsePriceNumber(price)
  if (n == null) {
    const s = String(price ?? '').trim()
    return s || '—'
  }
  return new Intl.NumberFormat('vi-VN').format(n) + '₫'
}

function productDisplayName(p, idx) {
  const name = String(p?.name || '').trim()
  return name || `Sản phẩm ${idx + 1}`
}

function productTypeLabel(p) {
  return p?.productType === 'digital' ? 'Sản phẩm số' : 'Vật lý'
}

function priceSummary(p) {
  const row = normalizeProduct(p)
  if (row.variants.length) {
    const prices = row.variants.map((v) => parsePriceNumber(v.price)).filter((n) => n != null)
    if (!prices.length) return '—'
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    if (min === max) return formatPriceDisplay(min)
    return `${formatPriceDisplay(min)} – ${formatPriceDisplay(max)}`
  }
  return formatPriceDisplay(row.price)
}

function stockSummary(p) {
  const row = normalizeProduct(p)
  if (row.stockMode === 'unlimited') return 'Không giới hạn'
  if (row.variants.length) {
    const total = row.variants.reduce((sum, v) => sum + Math.max(0, Number(v.stock) || 0), 0)
    return String(total)
  }
  return String(row.stock ?? 0)
}

function variantCountLabel(p) {
  const n = Array.isArray(p?.variants) ? p.variants.length : 0
  if (!n) return '—'
  return String(n)
}

function openProductEditor(idx) {
  if (idx < 0 || idx >= local.products.length) return
  editIndex.value = idx
}

function openNewProduct() {
  addProduct()
  editIndex.value = local.products.length - 1
}

function closeProductEditor() {
  editIndex.value = null
}

function removeProductAt(idx) {
  removeProduct(idx)
  if (editIndex.value === idx) {
    closeProductEditor()
  } else if (editIndex.value != null && editIndex.value > idx) {
    editIndex.value -= 1
  }
}

lastEmitted = JSON.stringify(buildEmitPayload())

watch(
  () => props.modelValue,
  (v) => {
    if (syncingFromParent) return
    const snap = inventorySnapshotFromPlain(v ?? {})
    if (snap === lastEmitted) return
    applyInventory(v)
  },
)

watch(aiSourceText, () => {
  if (syncingFromParent) return
  if (!local.links) local.links = { urls: [], sourceText: '' }
  local.links.sourceText = aiSourceText.value
  scheduleEmit()
})

watch(
  () => local.products,
  () => {
    if (syncingFromParent || local.mode !== 'manual') return
    scheduleEmit()
  },
  { deep: true },
)

function addProduct() {
  local.products.push(newProduct())
  scheduleEmit(0)
}

function removeProduct(idx) {
  local.products.splice(idx, 1)
  scheduleEmit(0)
}

function addVariant(productIdx) {
  const p = local.products[productIdx]
  if (!Array.isArray(p.variants)) p.variants = []

  if (p.variants.length === 0) {
    const first = newVariant()
    if (String(p.price || '').trim()) {
      first.label = 'Mặc định'
      first.price = p.price
      first.stock = Math.max(0, Number(p.stock) || 0)
      p.price = ''
      if (p.stockMode !== 'unlimited') p.stock = 0
    }
    p.variants.push(first)
    scheduleEmit(0)
    return
  }

  p.variants.push(newVariant())
  scheduleEmit(0)
}

function removeVariant(productIdx, variantIdx) {
  local.products[productIdx].variants.splice(variantIdx, 1)
  scheduleEmit(0)
}

defineExpose({
  validate() {
    return true
  },
  getValue() {
    return {
      ...buildEmitPayload(),
      products: local.products.map((p) => serializeProduct(p, { forSave: true })),
    }
  },
})

async function runAiFill() {
  analyzeErr.value = ''
  analyzeOk.value = ''
  const text = String(aiSourceText.value || '').trim()
  if (text.length < 16) {
    analyzeErr.value = 'Dán nội dung shop (ít nhất vài dòng bảng giá hoặc mô tả sản phẩm).'
    return
  }
  if (!props.botId) {
    analyzeErr.value = 'Không xác định được bot.'
    return
  }
  analyzeBusy.value = true
  analyzeProgress.value = 'AI đang đọc…'
  try {
    const data = await api.bots.analyzeInventoryText(props.botId, text)
    const rows = Array.isArray(data?.products) ? data.products.map((p) => normalizeProduct(p)) : []
    if (!rows.length) {
      analyzeErr.value = 'AI không đọc được sản phẩm trong đoạn bạn dán.'
      return
    }
    local.products.splice(0, local.products.length, ...rows)
    closeProductEditor()
    local.mode = 'links'
    local.api.enabled = false
    if (!local.links) local.links = { urls: [], sourceText: '' }
    local.links.sourceText = text
    analyzeOk.value = data?.message || `Đã điền ${rows.length} sản phẩm — bấm Lưu cấu hình để giữ.`
    scheduleEmit(0)
  } catch (e) {
    analyzeErr.value = e instanceof ApiError ? apiMessage(e) : e?.message || 'Không phân tích được'
  } finally {
    analyzeBusy.value = false
    analyzeProgress.value = 'AI đang đọc…'
  }
}
</script>

<style scoped>
.inv {
  display: grid;
  gap: 14px;
}

.panel-intro {
  margin: 0 0 4px;
}

.mode-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  margin-bottom: 12px;
  padding: 4px;
  border-radius: 12px;
  background: var(--b-surface-2);
  border: 1px solid var(--b-border);
}

.mode-tab {
  margin: 0;
  border: none;
  background: transparent;
  padding: 10px 8px;
  border-radius: 9px;
  font: inherit;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--b-muted);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease;
}

.mode-tab:hover:not(.on) {
  color: var(--b-ink-secondary);
  background: rgba(255, 255, 255, 0.55);
}

.mode-tab.on {
  background: #fff;
  color: var(--b-ink);
  box-shadow: 0 2px 10px -6px rgba(15, 23, 42, 0.22);
}

@media (max-width: 560px) {
  .mode-tabs {
    grid-template-columns: 1fr;
  }
}

.mode-hint {
  margin: 0 0 6px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--b-surface-2);
  border: 1px solid var(--b-border);
}

.ai-block {
  display: grid;
  gap: 12px;
  background: radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--b-accent) 8%, transparent), #fff);
}

.ai-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.ai-note {
  margin: 0;
  color: var(--b-muted);
  line-height: 1.5;
}

.ai-paste {
  min-height: 200px;
  font-size: 13.5px;
  line-height: 1.45;
}

.ai-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
}

.ai-actions-hint {
  color: var(--b-muted);
}

.ok-hint {
  margin: 0;
  color: var(--b-accent-hover);
  font-size: 13px;
}

.link-preview {
  margin: 0;
}

.link-btn {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-weight: 600;
  color: var(--b-accent-hover);
  cursor: pointer;
  text-decoration: underline;
}

.manual-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 14px;
  margin-bottom: 4px;
}

.manual-toolbar-meta {
  margin: 0;
  color: var(--b-muted);
}

.manual-empty {
  margin: 0;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px dashed var(--b-border);
  background: var(--b-surface-2);
}

.inv-table-wrap {
  border: 1px solid var(--b-border);
  border-radius: 14px;
  background: #fff;
}

.inv-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 13px;
}

.inv-table th,
.inv-table td {
  text-align: left;
  padding: 11px 12px;
  border-bottom: 1px solid var(--b-border);
  vertical-align: middle;
}

.inv-table th {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--b-muted);
  background: var(--b-surface-2);
}

.inv-table tbody tr:last-child td {
  border-bottom: none;
}

.inv-row {
  cursor: pointer;
  transition: background 0.15s ease;
}

.inv-row:hover,
.inv-row:focus-visible {
  background: color-mix(in srgb, var(--b-accent) 6%, #fff);
  outline: none;
}

.col-idx {
  width: 40px;
  color: var(--b-muted);
}

.col-sku {
  max-width: 120px;
}

.col-type {
  width: 110px;
}

.col-price,
.col-stock {
  white-space: nowrap;
}

.col-variants {
  width: 72px;
  text-align: center;
}

.col-actions {
  width: 108px;
  text-align: right;
  white-space: nowrap;
}

.col-name {
  min-width: 160px;
}

.name-cell {
  font-weight: 600;
  color: var(--b-ink);
}

.link-chip {
  display: inline-block;
  margin-left: 6px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--b-accent-hover);
  background: var(--b-accent-soft);
}

.type-pill {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--b-surface-2);
  color: var(--b-muted);
}

.type-pill--digital {
  background: #ede9fe;
  color: #5b21b6;
}

.row-btn {
  border: none;
  background: none;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--b-accent-hover);
  cursor: pointer;
  padding: 4px 6px;
}

.row-btn--danger {
  color: var(--b-danger);
}

.mono {
  font-size: 12px;
}

.inv-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(12px, 4vw, 32px);
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.inv-modal {
  width: min(100%, 640px);
  margin: auto;
  max-height: min(92vh, 900px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 64px -24px rgba(15, 23, 42, 0.45);
}

.inv-modal-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 12px;
  border-bottom: 1px solid var(--b-border);
}

.inv-modal-close {
  border: none;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  color: var(--b-muted);
  cursor: pointer;
  padding: 0 4px;
}

.inv-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 20px;
}

.inv-modal-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--b-border);
}

.product {
  display: grid;
  gap: 0;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 12px;
}

@media (max-width: 560px) {
  .grid2 {
    grid-template-columns: 1fr;
  }
}

.text-danger {
  border: none;
  background: none;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--b-danger);
  cursor: pointer;
}

.type-row {
  margin: 0 0 10px;
  padding: 0;
  border: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--b-ink-secondary);
}

.stock-block .stock-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 8px;
}

.stock-qty {
  max-width: 140px;
}

.stock-hint {
  display: block;
  margin-top: 4px;
}

.variants-block {
  margin-top: 8px;
  padding-top: 14px;
  border-top: 1px dashed var(--b-border);
}

.variants-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.variants-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--b-ink-secondary);
}

.variants-hint {
  margin: 4px 0 0;
}

.variant-row {
  margin-bottom: 10px;
  background: var(--b-surface-2);
}

.variant-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>