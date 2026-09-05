const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// ── REGISTER WORKER (Society Admin) ─────────────────────
// POST /api/society/workers/register
const registerWorker = async (req, res, next) => {
  try {
    const societyId = req.society?.societyId || 1;
    const {
      name, age, address, phone, email, category, skills,
      aadhaar, city, kycMethod,          // 'certificate' | 'community_voucher' / 'client_reference'
      certId,
      voucherMemberName, voucherMemberPhone, voucherMemberAddress,
      clientRefs,                        // array of { refName, refPhone, refAddress }
      photoUrl,
      bankAccountNo, bankIfsc, bankName, bankDetails,
      dailyRate, hourlyRate,
    } = req.body;

    if (!name || !phone || !category || !kycMethod) {
      return res.status(400).json({ success: false, message: 'Name, phone, category and KYC method are required.' });
    }

    // Phone number must contain exactly 10 digits
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Worker phone number must be exactly 10 digits.' });
    }

    // Validate client reference phones if provided
    if (voucherMemberPhone) {
      const cleanVPhone = String(voucherMemberPhone).replace(/\D/g, '');
      if (cleanVPhone.length !== 10) {
        return res.status(400).json({ success: false, message: 'Client reference phone number must be exactly 10 digits.' });
      }
    }
    if (Array.isArray(clientRefs)) {
      for (const ref of clientRefs) {
        if (ref.refPhone) {
          const cleanRP = String(ref.refPhone).replace(/\D/g, '');
          if (cleanRP.length !== 10) {
            return res.status(400).json({
              success: false,
              message: `Reference phone for "${ref.refName || 'client'}" must be exactly 10 digits.`,
            });
          }
        }
      }
    }

    // Duplicate phone check
    const dup = await pool.query('SELECT id FROM workers WHERE phone = $1', [cleanPhone]);
    if (dup.rows.length) {
      return res.status(409).json({ success: false, message: 'A worker with this phone number is already registered.' });
    }

    // Generate unique worker ID: WRK-<cityPrefix>-<seq>
    const count = await pool.query('SELECT COUNT(*) FROM workers WHERE society_id = $1', [societyId]);
    const seq = String(parseInt(count.rows[0]?.count || 0) + 1).padStart(4, '0');

    // Get society city
    const socRes = await pool.query('SELECT city FROM societies WHERE id = $1', [societyId]).catch(() => ({ rows: [] }));
    const cityPrefix = ((socRes.rows[0]?.city) || city || 'GEN').slice(0, 3).toUpperCase();
    const workerUniqueId = `WRK-${cityPrefix}-${seq}`;

    // Generate default password = phone last 4 digits
    const defaultPassword = cleanPhone.slice(-4);
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const skillsJson = Array.isArray(skills) ? JSON.stringify(skills) : JSON.stringify([]);
    const parsedAge = age ? parseInt(age, 10) : null;

    const finalBankDetails = typeof bankDetails === 'object' && bankDetails !== null
      ? bankDetails
      : {
          accountNumber: bankAccountNo || null,
          ifsc: bankIfsc || null,
          bankName: bankName || null,
        };

    // KYC Status logic:
    // Government Certified: KYC status completed successfully immediately ('active' / certified)
    // Client Reference: KYC status set to 'verifying' or 'pending'
    const isGovCert = kycMethod === 'certificate';
    const kycStatus = isGovCert ? 'active' : 'verifying';
    const certVerified = isGovCert;
    const isAvailable = isGovCert;
    const availability = isGovCert ? 'available' : 'offline';

    const { rows } = await pool.query(
      `INSERT INTO workers
         (society_id, worker_code, name, age, address, phone, email, category, skills, aadhaar_masked,
          city, kyc_method, kyc_status, cert_id, cert_verified,
          voucher_member_name, voucher_member_phone, voucher_approved,
          photo_url, bank_account_no, bank_ifsc, bank_name, bank_details,
          daily_rate, hourly_rate,
          worker_unique_id, password_hash, must_change_password,
          is_available, availability, is_active, rating_avg, rating_count,
          completed_jobs, member_since, created_at, updated_at)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,
          $11,$12,$13,$14,$15,
          $16,$17,$18,
          $19,$20,$21,$22,$23::jsonb,
          $24,$25,
          $26,$27,TRUE,
          $28,$29,TRUE,0,0,
          0,NOW(),NOW(),NOW())
       RETURNING *`,
      [
        societyId,
        workerUniqueId,
        name,
        parsedAge,
        address || null,
        cleanPhone,
        email || null,
        category,
        skillsJson,
        aadhaar ? aadhaar.slice(0, 4) + 'XXXXXXXX' : null,
        city || null,
        kycMethod,
        kycStatus,
        certId || null,
        certVerified,
        voucherMemberName || null,
        voucherMemberPhone ? String(voucherMemberPhone).replace(/\D/g, '') : null,
        isGovCert, // voucher approved
        photoUrl || null,
        bankAccountNo || null,
        bankIfsc || null,
        bankName || null,
        JSON.stringify(finalBankDetails),
        parseFloat(dailyRate || 0),
        parseFloat(hourlyRate || 0),
        workerUniqueId,
        passwordHash,
        isAvailable,
        availability,
      ]
    );

    const worker = rows[0];

    // Store Client Reference(s) if provided
    if (Array.isArray(clientRefs) && clientRefs.length > 0) {
      for (const ref of clientRefs) {
        if (ref.refPhone || ref.refName) {
          const cleanRefPhone = String(ref.refPhone || '').replace(/\D/g, '');
          await pool.query(
            `INSERT INTO worker_kyc_refs (worker_id, ref_name, ref_phone, ref_address, verified, created_at)
             VALUES ($1, $2, $3, $4, FALSE, NOW())`,
            [worker.id, ref.refName || null, cleanRefPhone, ref.refAddress || null]
          );
        }
      }
    } else if (voucherMemberName || voucherMemberPhone) {
      const cleanRefPhone = String(voucherMemberPhone || '').replace(/\D/g, '');
      await pool.query(
        `INSERT INTO worker_kyc_refs (worker_id, ref_name, ref_phone, ref_address, verified, created_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW())`,
        [worker.id, voucherMemberName || null, cleanRefPhone, voucherMemberAddress || null]
      );
    }

    res.status(201).json({
      success: true,
      message: isGovCert
        ? `Worker registered successfully! Government certification verified. KYC status is COMPLETED.`
        : `Worker registered successfully! Client references saved. KYC verification in progress.`,
      worker: {
        id: worker.id,
        uniqueId: worker.worker_unique_id,
        name: worker.name,
        age: worker.age,
        address: worker.address,
        phone: worker.phone,
        category: worker.category,
        skills: worker.skills,
        photoUrl: worker.photo_url,
        bankAccountNo: worker.bank_account_no,
        bankIfsc: worker.bank_ifsc,
        bankName: worker.bank_name,
        kycStatus: worker.kyc_status,
        kycMethod: worker.kyc_method,
        certVerified: worker.cert_verified,
        defaultPassword, // shown for society head to note
      },
    });
  } catch (err) { next(err); }
};

// ── SUBMIT KYC STEP 2 (Reference phones & addresses) ──────
// POST /api/society/workers/:workerId/kyc/refs
const submitKycRefs = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { refs } = req.body; // array of { refName, refPhone, refAddress }

    if (!Array.isArray(refs) || refs.length < 1) {
      return res.status(400).json({ success: false, message: 'At least 1 reference is required.' });
    }

    for (const ref of refs) {
      if (ref.refPhone) {
        const cleanRefPhone = String(ref.refPhone).replace(/\D/g, '');
        if (cleanRefPhone.length !== 10) {
          return res.status(400).json({
            success: false,
            message: `Reference phone for "${ref.refName || 'client'}" must be exactly 10 digits.`,
          });
        }

        await pool.query(
          `INSERT INTO worker_kyc_refs (worker_id, ref_name, ref_phone, ref_address, verified, created_at)
           VALUES ($1, $2, $3, $4, FALSE, NOW())`,
          [workerId, ref.refName || null, cleanRefPhone, ref.refAddress || null]
        );
      }
    }

    // Update worker kyc_status to 'verifying'
    await pool.query(
      `UPDATE workers SET kyc_status = 'verifying', updated_at = NOW() WHERE id = $1`,
      [workerId]
    );

    res.json({ success: true, message: 'KYC client references submitted. Verification in progress.' });
  } catch (err) { next(err); }
};

// ── APPROVE KYC (Society Head) ───────────────────────────
// PATCH /api/society/workers/:workerId/kyc/approve
const approveKyc = async (req, res, next) => {
  try {
    const { workerId } = req.params;

    await pool.query(
      `UPDATE workers
       SET kyc_status = 'active', cert_verified = TRUE, is_active = TRUE,
           is_available = TRUE, availability = 'available',
           updated_at = NOW()
       WHERE id = $1`,
      [workerId]
    );

    await pool.query(
      `UPDATE worker_kyc_refs SET verified = TRUE WHERE worker_id = $1`,
      [workerId]
    );

    res.json({ success: true, message: 'Worker KYC approved and verified. Worker is now active.' });
  } catch (err) { next(err); }
};

// ── REJECT KYC ───────────────────────────────────────────
// PATCH /api/society/workers/:workerId/kyc/reject
const rejectKyc = async (req, res, next) => {
  try {
    const { workerId } = req.params;
    const { reason } = req.body;

    await pool.query(
      `UPDATE workers
       SET kyc_status = 'rejected', is_active = FALSE, is_available = FALSE, availability = 'offline', updated_at = NOW()
       WHERE id = $1`,
      [workerId]
    );
    res.json({ success: true, message: 'Worker KYC rejected.' });
  } catch (err) { next(err); }
};

// ── LIST WORKERS (Society Admin) ─────────────────────────
// GET /api/society/workers
const listWorkers = async (req, res, next) => {
  try {
    const societyId = req.society?.societyId || 1;
    const { status, category, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE w.society_id = $1';
    const params = [societyId];

    if (status) { where += ` AND w.kyc_status = $${params.length + 1}`; params.push(status); }
    if (category) { where += ` AND w.category = $${params.length + 1}`; params.push(category); }

    const { rows } = await pool.query(
      `SELECT w.id, w.worker_unique_id, w.name, w.age, w.address, w.phone, w.category, w.skills,
              w.photo_url, w.bank_account_no, w.bank_ifsc, w.bank_name, w.bank_details,
              w.kyc_status, w.kyc_method, w.availability, w.cert_id,
              w.is_available, w.rating_avg, w.completed_jobs, w.daily_rate,
              w.member_since, w.city, w.cert_verified,
              (SELECT json_agg(r) FROM worker_kyc_refs r WHERE r.worker_id = w.id) AS kyc_refs
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
        age: w.age,
        address: w.address,
        phone: w.phone,
        category: w.category,
        skills: w.skills,
        photoUrl: w.photo_url,
        bankAccountNo: w.bank_account_no,
        bankIfsc: w.bank_ifsc,
        bankName: w.bank_name,
        bankDetails: w.bank_details,
        kycStatus: w.kyc_status,
        kycMethod: w.kyc_method,
        certId: w.cert_id,
        certVerified: w.cert_verified,
        availability: w.availability || (w.is_available ? 'available' : 'offline'),
        ratingAvg: parseFloat(w.rating_avg) || 0,
        completedJobs: parseInt(w.completed_jobs) || 0,
        dailyRate: parseFloat(w.daily_rate) || 0,
        joinedAt: w.member_since,
        city: w.city,
        kycRefs: w.kyc_refs || [],
      })),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total.rows[0]?.count || 0) },
    });
  } catch (err) { next(err); }
};

// ── GET SINGLE WORKER ────────────────────────────────────
const getWorker = async (req, res, next) => {
  try {
    const societyId = req.society?.societyId || 1;
    const { workerId } = req.params;

    const { rows } = await pool.query(
      `SELECT w.*,
         (SELECT json_agg(r) FROM worker_kyc_refs r WHERE r.worker_id = w.id) AS kyc_refs,
         (SELECT json_agg(row_to_json(rt)) FROM ratings rt WHERE rt.worker_id = w.id LIMIT 10) AS recent_ratings
       FROM workers w
       WHERE w.id = $1 AND w.society_id = $2`,
      [workerId, societyId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const w = rows[0];
    res.json({
      success: true,
      worker: {
        ...w,
        uniqueId: w.worker_unique_id,
        bankDetails: w.bank_details,
        bankAccountNo: w.bank_account_no,
        bankIfsc: w.bank_ifsc,
        bankName: w.bank_name,
        kycRefs: w.kyc_refs || [],
      },
    });
  } catch (err) { next(err); }
};

module.exports = { registerWorker, submitKycRefs, approveKyc, rejectKyc, listWorkers, getWorker };
