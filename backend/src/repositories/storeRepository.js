const db = require('../config/db');

class StoreRepository {
  async findById(id) {
    const result = await db.query(
      `SELECT s.id, s.name, s.email, s.address, s.owner_id, s.created_at, s.updated_at,
              COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS overall_rating,
              COUNT(r.id)::int AS total_ratings
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.id = $1
       GROUP BY s.id, s.name, s.email, s.address, s.owner_id, s.created_at, s.updated_at`,
      [id]
    );
    if (!result.rows[0]) return null;
    const store = result.rows[0];
    return {
      ...store,
      overall_rating: Number(store.overall_rating),
    };
  }

  async findByEmail(email) {
    const result = await db.query(
      'SELECT id, name, email, address, owner_id, created_at, updated_at FROM stores WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows[0] || null;
  }

  async findByOwnerIdOrEmail(ownerId, ownerEmail) {
    const result = await db.query(
      `SELECT s.id, s.name, s.email, s.address, s.owner_id, s.created_at, s.updated_at,
              COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS overall_rating,
              COUNT(r.id)::int AS total_ratings
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.owner_id = $1 OR LOWER(s.email) = LOWER($2)
       GROUP BY s.id, s.name, s.email, s.address, s.owner_id, s.created_at, s.updated_at`,
      [ownerId, ownerEmail]
    );
    if (!result.rows[0]) return null;
    const store = result.rows[0];
    return {
      ...store,
      overall_rating: Number(store.overall_rating),
    };
  }

  async create({ name, email, address, owner_id = null }) {
    const result = await db.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, address, owner_id, created_at, updated_at`,
      [name.trim(), email.trim().toLowerCase(), address.trim(), owner_id]
    );
    return result.rows[0];
  }

  async countAll() {
    const result = await db.query('SELECT COUNT(*)::int AS count FROM stores');
    return result.rows[0].count;
  }

  async findAllAdmin({ name, email, address, sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    const conditions = [];
    const params = [];

    if (name && name.trim()) {
      params.push(`%${name.trim()}%`);
      conditions.push(`s.name ILIKE $${params.length}`);
    }

    if (email && email.trim()) {
      params.push(`%${email.trim()}%`);
      conditions.push(`s.email ILIKE $${params.length}`);
    }

    if (address && address.trim()) {
      params.push(`%${address.trim()}%`);
      conditions.push(`s.address ILIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields = {
      name: 's.name',
      email: 's.email',
      address: 's.address',
      rating: 'overall_rating',
      created_at: 's.created_at',
    };
    const orderColumn = allowedSortFields[sortBy] || 's.created_at';
    const direction = sortOrder && sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT s.id, s.name, s.email, s.address, s.owner_id, s.created_at, s.updated_at,
             COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS overall_rating,
             COUNT(r.id)::int AS total_ratings
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      ${whereClause}
      GROUP BY s.id, s.name, s.email, s.address, s.owner_id, s.created_at, s.updated_at
      ORDER BY ${orderColumn} ${direction}
    `;

    const result = await db.query(sql, params);
    return result.rows.map((row) => ({
      ...row,
      overall_rating: Number(row.overall_rating),
    }));
  }

  async findAllUser({ name, address, currentUserId, sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    const conditions = [];
    const params = [currentUserId];

    if (name && name.trim()) {
      params.push(`%${name.trim()}%`);
      conditions.push(`s.name ILIKE $${params.length}`);
    }

    if (address && address.trim()) {
      params.push(`%${address.trim()}%`);
      conditions.push(`s.address ILIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields = {
      name: 's.name',
      address: 's.address',
      rating: 'overall_rating',
      created_at: 's.created_at',
    };
    const orderColumn = allowedSortFields[sortBy] || 's.created_at';
    const direction = sortOrder && sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT s.id, s.name, s.email, s.address, s.created_at, s.updated_at,
             COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS overall_rating,
             COUNT(r.id)::int AS total_ratings,
             MAX(CASE WHEN r.user_id = $1 THEN r.rating ELSE NULL END) AS user_submitted_rating
      FROM stores s
      LEFT JOIN ratings r ON s.id = r.store_id
      ${whereClause}
      GROUP BY s.id, s.name, s.email, s.address, s.created_at, s.updated_at
      ORDER BY ${orderColumn} ${direction}
    `;

    const result = await db.query(sql, params);
    return result.rows.map((row) => ({
      ...row,
      overall_rating: Number(row.overall_rating),
      user_submitted_rating: row.user_submitted_rating !== null ? Number(row.user_submitted_rating) : null,
    }));
  }
}

module.exports = new StoreRepository();
