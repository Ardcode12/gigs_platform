const pool = require('../config/db');

// Format job from DB row to match frontend Bookings format
const formatBooking = (j) => ({
  id: j.id,
  bookingRef: `BK-${j.id}`,
  type: j.booking_type || 'single',
  serviceCategory: j.service_type,
  customerName: j.customer_name || 'Customer',
  customerPhone: j.customer_phone || '',
  customerAddress: j.address || '',
  customerLat: j.lat,
  customerLng: j.lng,
  description: j.work_details || j.notes || '',
  status: j.status,
  assignedWorker: j.worker_id,
  teamSize: j.team_size || 1,
  estimatedAmount: parseFloat(j.base_amount || 0),
  finalAmount: j.final_amount ? parseFloat(j.final_amount) : null,
  paymentMode: j.payment_mode,
  paymentStatus: j.payment_status,
  requestedAt: j.requested_at,
  dispatchedAt: j.accepted_at,
  completedAt: j.completed_at,
});

// GET /api/society/bookings
const getAllBookings = async (req, res, next) => {
  try {
    const { status, type, category } = req.query;
    const sid = req.society.societyId;

    let query = 'SELECT * FROM jobs WHERE society_id=$1';
    const params = [sid];
    let idx = 2;

    if (status) { query += ` AND status=$${idx++}`; params.push(status); }
    if (type) { query += ` AND booking_type=$${idx++}`; params.push(type); }
    if (category) { query += ` AND service_type=$${idx++}`; params.push(category); }

    query += ' ORDER BY requested_at DESC';
    const result = await pool.query(query, params);

    const bookings = result.rows.map(b => formatBooking(b));
    res.json({ success: true, bookings });
  } catch (err) { next(err); }
};

// GET /api/society/bookings/incoming
const getIncoming = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM jobs WHERE society_id=$1 AND status='pending' ORDER BY requested_at ASC",
      [req.society.societyId]
    );
    res.json({ success: true, bookings: result.rows.map(b => formatBooking(b)) });
  } catch (err) { next(err); }
};

// GET /api/society/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE id=$1 AND society_id=$2',
      [req.params.id, req.society.societyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Booking not found.' });

    res.json({ success: true, booking: formatBooking(result.rows[0]) });
  } catch (err) { next(err); }
};

// POST /api/society/bookings/:id/assign  (Single worker)
const assignWorker = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { workerId } = req.body;
    const { id } = req.params;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE jobs SET worker_id=$1, status='dispatched', accepted_at=NOW(), updated_at=NOW()
       WHERE id=$2 AND society_id=$3 RETURNING *`,
      [workerId, id, req.society.societyId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Update worker availability
    await client.query(
      "UPDATE workers SET availability='dispatched', is_available=FALSE, updated_at=NOW() WHERE id=$1",
      [workerId]
    );

    await client.query('COMMIT');
    res.json({ success: true, booking: formatBooking(result.rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// POST /api/society/bookings/:id/assign-bulk  (Team)
const assignBulkTeam = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { workerIds, leadId } = req.body;
    const { id } = req.params;

    await client.query('BEGIN');

    // Update booking (we just assign the lead for now in the main table)
    const result = await client.query(
      `UPDATE jobs SET worker_id=$1, status='dispatched', accepted_at=NOW(), updated_at=NOW()
       WHERE id=$2 AND society_id=$3 RETURNING *`,
      [leadId || workerIds[0] || null, id, req.society.societyId]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    for (const wid of workerIds) {
      await client.query(
        "UPDATE workers SET availability='dispatched', is_available=FALSE, updated_at=NOW() WHERE id=$1",
        [wid]
      );
    }

    await client.query('COMMIT');

    res.json({ success: true, booking: formatBooking(result.rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// PATCH /api/society/bookings/:id/status
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const extra = status === 'completed' ? ', completed_at=NOW()' : '';

    const result = await pool.query(
      `UPDATE jobs SET status=$1${extra}, updated_at=NOW() WHERE id=$2 AND society_id=$3 RETURNING *`,
      [status, req.params.id, req.society.societyId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Booking not found.' });

    // If completed, free the worker
    if (status === 'completed' && result.rows[0].worker_id) {
      await pool.query(
        "UPDATE workers SET availability='available', is_available=TRUE, completed_jobs=completed_jobs+1, updated_at=NOW() WHERE id=$1",
        [result.rows[0].worker_id]
      );
    }

    res.json({ success: true, booking: formatBooking(result.rows[0]) });
  } catch (err) { next(err); }
};

module.exports = {
  getAllBookings, getIncoming, getBookingById,
  assignWorker, assignBulkTeam, updateStatus,
};
