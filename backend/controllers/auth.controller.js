const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ── Helpers ─────────────────────────────────────────────
const sign = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ── SOCIETY LOGIN ────────────────────────────────────────
// POST /api/auth/society/login
const societyLogin = async (req, res, next) => {
  try {
    const { societyCode, password } = req.body;
    const code = (societyCode || 'SOC-TEST-1').trim().toUpperCase();

    // Check DB for matching active society
    let rows = [];
    try {
      const dbRes = await pool.query(
        `SELECT * FROM societies WHERE (society_code = $1 OR id::text = $1) AND is_active = TRUE`,
        [code]
      );
      rows = dbRes.rows;
    } catch (e) {
      rows = [];
    }

    if (rows.length && rows[0].password_hash && password) {
      const match = await bcrypt.compare(password, rows[0].password_hash);
      if (match) {
        const society = rows[0];
        const token = sign({
          role: 'society',
          societyId: society.id,
          societyCode: society.society_code,
          name: society.name,
          district: society.district,
        });

        return res.json({
          success: true,
          role: 'society',
          token,
          society: {
            id: society.id,
            code: society.society_code,
            name: society.name,
            district: society.district,
            state: society.state,
            operatorName: society.operator_name,
            operatorPhone: society.operator_phone,
            federationId: society.federation_id,
          },
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid Society Code or Password. Please check your credentials.',
    });
  } catch (err) { next(err); }
};

// ── WORKER LOGIN ─────────────────────────────────────────
// POST /api/auth/worker/login
const workerLogin = async (req, res, next) => {
  try {
    const { workerId, password } = req.body;
    if (!workerId || !password)
      return res.status(400).json({ success: false, message: 'Worker ID and password are required.' });

    const { rows } = await pool.query(
      `SELECT w.*, s.name AS society_name
       FROM workers w
       LEFT JOIN societies s ON s.id = w.society_id
       WHERE w.worker_unique_id = $1 AND w.is_active = TRUE`,
      [workerId]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Invalid Worker ID or password.' });

    const worker = rows[0];
    const match = await bcrypt.compare(password, worker.password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid Worker ID or password.' });

    const token = sign({
      role: 'worker',
      workerId: worker.id,
      workerUniqueId: worker.worker_unique_id,
      name: worker.name,
      societyId: worker.society_id,
    });

    res.json({
      success: true,
      role: 'worker',
      token,
      worker: {
        id: worker.id,
        uniqueId: worker.worker_unique_id,
        name: worker.name,
        phone: worker.phone,
        category: worker.category,
        skills: worker.skills,
        availability: worker.availability || worker.is_available,
        photoUrl: worker.photo_url,
        ratingAvg: worker.rating_avg,
        completedJobs: worker.completed_jobs,
        societyId: worker.society_id,
        societyName: worker.society_name,
        mustChangePassword: worker.must_change_password,
      },
    });
  } catch (err) { next(err); }
};

// ── CUSTOMER REGISTER ────────────────────────────────────
// POST /api/auth/customer/register
const customerRegister = async (req, res, next) => {
  try {
    const { name, phone, email, password, address, lat, lng } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ success: false, message: 'Name, phone and password are required.' });

    // Check duplicate phone
    const exists = await pool.query('SELECT id FROM customers WHERE phone = $1', [phone]);
    if (exists.rows.length)
      return res.status(409).json({ success: false, message: 'Phone number already registered.' });

    const hash = await bcrypt.hash(password, 10);

    // Generate unique customer ID: CUS-<city prefix>-<sequence>
    const count = await pool.query('SELECT COUNT(*) FROM customers');
    const seq = String(parseInt(count.rows[0].count) + 1).padStart(4, '0');
    const cityPrefix = (address || 'GEN').slice(0, 3).toUpperCase();
    const customerUniqueId = `CUS-${cityPrefix}-${seq}`;

    const { rows } = await pool.query(
      `INSERT INTO customers (name, phone, email, password_hash, address, lat, lng, customer_unique_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       RETURNING id, name, phone, customer_unique_id, created_at`,
      [name, phone, email || null, hash, address || null, lat || null, lng || null, customerUniqueId]
    );

    const customer = rows[0];
    const token = sign({
      role: 'customer',
      customerId: customer.id,
      customerUniqueId: customer.customer_unique_id,
      name: customer.name,
    });

    res.status(201).json({
      success: true,
      role: 'customer',
      token,
      customer: {
        id: customer.id,
        uniqueId: customer.customer_unique_id,
        name: customer.name,
        phone: customer.phone,
        createdAt: customer.created_at,
      },
    });
  } catch (err) { next(err); }
};

// ── CUSTOMER LOGIN ───────────────────────────────────────
// POST /api/auth/customer/login
const customerLogin = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ success: false, message: 'Phone and password are required.' });

    const { rows } = await pool.query(
      'SELECT * FROM customers WHERE phone = $1 AND is_active = TRUE',
      [phone]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Invalid phone or password.' });

    const customer = rows[0];
    if (!customer.password_hash)
      return res.status(401).json({ success: false, message: 'Password not set. Please register first.' });

    const match = await bcrypt.compare(password, customer.password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid phone or password.' });

    const token = sign({
      role: 'customer',
      customerId: customer.id,
      customerUniqueId: customer.customer_unique_id,
      name: customer.name,
    });

    res.json({
      success: true,
      role: 'customer',
      token,
      customer: {
        id: customer.id,
        uniqueId: customer.customer_unique_id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        lat: customer.lat,
        lng: customer.lng,
        ratingAvg: customer.rating_avg,
      },
    });
  } catch (err) { next(err); }
};

// ── SHARED LOGOUT ────────────────────────────────────────
const logout = (req, res) => res.json({ success: true, message: 'Logged out.' });

// ── GET AUTH USER (Verify Session) ───────────────────────
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user,
      role: req.user?.role,
    });
  } catch (err) { next(err); }
};

module.exports = { societyLogin, workerLogin, customerRegister, customerLogin, logout, getMe };
