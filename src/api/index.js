import { apiRequest, apiUpload } from './client'

export { apiMessage } from './messages'
export { ApiError } from './client'

function qp(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== '') q.set(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const api = {
  analytics: {
    hit: (path) =>
      apiRequest('/analytics/hit', {
        method: 'POST',
        body: { path },
        auth: 'optional',
      }),
  },
  admin: {
    overview: () => apiRequest('/admin/overview', { auth: true }),
    users: (params) => apiRequest(`/admin/users${qp(params)}`, { auth: true }),
    getUser: (id) => apiRequest(`/admin/users/${id}`, { auth: true }),
    updateUser: (id, body) =>
      apiRequest(`/admin/users/${id}`, { method: 'PATCH', body, auth: true }),
    deleteUser: (id) => apiRequest(`/admin/users/${id}`, { method: 'DELETE', auth: true }),
    warnUser: (id, body) =>
      apiRequest(`/admin/users/${id}/warn`, { method: 'POST', body, auth: true }),
    emailUser: (id, body) =>
      apiRequest(`/admin/users/${id}/email`, { method: 'POST', body, auth: true }),
    renewReminderUser: (id, body) =>
      apiRequest(`/admin/users/${id}/renew-reminder`, { method: 'POST', body, auth: true }),
    bots: (params) => apiRequest(`/admin/bots${qp(params)}`, { auth: true }),
    orders: (params) => apiRequest(`/admin/orders${qp(params)}`, { auth: true }),
    updateOrder: (id, body) =>
      apiRequest(`/admin/orders/${id}`, { method: 'PATCH', body, auth: true }),
    packages: (params) => apiRequest(`/admin/packages${qp(params)}`, { auth: true }),
    createPackage: (body) =>
      apiRequest('/admin/packages', { method: 'POST', body, auth: true }),
    updatePackage: (id, body) =>
      apiRequest(`/admin/packages/${id}`, { method: 'PATCH', body, auth: true }),
    deletePackage: (id) => apiRequest(`/admin/packages/${id}`, { method: 'DELETE', auth: true }),
    promptTemplates: () => apiRequest('/admin/prompt-templates', { auth: true }),
    createPromptTemplate: (body) =>
      apiRequest('/admin/prompt-templates', { method: 'POST', body, auth: true }),
    updatePromptTemplate: (id, body) =>
      apiRequest(`/admin/prompt-templates/${id}`, { method: 'PATCH', body, auth: true }),
    deletePromptTemplate: (id) =>
      apiRequest(`/admin/prompt-templates/${id}`, { method: 'DELETE', auth: true }),
    getPricingSettings: () => apiRequest('/admin/pricing-settings', { auth: true }),
    updatePricingSettings: (body) =>
      apiRequest('/admin/pricing-settings', { method: 'PATCH', body, auth: true }),
    getStorageSettings: () => apiRequest('/admin/storage-settings', { auth: true }),
    updateStorageSettings: (body) =>
      apiRequest('/admin/storage-settings', { method: 'PATCH', body, auth: true }),
    broadcastNotification: (body) =>
      apiRequest('/admin/notifications/broadcast', { method: 'POST', body, auth: true }),
  },
  notifications: {
    list: (params) => apiRequest(`/notifications${qp(params)}`, { auth: true }),
    summary: () => apiRequest('/notifications/summary', { auth: true }),
    markRead: (id) =>
      apiRequest(`/notifications/${id}/read`, { method: 'PATCH', auth: true }),
    markAllRead: () =>
      apiRequest('/notifications/read-all', { method: 'POST', auth: true }),
  },
  packages: {
    list: (kind) => {
      const q = kind ? `?kind=${encodeURIComponent(kind)}` : ''
      return apiRequest(`/packages${q}`)
    },
    pricing: () => apiRequest('/packages/pricing'),
  },
  orders: {
    list: () => apiRequest('/orders', { auth: true }),
    get: (id) => apiRequest(`/orders/${id}`, { auth: true }),
    create: (packageId, billingPeriod = 'month') =>
      apiRequest('/orders', {
        method: 'POST',
        body: { packageId, billingPeriod },
        auth: true,
      }),
  },
  apiKeys: {
    list: () => apiRequest('/api-keys', { auth: true }),
    create: (name) =>
      apiRequest('/api-keys', {
        method: 'POST',
        body: { name },
        auth: true,
      }),
    remove: (id) => apiRequest(`/api-keys/${id}`, { method: 'DELETE', auth: true }),
  },
  support: {
    reportIncident: (body) =>
      apiRequest('/support/incidents', {
        method: 'POST',
        body,
        auth: true,
      }),
  },
  auth: {
    providers: () => apiRequest('/auth/providers'),
    me: () => apiRequest('/auth/me', { auth: true }),
    updateProfile: (body) =>
      apiRequest('/auth/me', { method: 'PATCH', body, auth: true }),
    setupGeminiPin: (pin, confirmPin) =>
      apiRequest('/auth/gemini-pin/setup', {
        method: 'POST',
        body: { pin, confirmPin },
        auth: true,
      }),
    verifyGeminiPin: (pin) =>
      apiRequest('/auth/gemini-pin/verify', {
        method: 'POST',
        body: { pin },
        auth: true,
      }),
    requestGeminiPinReset: () =>
      apiRequest('/auth/gemini-pin/request-reset', { method: 'POST', auth: true }),
    confirmGeminiPinReset: (token, pin, confirmPin) =>
      apiRequest('/auth/gemini-pin/confirm-reset', {
        method: 'POST',
        body: { token, pin, confirmPin },
      }),
  },
  bots: {
    list: () => apiRequest('/bots', { auth: true }),
    create: (body) => apiRequest('/bots', { method: 'POST', body, auth: true }),
    get: (id) => apiRequest(`/bots/${id}`, { auth: true }),
    update: (id, body) => apiRequest(`/bots/${id}`, { method: 'PATCH', body, auth: true }),
    remove: (id) => apiRequest(`/bots/${id}`, { method: 'DELETE', auth: true }),
    addDocument: (id, body) =>
      apiRequest(`/bots/${id}/documents`, { method: 'POST', body, auth: true }),
    deleteDocument: (id, docId) =>
      apiRequest(`/bots/${id}/documents/${docId}`, { method: 'DELETE', auth: true }),
    uploadGreetingImage: (id, file) => {
      const fd = new FormData()
      fd.append('file', file)
      return apiUpload(`/bots/${id}/greeting-image`, fd, { auth: true })
    },
    analyzeInventoryLinks: (id, urls) =>
      apiRequest(`/bots/${id}/inventory/analyze-links`, {
        method: 'POST',
        body: { urls },
        auth: true,
      }),
    analyzeInventoryText: (id, text) =>
      apiRequest(`/bots/${id}/inventory/analyze-text`, {
        method: 'POST',
        body: { text },
        auth: true,
      }),
    testFacebook: (id, body = {}) =>
      apiRequest(`/bots/${id}/facebook/test`, {
        method: 'POST',
        body,
        auth: true,
      }),
    test: (id, message, sessionId, images = []) =>
      apiRequest(`/bots/${id}/test`, {
        method: 'POST',
        body: { message, sessionId, images: images?.length ? images : undefined },
        auth: true,
      }),
    triggerSessionGreeting: (id, sessionId) =>
      apiRequest(`/bots/${id}/session-greeting`, {
        method: 'POST',
        body: { sessionId },
        auth: true,
      }),
    chatHistory: (id, sessionId) =>
      apiRequest(`/bots/${id}/chat-history?sessionId=${encodeURIComponent(sessionId)}`, {
        auth: true,
      }),
    clearChatHistory: (id, sessionId) =>
      apiRequest(`/bots/${id}/chat-history`, {
        method: 'DELETE',
        body: { sessionId },
        auth: true,
      }),
    dashboard: (id) => apiRequest(`/bots/${id}/dashboard`, { auth: true }),
    orders: (id, limit = 50) =>
      apiRequest(`/bots/${id}/orders?limit=${limit}`, { auth: true }),
    activity: (id, channel, opts = {}) => {
      const params = new URLSearchParams()
      params.set('limit', String(opts.limit ?? 15))
      if (opts.page) params.set('page', String(opts.page))
      if (opts.perSession) params.set('perSession', String(opts.perSession))
      if (channel) params.set('channel', channel)
      if (opts.peerId) params.set('peerId', opts.peerId)
      return apiRequest(`/bots/${id}/activity?${params}`, { auth: true })
    },
    chatBillingStatus: (id, { channel, peerId, sessionId } = {}) => {
      const params = new URLSearchParams()
      params.set('channel', channel)
      if (peerId) params.set('peerId', peerId)
      if (sessionId) params.set('sessionId', sessionId)
      return apiRequest(`/bots/${id}/chat-billing/status?${params}`, { auth: true })
    },
    retryOrderWebhook: (id, orderId) =>
      apiRequest(`/bots/${id}/orders/${orderId}/retry-webhook`, { method: 'POST', auth: true }),
    promptTemplatesList: () => apiRequest('/bots/prompt-templates/list', { auth: true }),
    createPromptTemplate: (body) =>
      apiRequest('/bots/prompt-templates', { method: 'POST', body, auth: true }),
    updatePromptTemplate: (templateId, body) =>
      apiRequest(`/bots/prompt-templates/${templateId}`, { method: 'PATCH', body, auth: true }),
    deletePromptTemplate: (templateId) =>
      apiRequest(`/bots/prompt-templates/${templateId}`, { method: 'DELETE', auth: true }),
  },
}