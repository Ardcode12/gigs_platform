const pool = require('../config/db');

// ── Haversine distance (km between two lat/lng points) ──
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── FIND NEAREST SOCIETY ────────────────────────────────
// POST /api/gps/nearest-society
const findNearestSociety = async (req, res, next) => {
  try {
    const { lat, lng, serviceCategory } = req.body;
    if (!lat || !lng) return res.status(400).json({ success: false, message: 'lat and lng required.' });

    const { rows: societies } = await pool.query(
      `SELECT id, name, city, lat, lng, service_radius_km
       FROM societies
       WHERE is_active = TRUE AND lat IS NOT NULL AND lng IS NOT NULL`
    );

    if (!societies.length)
      return res.status(404).json({ success: false, message: 'No societies with GPS data found.' });

    // Calculate distance and filter by service radius
    const withDist = societies
      .map(s => ({ ...s, distKm: haversine(lat, lng, parseFloat(s.lat), parseFloat(s.lng)) }))
      .filter(s => s.distKm <= (parseFloat(s.service_radius_km) || 10))
      .sort((a, b) => a.distKm - b.distKm);

    if (!withDist.length)
      return res.status(404).json({ success: false, message: 'No society found near your location.' });

    const nearest = withDist[0];
    res.json({
      success: true,
      society: {
        id: nearest.id,
        name: nearest.name,
        city: nearest.city,
        distanceKm: parseFloat(nearest.distKm.toFixed(2)),
      },
    });
  } catch (err) { next(err); }
};

// ── FIND NEAREST AVAILABLE WORKER ───────────────────────
// POST /api/gps/nearest-worker
const findNearestWorker = async (req, res, next) => {
  try {
    const { lat, lng, serviceCategory, societyId } = req.body;
    if (!lat || !lng || !serviceCategory)
      return res.status(400).json({ success: false, message: 'lat, lng and serviceCategory required.' });

    const { rows: workers } = await pool.query(
      `SELECT id, name, phone, worker_unique_id, category, skills,
              photo_url, rating_avg,
              last_lat AS lat, last_lng AS lng
       FROM workers
       WHERE (is_available = TRUE OR availability = 'available')
         AND is_active = TRUE
         AND kyc_status = 'active'
         AND last_lat IS NOT NULL
         AND ($1::integer IS NULL OR society_id = $1)
         AND (category = $2 OR $2 = ANY(skills::text[]))`,
      [societyId || null, serviceCategory]
    );

    if (!workers.length)
      return res.status(404).json({ success: false, message: 'No available workers found for this service.' });

    const withDist = workers
      .map(w => ({ ...w, distKm: haversine(lat, lng, parseFloat(w.lat), parseFloat(w.lng)) }))
      .sort((a, b) => a.distKm - b.distKm);

    const nearest = withDist[0];
    res.json({
      success: true,
      worker: {
        id: nearest.id,
        uniqueId: nearest.worker_unique_id,
        name: nearest.name,
        phone: nearest.phone,
        category: nearest.category,
        photoUrl: nearest.photo_url,
        ratingAvg: parseFloat(nearest.rating_avg) || 0,
        distanceKm: parseFloat(nearest.distKm.toFixed(2)),
      },
      allNearby: withDist.slice(0, 5).map(w => ({
        id: w.id, name: w.name, distanceKm: parseFloat(w.distKm.toFixed(2))
      })),
    });
  } catch (err) { next(err); }
};

// ── CUSTOMER REQUEST SERVICE ─────────────────────────────
// POST /api/gps/request
const requestService = async (req, res, next) => {
  try {
    const {
      customerId, customerName, customerPhone,
      serviceCategory, serviceSubcategory,
      address, lat, lng,
      description, teamSize,
    } = req.body;

    if (!customerName || !customerPhone || !serviceCategory || !address || !lat || !lng)
      return res.status(400).json({ success: false, message: 'Required fields missing.' });

    const bulk = parseInt(teamSize || 1) >= 3;
    const bookingType = bulk ? 'bulk' : 'single';

    // Find nearest society
    const { rows: societies } = await pool.query(
      `SELECT id, name, lat, lng, service_radius_km FROM societies WHERE is_active = TRUE AND lat IS NOT NULL`
    );
    let societyId = null;
    if (societies.length) {
      const nearest = societies
        .map(s => ({ ...s, d: haversine(lat, lng, parseFloat(s.lat), parseFloat(s.lng)) }))
        .filter(s => s.d <= parseFloat(s.service_radius_km || 10))
        .sort((a, b) => a.d - b.d)[0];
      if (nearest) societyId = nearest.id;
    }

    let assignedWorkerId = null;

    // Auto-assign nearest worker for single requests
    if (!bulk) {
      const { rows: workers } = await pool.query(
        `SELECT id, last_lat, last_lng FROM workers
         WHERE (is_available = TRUE OR availability = 'available')
           AND is_active = TRUE AND kyc_status = 'active'
           AND last_lat IS NOT NULL
           AND ($1::integer IS NULL OR society_id = $1)
           AND (category = $2 OR $2 = ANY(skills::text[]))`,
        [societyId, serviceCategory]
      );
      if (workers.length) {
        const nearest = workers
          .map(w => ({ ...w, d: haversine(lat, lng, parseFloat(w.last_lat), parseFloat(w.last_lng)) }))
          .sort((a, b) => a.d - b.d)[0];
        assignedWorkerId = nearest.id;
      }
    }

    // Create job record
    const { rows } = await pool.query(
      `INSERT INTO jobs
         (customer_id, worker_id, service_type, service_icon, service_subcategory,
          work_details, address, lat, lng, base_amount, status,
          society_id, booking_type, team_size, customer_name, customer_phone,
          requested_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,'pending',$10,$11,$12,$13,$14,NOW(),NOW())
       RETURNING id, status`,
      [
        customerId || null,
        assignedWorkerId,
        serviceCategory,
        serviceCategory.charAt(0).toUpperCase(),
        serviceSubcategory || null,
        description || null,
        address, lat, lng,
        societyId, bookingType,
        parseInt(teamSize || 1),
        customerName, customerPhone,
      ]
    );

    res.status(201).json({
      success: true,
      message: bulk
        ? 'Bulk request sent to society. The society head will assign workers.'
        : assignedWorkerId
        ? 'Worker found and assigned. Waiting for acceptance.'
        : 'Request sent to society. No worker auto-assigned.',
      job: {
        id: rows[0].id,
        status: rows[0].status,
        type: bookingType,
        societyId,
        assignedWorkerId,
      },
    });
  } catch (err) { next(err); }
};

// ── GET SERVICE SUBCATEGORIES ────────────────────────────
// GET /api/gps/subcategories/:category
const getSubcategories = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { rows } = await pool.query(
      `SELECT id, category, subcategory, description
       FROM service_subcategories
       WHERE is_active = TRUE ${category !== 'all' ? 'AND category = $1' : ''}
       ORDER BY category, subcategory`,
      category !== 'all' ? [category] : []
    );
    res.json({ success: true, subcategories: rows });
  } catch (err) { next(err); }
};

module.exports = { findNearestSociety, findNearestWorker, requestService, getSubcategories };
