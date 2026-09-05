const pool = require('../config/db');

const formatComplaint = (c, responses = []) => ({
  id: c.id,
  complaintRef: c.complaint_ref,
  bookingId: c.booking_id,
  workerId: c.worker_id,
  customerName: c.customer_name,
  workerName: c.worker_name,
  category: c.category,
  type: c.type,
  title: c.title,
  description: c.description,
  severity: c.severity,
  status: c.status,
  resolution: c.resolution,
  escalationReason: c.escalation_reason,
  escalatedAt: c.escalated_at,
  resolvedAt: c.resolved_at,
  raisedAt: c.raised_at,
  responses: responses.map(r => r.response),
});

// GET /api/society/complaints
const getAllComplaints = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM complaints WHERE society_id=$1';
    const params = [req.society.societyId];
    if (status) { query += ' AND status=$2'; params.push(status); }
    query += ' ORDER BY raised_at DESC';

    const result = await pool.query(query, params);

    const complaints = await Promise.all(result.rows.map(async (c) => {
      const resp = await pool.query(
        'SELECT * FROM complaint_responses WHERE complaint_id=$1 ORDER BY created_at ASC',
        [c.id]
      );
      return formatComplaint(c, resp.rows);
    }));

    res.json({ success: true, complaints });
  } catch (err) { next(err); }
};

// GET /api/society/complaints/:id
const getComplaintById = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM complaints WHERE id=$1 AND society_id=$2', [req.params.id, req.society.societyId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    const resp = await pool.query('SELECT * FROM complaint_responses WHERE complaint_id=$1 ORDER BY created_at ASC', [req.params.id]);
    res.json({ success: true, complaint: formatComplaint(result.rows[0], resp.rows) });
  } catch (err) { next(err); }
};

// POST /api/society/complaints/:id/respond
const addResponse = async (req, res, next) => {
  try {
    const { response } = req.body;
    await pool.query(
      'INSERT INTO complaint_responses (complaint_id, response) VALUES ($1,$2)',
      [req.params.id, response]
    );
    await pool.query(
      "UPDATE complaints SET status='under_review', updated_at=NOW() WHERE id=$1 AND society_id=$2",
      [req.params.id, req.society.societyId]
    );
    res.json({ success: true, message: 'Response added.' });
  } catch (err) { next(err); }
};

// PATCH /api/society/complaints/:id/resolve
const resolve = async (req, res, next) => {
  try {
    const { resolution } = req.body;
    const result = await pool.query(
      "UPDATE complaints SET status='resolved', resolution=$1, resolved_at=NOW(), updated_at=NOW() WHERE id=$2 AND society_id=$3 RETURNING *",
      [resolution, req.params.id, req.society.societyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Complaint not found.' });
    res.json({ success: true, complaint: formatComplaint(result.rows[0]) });
  } catch (err) { next(err); }
};

// POST /api/society/complaints/:id/escalate
const escalate = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await pool.query(
      "UPDATE complaints SET status='escalated', escalation_reason=$1, escalated_at=NOW(), updated_at=NOW() WHERE id=$2 AND society_id=$3 RETURNING *",
      [reason, req.params.id, req.society.societyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Complaint not found.' });

    // Log the escalation as a response
    await pool.query(
      'INSERT INTO complaint_responses (complaint_id, responder, response) VALUES ($1,$2,$3)',
      [req.params.id, 'Society Admin', `Escalated to Federation: ${reason}`]
    );

    res.json({ success: true, complaint: formatComplaint(result.rows[0]) });
  } catch (err) { next(err); }
};

module.exports = { getAllComplaints, getComplaintById, addResponse, resolve, escalate };
