const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// ── GET WORKER DASHBOARD ────────────────────────────────
// GET /api/worker/dashboard
const getWorkerDashboard = async (req, res, next) => {
  try {
    const workerId = req.worker.workerId;

    const [workerRes, jobsRes, earningsRes] = await Promise.all([
      pool.query(
        `SELECT w.id, w.worker_unique_id, w.name, w.phone, w.category,
                w.skills, w.photo_url, w.rating_avg, w.rating_count,
                w.completed_jobs, w.availability, w.is_available,
                w.kyc_status, s.name AS society_name, s.city AS society_city
         FROM workers w
         LEFT JOIN societies s ON s.id = w.society_id
         WHERE w.id = $1`,
        [workerId]
      ),
      pool.query(
        `SELECT j.id, j.service_type, j.service_subcategory, j.address,
                j.status, j.base_amount, j.final_amount, j.booking_type,
                j.requested_at, j.accepted_at, j.completed_at,
                j.customer_name, j.customer_phone,
                j.lat, j.lng, j.payment_mode, j.payment_status
         FROM jobs j
         WHERE j.worker_id = $1
         ORDER BY j.requested_at DESC
         LIMIT 20`,
        [workerId]
      ),
      pool.query(
        `SELECT COALESCE(SUM(p.total_amount), 0) AS total_earned,
                COUNT(*) AS payment_count
         FROM payments p
         WHERE p.worker_id = $1 AND p.status = 'paid'`,
        [workerId]
      ),
    ]);

    if (!workerRes.rows.length)
      return res.status(404).json({ success: false, message: 'Worker not found.' });

    const w = workerRes.rows[0];
    const jobs = jobsRes.rows;
    const pending = jobs.filter(j => j.status === 'pending').length;
    const active  = jobs.filter(j => ['accepted','on_the_way','in_progress','arrived'].includes(j.status));

    res.json({
      success: true,
      worker: {
        id: w.id,
        uniqueId: w.worker_unique_id,
        name: w.name,
        phone: w.phone,
        category: w.category,
        skills: w.skills,
        photoUrl: w.photo_url,
        ratingAvg: parseFloat(w.rating_avg) || 0,
        ratingCount: parseInt(w.rating_count) || 0,
        completedJobs: parseInt(w.completed_jobs) || 0,
        availability: w.availability || (w.is_available ? 'available' : 'offline'),
        kycStatus: w.kyc_status,
        societyName: w.society_name,
        societyCity: w.society_city,
      },
      stats: {
        pendingJobs: pending,
        activeJobs: active.length,
        totalEarned: parseFloat(earningsRes.rows[0]?.total_earned) || 0,
      },
      recentJobs: jobs.slice(0, 10),
      activeJob: active[0] || null,
    });
  } catch (err) { next(err); }
};

// ── ACCEPT / REJECT JOB ─────────────────────────────────
// PATCH /api/worker/jobs/:jobId/accept
const acceptJob = async (req, res, next) => {
  try {
    const workerId = req.worker.workerId;
    const { jobId } = req.params;

    const { rows } = await pool.query(
      `UPDATE jobs SET status = 'on_the_way', worker_accepted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND worker_id = $2 AND status = 'pending'
       RETURNING id, status`,
      [jobId, workerId]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Job not found or already accepted.' });

    res.json({ success: true, job: rows[0] });
  } catch (err) { next(err); }
};

// PATCH /api/worker/jobs/:jobId/reject
const rejectJob = async (req, res, next) => {
  try {
    const workerId = req.worker.workerId;
    const { jobId } = req.params;
    const { reason } = req.body;

    await pool.query(
      `UPDATE jobs SET status = 'pending', worker_id = NULL, updated_at = NOW()
       WHERE id = $1 AND worker_id = $2`,
      [jobId, workerId]
    );
    if (reason) {
      await pool.query(
        `INSERT INTO job_rejections (job_id, worker_id, reason, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [jobId, workerId, reason]
      );
    }
    res.json({ success: true, message: 'Job rejected.' });
  } catch (err) { next(err); }
};

// ── UPDATE JOB STATUS ───────────────────────────────────
// PATCH /api/worker/jobs/:jobId/status
const updateJobStatus = async (req, res, next) => {
  try {
    const workerId = req.worker.workerId;
    const { jobId } = req.params;
    const { status, finalAmount, paymentMode } = req.body;

    const validStatuses = ['on_the_way', 'arrived', 'in_progress', 'completed'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status.' });

    let query = `UPDATE jobs SET status = $1, updated_at = NOW()`;
    const params = [status];

    if (status === 'completed') {
      query += `, completed_at = NOW(), final_amount = $${params.length + 1}, payment_mode = $${params.length + 2}`;
      params.push(finalAmount || 0, paymentMode || 'cash');
      // Increment completed_jobs
      await pool.query(
        `UPDATE workers SET completed_jobs = completed_jobs + 1, updated_at = NOW() WHERE id = $1`,
        [workerId]
      );
    }

    query += ` WHERE id = $${params.length + 1} AND worker_id = $${params.length + 2} RETURNING *`;
    params.push(jobId, workerId);

    const { rows } = await pool.query(query, params);
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Job not found.' });

    // Log status event
    await pool.query(
      `INSERT INTO job_status_events (job_id, status, at, note) VALUES ($1, $2, NOW(), $3)`,
      [jobId, status, req.body.note || null]
    );

    res.json({ success: true, job: rows[0] });
  } catch (err) { next(err); }
};

// ── TOGGLE AVAILABILITY ─────────────────────────────────
// PATCH /api/worker/availability
const toggleAvailability = async (req, res, next) => {
  try {
    const workerId = req.worker.workerId;
    const { availability } = req.body; // 'available' | 'offline'

    const { rows } = await pool.query(
      `UPDATE workers
       SET availability = $1, is_available = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING availability, is_available`,
      [availability, availability === 'available', workerId]
    );
    res.json({ success: true, availability: rows[0].availability });
  } catch (err) { next(err); }
};

// ── CHANGE PASSWORD ─────────────────────────────────────
// POST /api/worker/change-password
const changePassword = async (req, res, next) => {
  try {
    const workerId = req.worker.workerId;
    const { currentPassword, newPassword } = req.body;

    const { rows } = await pool.query('SELECT password_hash FROM workers WHERE id = $1', [workerId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Worker not found.' });

    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE workers SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2`,
      [hash, workerId]
    );
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
};

module.exports = { getWorkerDashboard, acceptJob, rejectJob, updateJobStatus, toggleAvailability, changePassword };
