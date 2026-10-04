const db = require('../config/db');

class RatingRepository {
  async findByUserAndStore(userId, storeId) {
    const result = await db.query(
      'SELECT id, user_id, store_id, rating, created_at, updated_at FROM ratings WHERE user_id = $1 AND store_id = $2',
      [userId, storeId]
    );
    return result.rows[0] || null;
  }

  async create({ userId, storeId, rating }) {
    const result = await db.query(
      `INSERT INTO ratings (user_id, store_id, rating)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, store_id, rating, created_at, updated_at`,
      [userId, storeId, rating]
    );
    return result.rows[0];
  }

  async update({ userId, storeId, rating }) {
    const result = await db.query(
      `UPDATE ratings
       SET rating = $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND store_id = $3
       RETURNING id, user_id, store_id, rating, created_at, updated_at`,
      [rating, userId, storeId]
    );
    return result.rows[0] || null;
  }

  async countAll() {
    const result = await db.query('SELECT COUNT(*)::int AS count FROM ratings');
    return result.rows[0].count;
  }

  async getStoreRatingSummary(storeId) {
    const result = await db.query(
      `SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS overall_rating,
              COUNT(id)::int AS total_ratings
       FROM ratings
       WHERE store_id = $1`,
      [storeId]
    );
    return {
      overall_rating: Number(result.rows[0].overall_rating),
      total_ratings: result.rows[0].total_ratings,
    };
  }

  async getStoreOwnerDashboard(ownerUserId, ownerEmail) {
    // 1. Find store owned by this user
    const storeRes = await db.query(
      `SELECT id, name, email, address, created_at, updated_at
       FROM stores
       WHERE owner_id = $1 OR LOWER(email) = LOWER($2)`,
      [ownerUserId, ownerEmail]
    );

    if (storeRes.rows.length === 0) {
      return null;
    }

    const store = storeRes.rows[0];

    // 2. Fetch rating stats and list of users who rated
    const ratingsRes = await db.query(
      `SELECT r.id AS rating_id, r.rating, r.created_at, r.updated_at,
              u.id AS user_id, u.name AS user_name, u.email AS user_email, u.address AS user_address
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.store_id = $1
       ORDER BY r.updated_at DESC`,
      [store.id]
    );

    const summaryRes = await db.query(
      `SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) AS average_rating,
              COUNT(id)::int AS total_ratings
       FROM ratings
       WHERE store_id = $1`,
      [store.id]
    );

    return {
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
      },
      average_rating: Number(summaryRes.rows[0].average_rating),
      total_ratings: summaryRes.rows[0].total_ratings,
      ratings: ratingsRes.rows,
    };
  }
}

module.exports = new RatingRepository();
