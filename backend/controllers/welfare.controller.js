const pool = require('../config/db');

// GET /api/society/welfare/enrollments
const getEnrollments = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT we.*, w.name AS worker_name, w.category FROM welfare_enrollments we
       JOIN workers w ON we.worker_id = w.id
       WHERE we.society_id=$1 ORDER BY we.enrolled_at DESC`,
      [req.society.societyId]
    );
    res.json({
      success: true,
      enrollments: result.rows.map(e => ({
        workerId: e.worker_id, workerName: e.worker_name,
        category: e.category, schemeId: e.scheme_id,
        status: e.status, enrolledAt: e.enrolled_at,
      }))
    });
  } catch (err) { next(err); }
};

// POST /api/society/welfare/enroll
const enrollWorker = async (req, res, next) => {
  try {
    const { workerId, schemeId } = req.body;
    const sid = req.society.societyId;

    await pool.query(
      `INSERT INTO welfare_enrollments (society_id, worker_id, scheme_id)
       VALUES ($1,$2,$3) ON CONFLICT (worker_id, scheme_id) DO NOTHING`,
      [sid, workerId, schemeId]
    );

    res.json({ success: true, message: `Worker enrolled in ${schemeId} successfully.` });
  } catch (err) { next(err); }
};

// GET /api/society/welfare/advances
const getAdvances = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT wa.*, w.name AS worker_name FROM welfare_advances wa
       JOIN workers w ON wa.worker_id = w.id
       WHERE wa.society_id=$1 ORDER BY wa.requested_at DESC`,
      [req.society.societyId]
    );
    res.json({
      success: true,
      advances: result.rows.map(a => ({
        id: a.id, workerId: a.worker_id, workerName: a.worker_name,
        amount: parseFloat(a.amount), reason: a.reason,
        status: a.status, approvedAt: a.approved_at,
        repaidAmount: parseFloat(a.repaid_amount || 0),
        remaining: parseFloat(a.amount) - parseFloat(a.repaid_amount || 0),
        requestedAt: a.requested_at,
      }))
    });
  } catch (err) { next(err); }
};

// POST /api/society/welfare/advance
const applyAdvance = async (req, res, next) => {
  try {
    const { workerId, amount, reason } = req.body;
    if (amount < 500 || amount > 10000) {
      return res.status(400).json({ success: false, message: 'Advance amount must be between ₹500 and ₹10,000.' });
    }
    const result = await pool.query(
      'INSERT INTO welfare_advances (society_id, worker_id, amount, reason) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.society.societyId, workerId, amount, reason]
    );
    res.status(201).json({ success: true, advance: result.rows[0] });
  } catch (err) { next(err); }
};

// PATCH /api/society/welfare/advance/:id/approve
const approveAdvance = async (req, res, next) => {
  try {
    const result = await pool.query(
      "UPDATE welfare_advances SET status='approved', approved_at=NOW(), updated_at=NOW() WHERE id=$1 AND society_id=$2 RETURNING *",
      [req.params.id, req.society.societyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Advance not found.' });
    res.json({ success: true, advance: result.rows[0] });
  } catch (err) { next(err); }
};

// PATCH /api/society/welfare/advance/:id/reject
const rejectAdvance = async (req, res, next) => {
  try {
    const result = await pool.query(
      "UPDATE welfare_advances SET status='rejected', updated_at=NOW() WHERE id=$1 AND society_id=$2 RETURNING *",
      [req.params.id, req.society.societyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Advance not found.' });
    res.json({ success: true, message: 'Advance rejected.' });
  } catch (err) { next(err); }
};

module.exports = { getEnrollments, enrollWorker, getAdvances, applyAdvance, approveAdvance, rejectAdvance };
