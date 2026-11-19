<template>
  <div class="inv">
    <p class="b-caption panel-intro">
      Thêm từng sản phẩm — có thể nhiều <strong>biến thể</strong> (size/màu/gói) với <strong>giá & tồn</strong> riêng.
      Vật lý/số, tồn giới hạn hoặc không. Hoặc đồng bộ API GET.
    </p>

    <div class="mode-row">
      <label class="mode-opt">
        <input v-model="local.mode" type="radio" value="manual" />
        Thủ công
      </label>
      <label class="mode-opt">
        <input v-model="local.mode" type="radio" value="api" />
        API list
      </label>
    </div>

    <template v-if="local.mode === 'manual'">
      <div v-for="(p, idx) in local.products" :key="p.id" class="product b-card b-card-pad">
        <div class="product-head">
          <span class="b-micro">Sản phẩm {{ idx + 1 }}</span>
          <button type="button" class="text-danger" @click="removeProduct(idx)">Xóa</button>
        </div>
        <label class="b-field">
          <span>Tên</span>
          <input v-model="p.name" class="b-input" type="text" />
        </label>
        <fieldset class="type-row">
          <legend class="sr-only">Loại sản phẩm</legend>
          <span class="field-label">Loại</span>
          <label class="chip-opt">
            <input v-model="p.productType" type="radio" value="physical" />
            Vật lý
          </label>
          <label class="chip-opt">
            <input v-model="p.productType" type="radio" value="digital" />
            Sản phẩm số
          </label>
        </fieldset>
        <label class="b-field">
          <span>SKU / mã</span>
          <input v-model="p.sku" class="b-input" type="text" />
        </label>
        <div class="b-field stock-block">
          <span>Tồn kho (SP đơn hoặc từng biến thể)</span>
          <div class="stock-modes">
            <label class="chip-opt chip-opt--sm">
              <input v-model="p.stockMode" type="radio" value="limited" />
              Giới hạn
            </label>
            <label class="chip-opt chip-opt--sm">
              <input v-model="p.stockMode" type="radio" value="unlimited" />
              Không giới hạn
            </label>
          </div>
          <input
            v-if="p.stockMode !== 'unlimited' && !p.variants.length"
            v-model.number="p.stock"
            class="b-input stock-qty"
            type="number"
            min="0"
            placeholder="0"
          />
          <small v-else-if="p.stockMode === 'unlimited'" class="b-micro stock-hint">
            Bot có thể chốt không giới hạn SL (trừ khi ghi chú khác).
          </small>
          <small v-else-if="p.variants.length" class="b-micro stock-hint">
            Nhập tồn từng biến thể bên dưới.
          </small>
        </div>
        <label class="b-field">
          <span>{{ p.productType === 'digital' ? 'Link giao hàng (tải/key)' : 'Link sản phẩm' }}</span>
          <input v-model="p.link" class="b-input" type="url" placeholder="https://..." />
        </label>

        <section class="variants-block">
          <div class="variants-head">
            <div>
              <span class="variants-title">Biến thể (style / size / gói giá)</span>
              <p class="b-micro variants-hint">Một SP có thể có nhiều mẫu, mỗi mẫu một giá (và tồn nếu giới hạn).</p>
            </div>
            <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="addVariant(idx)">
              + Biến thể
            </button>
          </div>

          <template v-if="!p.variants.length">
            <div class="grid2">
              <label class="b-field">
                <span>Giá (SP không có biến thể)</span>
                <input v-model="p.price" class="b-input" type="text" placeholder="99000" />
              </label>
              <label class="b-field">
                <span>Ghi chú</span>
                <input v-model="p.note" class="b-input" type="text" />
              </label>
            </div>
          </template>
          <template v-else>
            <label class="b-field">
              <span>Ghi chú chung</span>
              <input v-model="p.note" class="b-input" type="text" />
            </label>
            <div
              v-for="(v, vIdx) in p.variants"
              :key="v.id"
              class="variant-row b-card b-card-pad"
            >
              <div class="variant-head">
                <span class="b-micro">Biến thể {{ vIdx + 1 }}</span>
                <button type="button" class="text-danger" @click="removeVariant(idx, vIdx)">Xóa</button>
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
                <label v-if="p.stockMode !== 'unlimited'" class="b-field">
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
      <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="addProduct">
        Thêm sản phẩm
      </button>
    </template>

    <template v-else>
      <label class="b-field">
        <span>URL API (GET)</span>
        <input v-model="local.api.url" class="b-input" type="url" placeholder="https://api.shop.com/products" />
      </label>
      <label class="b-field">
        <span>Đường dẫn mảng trong JSON</span>
        <input v-model="local.api.listPath" class="b-input" type="text" placeholder="data.items hoặc để trống nếu response là mảng" />
      </label>
      <label class="b-field">
        <span>Header JSON (tuỳ chọn)</span>
        <textarea
          v-model="headersText"
          class="b-textarea b-textarea--mono"
          rows="3"
          placeholder='{"Authorization":"Bearer ..."}'
        />
      </label>
      <p class="b-micro">Ánh xạ field từ mỗi phần tử API:</p>
      <div class="grid2">
        <label class="b-field">
          <span>Tên</span>
          <input v-model="local.api.mapName" class="b-input" type="text" />
        </label>
        <label class="b-field">
          <span>Tồn</span>
          <input v-model="local.api.mapStock" class="b-input" type="text" />
        </label>
        <label class="b-field">
          <span>Link</span>
          <input v-model="local.api.mapLink" class="b-input" type="text" />
        </label>
        <label class="b-field">
          <span>Giá</span>
          <input v-model="local.api.mapPrice" class="b-input" type="text" />
        </label>
        <label class="b-field">
          <span>Loại (physical/digital)</span>
          <input v-model="local.api.mapProductType" class="b-input" type="text" />
        </label>
        <label class="b-field">
          <span>Chế độ tồn (limited/unlimited)</span>
          <input v-model="local.api.mapStockMode" class="b-input" type="text" />
        </label>
      </div>
      <p v-if="headersError" class="b-msg-err">{{ headersError }}</p>
    </template>
  </div>
</template>

<script setup>
import { nextTick, reactive, ref, watch } from 'vue'

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

function cloneInventory(src) {
  const base = src && typeof src === 'object' && !Array.isArray(src)
    ? src
  : { mode: 'manual', products: [], api: {} }
  return {
    mode: base.mode === 'api' ? 'api' : 'manual',
    products: Array.isArray(base.products) ? base.products.map((p) => normalizeProduct(p)) : [],
    api: {
      enabled: base.mode === 'api',
      url: base.api?.url || '',
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
  }
}

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue'])

const local = reactive(cloneInventory(props.modelValue))
const headersText = ref(JSON.stringify(local.api.headers || {}, null, 0))
const headersError = ref('')
let syncingFromChild = false

watch(
  () => props.modelValue,
  (v) => {
    if (syncingFromChild) return
    Object.assign(local, cloneInventory(v))
    headersText.value = JSON.stringify(local.api.headers || {}, null, 0)
  },
  { deep: true },
)

watch(
  local,
  () => {
    headersError.value = ''
    if (local.mode === 'api') {
      local.api.enabled = true
      try {
        const parsed = headersText.value.trim() ? JSON.parse(headersText.value) : {}
        if (parsed && typeof parsed === 'object') local.api.headers = parsed
      } catch {
        headersError.value = 'Header JSON không hợp lệ'
      }
    } else {
      local.api.enabled = false
    }
    const products = local.products.map((p) => serializeProduct(p, { forSave: false }))
    syncingFromChild = true
    emit('update:modelValue', {
      mode: local.mode,
      products,
      api: { ...local.api },
    })
    nextTick(() => {
      syncingFromChild = false
    })
  },
  { deep: true },
)

watch(headersText, () => {
  if (local.mode !== 'api') return
  try {
    const parsed = headersText.value.trim() ? JSON.parse(headersText.value) : {}
    if (parsed && typeof parsed === 'object') {
      local.api.headers = parsed
      headersError.value = ''
    }
  } catch {
    headersError.value = 'Header JSON không hợp lệ'
  }
})

function addProduct() {
  local.products.push(newProduct())
}

function removeProduct(idx) {
  local.products.splice(idx, 1)
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
    return
  }

  p.variants.push(newVariant())
}

function removeVariant(productIdx, variantIdx) {
  local.products[productIdx].variants.splice(variantIdx, 1)
}

defineExpose({
  validate() {
    if (local.mode === 'api' && headersError.value) return false
    return true
  },
  getValue() {
    const products = local.products.map((p) => serializeProduct(p, { forSave: true }))
    return {
      mode: local.mode,
      products,
      api: { ...local.api, enabled: local.mode === 'api' },
    }
  },
})
</script>

<style scoped>
.inv {
  display: grid;
  gap: 14px;
}

.panel-intro {
  margin: 0 0 4px;
}

.mode-row {
  display: flex;
  gap: 20px;
  margin-bottom: 4px;
}

.mode-opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--b-ink-secondary);
  cursor: pointer;
}

.product {
  display: grid;
  gap: 0;
}

.product-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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

.chip-opt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--b-border);
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--b-ink-secondary);
  cursor: pointer;
  white-space: nowrap;
  word-break: keep-all;
  flex: 0 0 auto;
}

.chip-opt:has(input:checked) {
  border-color: var(--b-accent);
  background: var(--b-accent-soft);
  color: var(--b-ink);
}

.chip-opt--sm {
  padding: 5px 10px;
  font-size: 12px;
}

.stock-block .stock-modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 6px 0 8px;
}

.mode-opt {
  white-space: nowrap;
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