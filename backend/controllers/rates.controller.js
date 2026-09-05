const pool = require('../config/db');

const formatRate = (r) => ({
  category: r.category,
  baseRate: parseFloat(r.base_rate || 0),
  hourlyRate: parseFloat(r.hourly_rate || 0),
  dailyRate: parseFloat(r.daily_rate || 0),
  emergencySurcharge: parseFloat(r.emergency_surcharge || 25),
  nightSurcharge: parseFloat(r.night_surcharge || 35),
  emergencyEnabled: r.emergency_enabled,
  nightEnabled: r.night_enabled,
});

// GET /api/society/rates
const getAllRates = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM rate_cards WHERE society_id=$1 ORDER BY category',
      [req.society.societyId]
    );
    res.json({ success: true, rates: result.rows.map(formatRate) });
  } catch (err) { next(err); }
};

// PUT /api/society/rates/:category
const updateRate = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { baseRate, hourlyRate, dailyRate } = req.body;
    const sid = req.society.societyId;

    const result = await pool.query(
      `INSERT INTO rate_cards (society_id, category, base_rate, hourly_rate, daily_rate)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (society_id, category) DO UPDATE
       SET base_rate=$3, hourly_rate=$4, daily_rate=$5, updated_at=NOW()
       RETURNING *`,
      [sid, category, baseRate, hourlyRate, dailyRate]
    );

    res.json({ success: true, rate: formatRate(result.rows[0]) });
  } catch (err) { next(err); }
};

// PATCH /api/society/rates/emergency
const toggleEmergency = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    await pool.query(
      'UPDATE rate_cards SET emergency_enabled=$1, updated_at=NOW() WHERE society_id=$2',
      [enabled, req.society.societyId]
    );
    res.json({ success: true, emergencyEnabled: enabled });
  } catch (err) { next(err); }
};

// PATCH /api/society/rates/night-surcharge
const toggleNight = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    await pool.query(
      'UPDATE rate_cards SET night_enabled=$1, updated_at=NOW() WHERE society_id=$2',
      [enabled, req.society.societyId]
    );
    res.json({ success: true, nightEnabled: enabled });
  } catch (err) { next(err); }
};

module.exports = { getAllRates, updateRate, toggleEmergency, toggleNight };
