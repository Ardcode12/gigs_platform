const pool = require('../config/db');

// GET /api/society/dashboard/summary
const getSummary = async (req, res, next) => {
  try {
    const sid = req.society.societyId || 1;

    const [workersRes, bookingsRes, complaintsRes, paymentsRes] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE kyc_status='active') AS active, COUNT(*) FILTER (WHERE availability='available' AND kyc_status='active') AS available_now, COUNT(*) FILTER (WHERE availability='on_job' OR availability='dispatched') AS on_job, COUNT(*) FILTER (WHERE kyc_status IN ('pending','inspection_required')) AS kyc_pending FROM workers WHERE society_id=$1 AND is_active=TRUE", [sid]).catch(() => ({ rows: [{ total: 0, active: 0, available_now: 0, on_job: 0, kyc_pending: 0 }] })),
      pool.query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='pending') AS pending, COUNT(*) FILTER (WHERE DATE(requested_at)=CURRENT_DATE) AS today FROM jobs WHERE society_id=$1", [sid]).catch(() => ({ rows: [{ total: 0, pending: 0, today: 0 }] })),
      pool.query("SELECT COUNT(*) FILTER (WHERE status IN ('open','under_review')) AS open_count FROM job_reports").catch(() => ({ rows: [{ open_count: 0 }] })),
      pool.query("SELECT COALESCE(SUM(total_amount) FILTER (WHERE DATE(paid_at)=CURRENT_DATE),0) AS today_earnings, COALESCE(SUM(total_amount) FILTER (WHERE DATE_TRUNC('month', paid_at)=DATE_TRUNC('month', NOW())),0) AS month_earnings FROM payments").catch(() => ({ rows: [{ today_earnings: 0, month_earnings: 0 }] })),
    ]);

    const w = workersRes.rows[0] || {};
    const b = bookingsRes.rows[0] || {};
    const c = complaintsRes.rows[0] || {};
    const p = paymentsRes.rows[0] || {};

    res.json({
      success: true,
      dashboard: {
        totalWorkers: parseInt(w.total || 0),
        activeWorkers: parseInt(w.active || 0),
        availableNow: parseInt(w.available_now || 0),
        onJobWorkers: parseInt(w.on_job || 0),
        kycPending: parseInt(w.kyc_pending || 0),
        totalBookings: parseInt(b.total || 0),
        pendingBookings: parseInt(b.pending || 0),
        todayBookings: parseInt(b.today || 0),
        openComplaints: parseInt(c.open_count || 0),
        todayEarnings: parseFloat(p.today_earnings || 0),
        monthEarnings: parseFloat(p.month_earnings || 0),
        welfareEnrolled: 0,
      }
    });
  } catch (err) { next(err); }
};

// GET /api/society/dashboard/earnings-chart
const getEarningsChart = async (req, res, next) => {
  try {
    const { period = 'week' } = req.query;
    const days = period === 'month' ? 30 : 7;

    const result = await pool.query(
      `SELECT TO_CHAR(paid_at, 'Dy') AS day, SUM(amount) AS amount
       FROM payments WHERE society_id=$1 AND paid_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(paid_at), TO_CHAR(paid_at, 'Dy')
       ORDER BY DATE(paid_at) ASC`,
      [req.society.societyId]
    );

    res.json({ success: true, chart: result.rows.map(r => ({ day: r.day, amount: parseFloat(r.amount || 0) })) });
  } catch (err) { next(err); }
};

module.exports = { getSummary, getEarningsChart };
