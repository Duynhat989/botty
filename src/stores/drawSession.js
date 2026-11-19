import { defineStore } from 'pinia'
import { createBlankWritingSpec } from '@/constants/blankWritingSpec'

export const useDrawSessionStore = defineStore('drawSession', {
  state: () => ({
    problem: '',
    spec: null,
    title: '',
    notes: '',
    paramValues: {},
    meta: null,
    editUuid: '',
    projectUuid: '',
    writingBoard: false,
    writingBoardHost: false,
    /** Phiên chỉ dùng lớp bảng viết (canvas trống, không bắt buộc đề). */
    writingOnly: false,
    /** Chế độ mở rộng toàn màn hình (ẩn header & footer) */
    isExpanded: false,
  }),

  getters: {
    ready: (s) => Boolean(s.spec && Array.isArray(s.spec.commands)),
  },

  actions: {
    setFromAnalyze({ problem, spec, title, notes, paramValues, meta }) {
      this.problem = String(problem || '')
      this.spec = spec
      this.title = title || spec?.title || ''
      this.notes = notes || spec?.notes || ''
      this.paramValues = { ...(paramValues || {}) }
      this.meta = meta || null
      this.writingOnly = false
    },

    patchParamValues(values) {
      this.paramValues = { ...this.paramValues, ...values }
    },

    patchSpec(spec) {
      this.spec = spec
    },

    setEditUuid(uuid) {
      this.editUuid = uuid || ''
    },

    setProjectUuid(uuid) {
      this.projectUuid = uuid || ''
    },

    clear() {
      this.problem = ''
      this.spec = null
      this.title = ''
      this.notes = ''
      this.paramValues = {}
      this.meta = null
      this.editUuid = ''
      this.projectUuid = ''
      this.writingBoard = false
      this.writingBoardHost = false
      this.writingOnly = false
    },

    ensureBlankWritingCanvas() {
      if (this.ready) return
      this.problem = ''
      this.spec = createBlankWritingSpec()
      this.title = ''
      this.notes = ''
      this.paramValues = {}
      this.meta = { writingOnly: true }
      this.editUuid = ''
      this.projectUuid = ''
      this.writingOnly = true
    },

    setWritingBoardHost(active) {
      this.writingBoardHost = Boolean(active)
      if (!active) this.writingBoard = false
    },

    toggleWritingBoard() {
      this.writingBoard = !this.writingBoard
    },

    toggleExpanded(val) {
      this.isExpanded = typeof val === 'boolean' ? val : !this.isExpanded
    },
  },
})
