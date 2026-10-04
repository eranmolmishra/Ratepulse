const { hashPassword } = require('../../backend/src/utils/password');
const db = require('../../backend/src/config/db');

async function seedData() {
  console.log('[Seed] Seeding database with initial records...');
  try {
    // Clear existing data cleanly (in reverse foreign key order)
    await db.query('DELETE FROM ratings');
    await db.query('DELETE FROM stores');
    await db.query('DELETE FROM users');

    // Hash passwords (min 8 max 16, uppercase, special char)
    const adminHash = await hashPassword('AdminPass@123');
    const userHash = await hashPassword('UserPass@123');
    const ownerHash = await hashPassword('OwnerPass@123');

    // 1. Seed Users (Name 20-60 chars)
    const usersData = [
      {
        name: 'System Administrator Account', // 28 chars
        email: 'admin@storeratings.com',
        password: adminHash,
        address: 'Suite 100, Central Administrative Tower, Silicon Valley, CA 94025',
        role: 'ADMIN',
      },
      {
        name: 'Alice Johnson Verified Reviewer', // 31 chars
        email: 'alice@storeratings.com',
        password: userHash,
        address: '742 Evergreen Terrace, Springfield, OR 97477',
        role: 'USER',
      },
      {
        name: 'Bob Smith Senior Shopper Member', // 31 chars
        email: 'bob@storeratings.com',
        password: userHash,
        address: '221B Baker Street, Marylebone, London, UK',
        role: 'USER',
      },
      {
        name: 'Charlie Brown Cafe Proprietor', // 29 chars
        email: 'charlie@storeratings.com',
        password: ownerHash,
        address: '12 Roasted Bean Way, Seattle, WA 98101',
        role: 'STORE_OWNER',
      },
      {
        name: 'Diana Prince Market Operator', // 28 chars
        email: 'diana@storeratings.com',
        password: ownerHash,
        address: '456 Metropolis Avenue, New York, NY 10001',
        role: 'STORE_OWNER',
      },
    ];

    const insertedUsers = {};
    for (const u of usersData) {
      const res = await db.query(
        `INSERT INTO users (name, email, password, address, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, role`,
        [u.name, u.email, u.password, u.address, u.role]
      );
      insertedUsers[u.email] = res.rows[0];
    }
    console.log(`[Seed] Seeded ${Object.keys(insertedUsers).length} users.`);

    // 2. Seed Stores (Name 20-60 chars)
    const storesData = [
      {
        name: 'Artisan Coffee Roasters Downtown', // 32 chars
        email: 'charlie@storeratings.com',
        address: '12 Roasted Bean Way, Seattle, WA 98101',
        owner_id: insertedUsers['charlie@storeratings.com'].id,
      },
      {
        name: 'Evergreen Organic Grocery Mart', // 30 chars
        email: 'diana@storeratings.com',
        address: '456 Metropolis Avenue, New York, NY 10001',
        owner_id: insertedUsers['diana@storeratings.com'].id,
      },
      {
        name: 'Metro Tech Electronics Superstore', // 33 chars
        email: 'contact@metrotechsuperstore.com',
        address: '789 Silicon Boulevard, San Jose, CA 95110',
        owner_id: null,
      },
    ];

    const insertedStores = [];
    for (const s of storesData) {
      const res = await db.query(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email`,
        [s.name, s.email, s.address, s.owner_id]
      );
      insertedStores.push(res.rows[0]);
    }
    console.log(`[Seed] Seeded ${insertedStores.length} stores.`);

    // 3. Seed Ratings (1 <= rating <= 5)
    const ratingsData = [
      {
        user_id: insertedUsers['alice@storeratings.com'].id,
        store_id: insertedStores[0].id, // Artisan Coffee
        rating: 5,
      },
      {
        user_id: insertedUsers['alice@storeratings.com'].id,
        store_id: insertedStores[1].id, // Evergreen Organic
        rating: 4,
      },
      {
        user_id: insertedUsers['bob@storeratings.com'].id,
        store_id: insertedStores[0].id, // Artisan Coffee
        rating: 4,
      },
      {
        user_id: insertedUsers['bob@storeratings.com'].id,
        store_id: insertedStores[2].id, // Metro Tech
        rating: 3,
      },
    ];

    for (const r of ratingsData) {
      await db.query(
        `INSERT INTO ratings (user_id, store_id, rating)
         VALUES ($1, $2, $3)`,
        [r.user_id, r.store_id, r.rating]
      );
    }
    console.log(`[Seed] Seeded ${ratingsData.length} ratings.`);

    console.log('[Seed] Database seed completed successfully!');
  } catch (error) {
    console.error('[Seed] Error seeding data:', error);
    process.exit(1);
  } finally {
    await db.closeDb();
  }
}

if (require.main === module) {
  seedData();
}

module.exports = seedData;
