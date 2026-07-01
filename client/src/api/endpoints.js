import api from './client';

export const productApi = {
  list: (params) => api.get('/products', { params }).then((r) => r.data),
  get: (slug) => api.get(`/products/${slug}`).then((r) => r.data),
};

export const categoryApi = {
  list: () => api.get('/categories').then((r) => r.data),
};

export const cartApi = {
  get: () => api.get('/cart').then((r) => r.data),
  add: (productId, quantity = 1) =>
    api.post('/cart/items', { productId, quantity }).then((r) => r.data),
  addCombo: (payload) => api.post('/cart/combo-items', payload).then((r) => r.data),
  update: (productId, quantity) =>
    api.put('/cart/items', { productId, quantity }).then((r) => r.data),
  remove: (productId) => api.delete(`/cart/items/${productId}`).then((r) => r.data),
  clear: () => api.delete('/cart').then((r) => r.data),
};

export const orderApi = {
  create: (payload) => api.post('/orders', payload).then((r) => r.data),
  getByCode: (code) => api.get(`/orders/${code}`).then((r) => r.data),
};

export const leadApi = {
  create: (payload) => api.post('/leads', payload).then((r) => r.data),
};

export const analyticsApi = {
  startSession: (payload) => api.post('/analytics/session/start', payload).then((r) => r.data),
  heartbeat: (payload) => api.post('/analytics/session/heartbeat', payload).then((r) => r.data),
  pageView: (payload) => api.post('/analytics/page-view', payload).then((r) => r.data),
  event: (payload) => api.post('/analytics/event', payload).then((r) => r.data),
};

export const authApi = {
  login: (payload) => api.post('/auth/admin/login', payload).then((r) => r.data),
  me: () => api.get('/auth/admin/me').then((r) => r.data),
  logout: () => api.post('/auth/admin/logout').then((r) => r.data),
};

export const customerAuthApi = {
  register: (payload) => api.post('/auth/customer/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/customer/login', payload).then((r) => r.data),
  googleLogin: (payload) => api.post('/auth/customer/google', payload).then((r) => r.data),
  me: () => api.get('/auth/customer/me').then((r) => r.data),
  logout: () => api.post('/auth/customer/logout').then((r) => r.data),
  forgotPassword: (payload) =>
    api.post('/auth/customer/forgot-password', payload).then((r) => r.data),
  resetPassword: (payload) =>
    api.post('/auth/customer/reset-password', payload).then((r) => r.data),
};

export const petProfileApi = {
  list: () => api.get('/customer/pet-profiles').then((r) => r.data),
  get: (id) => api.get(`/customer/pet-profiles/${id}`).then((r) => r.data),
  create: (payload) => api.post('/customer/pet-profiles', payload).then((r) => r.data),
  uploadPhoto: (formData) =>
    api.post('/customer/pet-profiles/upload-photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  update: (id, payload) => api.put(`/customer/pet-profiles/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/customer/pet-profiles/${id}`).then((r) => r.data),
  recommend: (id, payload = {}) => api.post(`/customer/pet-profiles/${id}/recommendation`, payload, { timeout: 45000 }).then((r) => r.data),
};

export const adminApi = {
  // products
  listProducts: (params) => api.get('/admin/products', { params }).then((r) => r.data),
  getProduct: (id) => api.get(`/admin/products/${id}`).then((r) => r.data),
  createProduct: (formData) =>
    api
      .post('/admin/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  updateProduct: (id, formData) =>
    api
      .put(`/admin/products/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`).then((r) => r.data),
  // categories
  listCategories: () => api.get('/admin/categories').then((r) => r.data),
  createCategory: (data) => api.post('/admin/categories', data).then((r) => r.data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`).then((r) => r.data),
  // orders
  listOrders: (params) => api.get('/admin/orders', { params }).then((r) => r.data),
  getOrder: (id) => api.get(`/admin/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id, payload) =>
    api.put(`/admin/orders/${id}/status`, payload).then((r) => r.data),
  // leads
  listLeads: (params) => api.get('/admin/leads', { params }).then((r) => r.data),
  updateLead: (id, data) => api.put(`/admin/leads/${id}`, data).then((r) => r.data),
  deleteLead: (id) => api.delete(`/admin/leads/${id}`).then((r) => r.data),
  // stats
  overview: () => api.get('/admin/stats/overview').then((r) => r.data),
  analyticsOverview: (params) => api.get('/admin/analytics/overview', { params }).then((r) => r.data),
  analyticsTrafficSources: (params) =>
    api.get('/admin/analytics/traffic-sources', { params }).then((r) => r.data),
  analyticsFunnel: (params) => api.get('/admin/analytics/funnel', { params }).then((r) => r.data),
  analyticsAiUsage: (params) => api.get('/admin/analytics/ai-usage', { params }).then((r) => r.data),
  analyticsPages: (params) => api.get('/admin/analytics/pages', { params }).then((r) => r.data),
  generateAnalyticsReport: (params) =>
    api.post('/admin/analytics/ai-report/generate', null, { params }).then((r) => r.data),
  // customers
  listCustomers: (params) => api.get('/admin/customers', { params }).then((r) => r.data),
  getCustomer: (id) => api.get(`/admin/customers/${id}`).then((r) => r.data),
  updateCustomerStatus: (id, payload) =>
    api.patch(`/admin/customers/${id}/status`, payload).then((r) => r.data),
};




