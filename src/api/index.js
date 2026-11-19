import { apiRequest } from './client'

export { apiMessage } from './messages'
export { ApiError } from './client'

export const api = {
  packages: {
    list: (kind) => {
      const q = kind ? `?kind=${encodeURIComponent(kind)}` : ''
      return apiRequest(`/packages${q}`)
    },
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
    test: (id, message, sessionId, images = []) =>
      apiRequest(`/bots/${id}/test`, {
        method: 'POST',
        body: { message, sessionId, images: images?.length ? images : undefined },
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
      params.set('limit', String(opts.limit ?? 40))
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