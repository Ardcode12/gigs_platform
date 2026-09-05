const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// ── REGISTER WORKER (Society Admin) ─────────────────────
// POST /api/society/workers/register
const registerWorker = async (req, res, next) => {
  try {
    const societyId = req.society?.societyId || 1;
    const {
      name, phone, email, category, skills,
      aadhaar, city, kycMethod,          // 'certificate' | 'community_voucher'
      certId,
      voucherMemberName, voucherMemberPhone,
      photoUrl,
      dailyRate, hourlyRate,
    } = req.body;

    if (!name || !phone || !category || !kycMethod)
      return res.status(400).json({ success: false, message: 'Name, phone, category and KYC method are required.' });

    // Duplicate phone check
    const dup = await pool.query('SELECT id FROM workers WHERE phone = $1', [phone]);
    if (dup.rows.length)
      return res.status(409).json({ success: false, message: 'A worker with this phone is already registered.' });

    // Generate unique worker ID: WRK-<cityPrefix>-<seq>
    const count = await pool.query('SELECT COUNT(*) FROM workers WHERE society_id = $1', [societyId]);
    const seq = String(parseInt(count.rows[0].count) + 1).padStart(4, '0');

    // Get society city
    const socRes = await pool.query('SELECT city FROM societies WHERE id = $1', [societyId]).catch(() => ({ rows: [] }));
    const cityPrefix = ((socRes.rows[0]?.city) || city || 'GEN').slice(0, 3).toUpperCase();
    const workerUniqueId = `WRK-${cityPrefix}-${seq}`;

    // Generate default password = phone last 4 digits
    const defaultPassword = phone.slice(-4);
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify([]);

    const { rows } = await pool.query(
      `INSERT INTO workers
         (society_id, worker_code, name, phone, email, category, skills, aadhaar_masked,
          city, kyc_method, kyc_status, cert_id, cert_verified,
          voucher_member_name, voucher_member_phone, voucher_approved,
          photo_url, daily_rate, hourly_rate,
          worker_unique_id, password_hash, must_change_password,
          is_available, availability, is_active, rating_avg, rating_count,
          completed_jobs, member_since, created_at, updated_at)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,'pending',$11,FALSE,$12,$13,FALSE,
          $14,$15,$16,$17,$18,TRUE,FALSE,'offline',TRUE,0,0,0,NOW(),NOW(),NOW())
       RETURNING id, worker_code, worker_unique_id, name, phone, category, kyc_status`,
      [
        societyId, workerUniqueId, name, phone, email || null, category, skillsJson,
        aadhaar ? aadhaar.slice(0, 4) + 'XXXXXXXX' : null,
        city || null, kycMethod, certId || null,
        voucherMemberName || null, voucherMemberPhone || null,
        photoUrl || null,
        parseFloat(dailyRate || 0), parseFloat(hourlyRate || 0),
        workerUniqueId, passwordHash,
      ]
    );

    const worker = rows[0];

    res.status(201).json({
      success: true,
      message: `Worker registered. Their login ID is ${workerUniqueId} and default password is last 4 digits of phone (${defaultPassword}). They must change password on first login.`,
      worker: {
        id: worker.id,
        uniqueId: worker.worker_unique_id,
        name: worker.name,
        phone: worker.phone,
        category: worker.category,
        kycStatus: worker.kyc_status,
        defaultPassword, // shown ONCE for society head to note
      },
    });
  } catch (err) { next(err); }
};

// ── SUBMIT KYC STEP 2 (Reference phones) ────────────────
// POST /api/society/workers/:workerId/kyc/refs
const submitKycRefs = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { refs } = req.body; // array of { refName, refPhone }

    if (!Array.isArray(refs) || refs.length < 1)
      return res.status(400).json({ success: false, message: 'At least 1 reference phone required.' });

    // Insert refs
    for (const ref of refs) {
      if (ref.refPhone) {
        await pool.query(
          `INSERT INTO worker_kyc_refs (worker_id, ref_name, ref_phone, verified, created_at)
           VALUES ($1,$2,$3,FALSE,NOW())
           ON CONFLICT DO NOTHING`,
          [workerId, ref.refName || null, ref.refPhone]
        );
      }
    }

    // Update worker kyc_status to 'verifying'
    await pool.query(
      `UPDATE workers SET kyc_status = 'verifying', updated_at = NOW() WHERE id = $1`,
      [workerId]
    );

    res.json({ success: true, message: 'KYC references submitted. Verification in progress.' });
  } catch (err) { next(err); }
};

// ── APPROVE KYC (Society Head) ───────────────────────────
// PATCH /api/society/workers/:workerId/kyc/approve
const approveKyc = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { remarks } = req.body;

    await pool.query(
      `UPDATE workers
       SET kyc_status = 'active', cert_verified = TRUE, is_active = TRUE,
           updated_at = NOW()
       WHERE id = $1`,
      [workerId]
    );

    res.json({ success: true, message: 'Worker KYC approved. Worker is now active.' });
  } catch (err) { next(err); }
};

// ── REJECT KYC ───────────────────────────────────────────
// PATCH /api/society/workers/:workerId/kyc/reject
const rejectKyc = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { reason } = req.body;

    await pool.query(
      `UPDATE workers SET kyc_status = 'rejected', updated_at = NOW() WHERE id = $1`,
      [workerId]
    );
    res.json({ success: true, message: 'Worker KYC rejected.' });
  } catch (err) { next(err); }
};

// ── LIST WORKERS (Society Admin) ─────────────────────────
// GET /api/society/workers
const listWorkers = async (req, res, next) => {
  try {
    const societyId = req.society.societyId;
    const { status, category, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE w.society_id = $1';
    const params = [societyId];

    if (status) { where += ` AND w.kyc_status = $${params.length + 1}`; params.push(status); }
    if (category) { where += ` AND w.category = $${params.length + 1}`; params.push(category); }

    const { rows } = await pool.query(
      `SELECT w.id, w.worker_unique_id, w.name, w.phone, w.category, w.skills,
              w.photo_url, w.kyc_status, w.kyc_method, w.availability,
              w.is_available, w.rating_avg, w.completed_jobs, w.daily_rate,
              w.member_since, w.city, w.cert_verified
       FROM workers w
       ${where}
       ORDER BY w.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, parseInt(limit), offset]
    );

    const total = await pool.query(
      `SELECT COUNT(*) FROM workers w ${where}`, params
    );

    res.json({
      success: true,
      workers: rows.map(w => ({
        id: w.id,
        uniqueId: w.worker_unique_id,
        name: w.name,
        phone: w.phone,
        category: w.category,
        skills: w.skills,
        photoUrl: w.photo_url,
        kycStatus: w.kyc_status,
        kycMethod: w.kyc_method,
        availability: w.availability || (w.is_available ? 'available' : 'offline'),
        ratingAvg: parseFloat(w.rating_avg) || 0,
        completedJobs: parseInt(w.completed_jobs) || 0,
        dailyRate: parseFloat(w.daily_rate) || 0,
        joinedAt: w.member_since,
        city: w.city,
        certVerified: w.cert_verified,
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total.rows[0].count) },
    });
  } catch (err) { next(err); }
};

// ── GET SINGLE WORKER ────────────────────────────────────
const getWorker = async (req, res, next) => {
  try {
    const societyId = req.society.societyId;
    const { workerId } = req.params;

    const { rows } = await pool.query(
      `SELECT w.*,
         (SELECT json_agg(r) FROM worker_kyc_refs r WHERE r.worker_id = w.id) AS kyc_refs,
         (SELECT json_agg(row_to_json(rt)) FROM ratings rt WHERE rt.worker_id = w.id LIMIT 10) AS recent_ratings
       FROM workers w
       WHERE w.id = $1 AND w.society_id = $2`,
      [workerId, societyId]
    );

    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Worker not found.' });

    res.json({ success: true, worker: rows[0] });
  } catch (err) { next(err); }
};

module.exports = { registerWorker, submitKycRefs, approveKyc, rejectKyc, listWorkers, getWorker };
