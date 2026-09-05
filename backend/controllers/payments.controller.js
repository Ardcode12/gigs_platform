const pool = require('../config/db');

const PLATFORM_FEE_SINGLE = 0.08; // 8%
const PLATFORM_FEE_BULK   = 0.05; // 5%

const genRef = () => `PAY${Date.now().toString().slice(-8)}`;

const formatPayment = (p) => ({
  id: p.id,
  paymentRef: p.payment_ref,
  bookingId: p.booking_id,
  type: p.type,
  amount: parseFloat(p.amount || 0),
  platformFee: parseFloat(p.platform_fee || 0),
  netAmount: parseFloat(p.net_amount || 0),
  mode: p.mode,
  status: p.status,
  transactionRef: p.transaction_ref,
  paidAt: p.paid_at,
  createdAt: p.created_at,
});

// GET /api/society/payments
const getAllPayments = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE society_id=$1 ORDER BY created_at DESC',
      [req.society.societyId]
    );
    res.json({ success: true, payments: result.rows.map(formatPayment) });
  } catch (err) { next(err); }
};

// GET /api/society/payments/summary
const getSummary = async (req, res, next) => {
  try {
    const sid = req.society.societyId;
    const result = await pool.query(
      `SELECT
        COUNT(*) AS total_transactions,
        SUM(amount) AS total_collected,
        SUM(platform_fee) AS total_commission,
        SUM(CASE WHEN status='split_pending' THEN 1 ELSE 0 END) AS split_pending_count,
        SUM(CASE WHEN mode='cash' AND status='cash_paid' THEN amount ELSE 0 END) AS cash_collected
       FROM payments WHERE society_id=$1`,
      [sid]
    );
    res.json({ success: true, summary: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /api/society/payments/reconciliation
const getReconciliation = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    const interval = period === 'day' ? '1 day' : period === 'month' ? '30 days' : '7 days';
    const result = await pool.query(
      `SELECT DATE(paid_at) as date, SUM(amount) as total, SUM(platform_fee) as commission, COUNT(*) as count
       FROM payments WHERE society_id=$1 AND paid_at >= NOW() - INTERVAL '${interval}'
       GROUP BY DATE(paid_at) ORDER BY date ASC`,
      [req.society.societyId]
    );
    res.json({ success: true, reconciliation: result.rows });
  } catch (err) { next(err); }
};

// POST /api/society/payments/cash  — Record cash payment
const recordCash = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { bookingId, amount, workerId } = req.body;
    const fee = Math.round(amount * PLATFORM_FEE_SINGLE);

    await client.query('BEGIN');

    const payResult = await client.query(
      `INSERT INTO payments (payment_ref, booking_id, society_id, type, amount, platform_fee, net_amount, mode, status, paid_at)
       VALUES ($1,$2,$3,'single',$4,$5,$6,'cash','cash_paid',NOW()) RETURNING *`,
      [genRef(), bookingId, req.society.societyId, amount, fee, amount - fee]
    );

    await client.query(
      "UPDATE bookings SET payment_status='cash_paid', payment_mode='cash', updated_at=NOW() WHERE id=$1",
      [bookingId]
    );

    await client.query('COMMIT');
    res.json({ success: true, payment: formatPayment(payResult.rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// POST /api/society/payments/:id/split — Initiate bulk split
const initiateSplit = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const bookingId = req.params.id;

    // Get booking and team
    const bookingRes = await client.query('SELECT * FROM bookings WHERE id=$1', [bookingId]);
    const booking = bookingRes.rows[0];
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const teamRes = await client.query(
      'SELECT bw.worker_id, w.name FROM booking_workers bw JOIN workers w ON bw.worker_id=w.id WHERE bw.booking_id=$1',
      [bookingId]
    );
    const team = teamRes.rows;

    const totalAmount = parseFloat(booking.estimated_amount);
    const fee = Math.round(totalAmount * PLATFORM_FEE_BULK);
    const net = totalAmount - fee;
    const perWorker = team.length > 0 ? Math.floor(net / team.length) : net;

    await client.query('BEGIN');

    // Check if payment already exists
    const existPay = await client.query('SELECT id FROM payments WHERE booking_id=$1', [bookingId]);
    let paymentId;

    if (existPay.rows.length > 0) {
      paymentId = existPay.rows[0].id;
      await client.query(
        "UPDATE payments SET status='split_pending', updated_at=NOW() WHERE id=$1",
        [paymentId]
      );
    } else {
      const payRes = await client.query(
        `INSERT INTO payments (payment_ref, booking_id, society_id, type, amount, platform_fee, net_amount, mode, status, paid_at)
         VALUES ($1,$2,$3,'bulk',$4,$5,$6,'online','split_pending',NOW()) RETURNING id`,
        [genRef(), bookingId, req.society.societyId, totalAmount, fee, net]
      );
      paymentId = payRes.rows[0].id;
    }

    // Create split records
    for (const w of team) {
      await client.query(
        'INSERT INTO payment_splits (payment_id, worker_id, worker_name, amount, status) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [paymentId, w.worker_id, w.name, perWorker, 'pending']
      );
    }

    await client.query(
      "UPDATE bookings SET payment_status='split_pending', updated_at=NOW() WHERE id=$1",
      [bookingId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Split initiated.', perWorkerAmount: perWorker, teamCount: team.length });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// PATCH /api/society/payments/:id/confirm-split
const confirmSplit = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const payRes = await client.query(
      "UPDATE payments SET status='split_done', updated_at=NOW() WHERE id=$1 AND society_id=$2 RETURNING booking_id",
      [req.params.id, req.society.societyId]
    );

    if (payRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    await client.query(
      "UPDATE payment_splits SET status='paid', paid_at=NOW() WHERE payment_id=$1",
      [req.params.id]
    );

    await client.query(
      "UPDATE bookings SET payment_status='split_done', updated_at=NOW() WHERE id=$1",
      [payRes.rows[0].booking_id]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Split confirmed. All workers paid.' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

module.exports = { getAllPayments, getSummary, getReconciliation, recordCash, initiateSplit, confirmSplit };
