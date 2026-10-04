const db = require('../config/db');

class UserRepository {
  async findById(id) {
    const result = await db.query(
      'SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByIdWithPassword(id) {
    const result = await db.query(
      'SELECT id, name, email, password, address, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email) {
    const result = await db.query(
      'SELECT id, name, email, password, address, role, created_at, updated_at FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows[0] || null;
  }

  async create({ name, email, password, address, role }) {
    const result = await db.query(
      `INSERT INTO users (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, address, role, created_at, updated_at`,
      [name.trim(), email.trim().toLowerCase(), password, address.trim(), role]
    );
    return result.rows[0];
  }

  async updatePassword(id, hashedPassword) {
    const result = await db.query(
      `UPDATE users
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, email, address, role, updated_at`,
      [hashedPassword, id]
    );
    return result.rows[0] || null;
  }

  async countAll() {
    const result = await db.query('SELECT COUNT(*)::int AS count FROM users');
    return result.rows[0].count;
  }

  async findAll({ name, email, address, role, sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    const conditions = [];
    const params = [];

    if (name && name.trim()) {
      params.push(`%${name.trim()}%`);
      conditions.push(`name ILIKE $${params.length}`);
    }

    if (email && email.trim()) {
      params.push(`%${email.trim()}%`);
      conditions.push(`email ILIKE $${params.length}`);
    }

    if (address && address.trim()) {
      params.push(`%${address.trim()}%`);
      conditions.push(`address ILIKE $${params.length}`);
    }

    if (role && role.trim()) {
      params.push(role.trim());
      conditions.push(`role = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortFields = {
      name: 'name',
      email: 'email',
      address: 'address',
      role: 'role',
      created_at: 'created_at',
    };
    const orderColumn = allowedSortFields[sortBy] || 'created_at';
    const direction = sortOrder && sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const sql = `
      SELECT id, name, email, address, role, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY ${orderColumn} ${direction}
    `;

    const result = await db.query(sql, params);
    return result.rows;
  }

  async getUserDetailsWithStore(id) {
    const user = await this.findById(id);
    if (!user) return null;

    if (user.role === 'STORE_OWNER') {
      const storeRes = await db.query(
        `SELECT s.id, s.name, s.email, s.address,
                COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) AS overall_rating,
                COUNT(r.id)::int AS total_ratings
         FROM stores s
         LEFT JOIN ratings r ON s.id = r.store_id
         WHERE s.owner_id = $1 OR LOWER(s.email) = LOWER($2)
         GROUP BY s.id, s.name, s.email, s.address`,
        [user.id, user.email]
      );

      const store = storeRes.rows[0] || null;
      return {
        ...user,
        store: store
          ? {
              id: store.id,
              name: store.name,
              email: store.email,
              address: store.address,
              overall_rating: Number(store.overall_rating),
              total_ratings: store.total_ratings,
            }
          : null,
      };
    }

    return user;
  }
}

module.exports = new UserRepository();
