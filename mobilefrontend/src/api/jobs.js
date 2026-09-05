/**
 * Customer job booking API calls.
 *
 * Every function here mirrors one endpoint in
 * mobilebackend/app/routers/customer/jobs.py and returns the parsed JSON body.
 */

import client from './client';

// Worker job endpoints
export const getRequests = () => client.get('/api/jobs/requests').then((r) => r.data);

export const getCurrentJob = () => client.get('/api/jobs/current').then((r) => r.data);

export const getJob = (jobId) => client.get(`/api/jobs/${jobId}`).then((r) => r.data);

export const getHistory = (params = {}) =>
  client.get('/api/jobs', { params }).then((r) => r.data);

export const acceptJob = (jobId) =>
  client.post(`/api/jobs/${jobId}/accept`).then((r) => r.data);

export const rejectJob = (jobId, reason) =>
  client.post(`/api/jobs/${jobId}/reject`, { reason: reason || null }).then((r) => r.data);

export const getExtraRequests = (jobId) =>
  client.get(`/api/jobs/${jobId}/extra-amount`).then((r) => r.data);

export const requestExtraAmount = (jobId, amount, reason) =>
  client
    .post(`/api/jobs/${jobId}/extra-amount`, { amount: Number(amount), reason })
    .then((r) => r.data);

/**
 * Create a new job/booking.
 * @param {Object} payload — matches CustomerJobCreate schema:
 *   { service_type, service_icon?, work_details?, address, landmark?,
 *     lat, lng, base_amount, services[]?, preferred_worker_id? }
 * @returns {Promise<Object>} CustomerJobDetail (includes otp_code)
 */
export const createJob = (payload) =>
  client.post('/api/customer/jobs', payload).then((r) => r.data);

/**
 * Get the customer's current active (in-progress) job, or null.
 * @returns {Promise<Object|null>} CustomerJobDetail or null
 */
export const getActiveJob = () =>
  client.get('/api/customer/jobs/active').then((r) => r.data);

/**
 * Get full detail of a specific job (including OTP).
 * @param {number} jobId
 * @returns {Promise<Object>} CustomerJobDetail
 */
export const getJobDetail = (jobId) =>
  client.get(`/api/customer/jobs/${jobId}`).then((r) => r.data);

/**
 * List the customer's jobs, newest first.
 * @param {Object} [opts]
 * @param {string} [opts.status] — filter by status (e.g. 'completed', 'cancelled')
 * @param {number} [opts.limit=50]
 * @param {number} [opts.offset=0]
 * @returns {Promise<Object[]>} CustomerJobListItem[]
 */
export const listJobs = ({ status, limit = 50, offset = 0 } = {}) => {
  const params = { limit, offset };
  if (status) params.status = status;
  return client.get('/api/customer/jobs', { params }).then((r) => r.data);
};

/**
 * Cancel a job.
 * @param {number} jobId
 * @returns {Promise<Object>} CustomerJobDetail (updated)
 */
export const cancelJob = (jobId) =>
  client.post(`/api/customer/jobs/${jobId}/cancel`).then((r) => r.data);

// -- Extra amount endpoints --------------------------------------------------

export const updateJobStatus = (jobId, status, otp) =>
  client.post(`/api/jobs/${jobId}/status`, { status, otp }).then((r) => r.data);
/**
 * List all extra-amount requests for a job.
 * @param {number} jobId
 * @returns {Promise<Object[]>} ExtraAmountOut[]
 */
export const listExtraRequests = (jobId) =>
  client.get(`/api/customer/extra-amount/job/${jobId}`).then((r) => r.data);

/**
 * Approve or reject a specific extra-amount request.
 * @param {number} requestId
 * @param {boolean} approve — true to approve, false to reject
 * @returns {Promise<Object>} ExtraAmountOut (updated)
 */
export const decideExtraAmount = (requestId, approve) =>
  client.post(`/api/customer/extra-amount/${requestId}/decide`, { approve }).then((r) => r.data);

// -- Customer Payment endpoints ---------------------------------------------

/**
 * Get payment/invoice record for a job.
 * @param {number} jobId
 * @returns {Promise<Object>} CustomerPaymentOut
 */
export const getJobPayment = (jobId) =>
  client.get(`/api/customer/payments/job/${jobId}`).then((r) => r.data);

/**
 * Settle payment for a completed job invoice.
 * @param {number} paymentId
 * @returns {Promise<Object>} MessageResponse
 */
export const payInvoice = (paymentId) =>
  client.post(`/api/customer/payments/${paymentId}/pay`).then((r) => r.data);
