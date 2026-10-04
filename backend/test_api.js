const app = require('./src/app');
const db = require('./src/config/db');
const seedData = require('../database/seed/seedData');

let server;

async function runTests() {
  const PORT = 5555;
  await db.getDb();
  await seedData();
  server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}/api`;

  console.log('--- STARTING COMPREHENSIVE BACKEND API TESTS ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // Helper request
  async function api(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.token && { Authorization: `Bearer ${options.token}` }),
        ...options.headers,
      },
      ...options,
    });
    const data = await res.json();
    return { status: res.status, data };
  }

  let adminToken = '';
  let userToken = '';
  let ownerToken = '';
  let createdUserId = null;
  let createdStoreId = null;

  // 1. Health check
  await test('Health check returns status OK', async () => {
    const res = await api('/health');
    if (res.status !== 200 || res.data.status !== 'OK') {
      throw new Error(`Expected 200 OK, got ${res.status}`);
    }
  });

  // 2. Admin Login
  await test('Admin Login with valid credentials', async () => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@storeratings.com',
        password: 'AdminPass@123',
      }),
    });
    if (res.status !== 200 || !res.data.data.token || res.data.data.user.role !== 'ADMIN') {
      throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
    }
    adminToken = res.data.data.token;
  });

  // 3. Admin Dashboard stats
  await test('Admin Dashboard returns real database stats', async () => {
    const res = await api('/admin/dashboard', { token: adminToken });
    if (res.status !== 200) throw new Error(`Dashboard status: ${res.status}`);
    const { totalUsers, totalStores, totalRatings } = res.data.data;
    if (typeof totalUsers !== 'number' || typeof totalStores !== 'number' || typeof totalRatings !== 'number') {
      throw new Error(`Invalid stats: ${JSON.stringify(res.data.data)}`);
    }
    console.log('   Stats:', { totalUsers, totalStores, totalRatings });
  });

  // 4. Admin Store List & Sorting
  await test('Admin Store List returns overall ratings and supports sorting', async () => {
    const res = await api('/admin/stores?sortBy=rating&sortOrder=desc', { token: adminToken });
    if (res.status !== 200 || !Array.isArray(res.data.data.stores)) {
      throw new Error(`Failed to list stores: ${res.status}`);
    }
    const stores = res.data.data.stores;
    if (stores.length === 0) throw new Error('No stores returned');
    if (typeof stores[0].overall_rating !== 'number') {
      throw new Error('Store overall_rating is missing or not a number');
    }
  });

  // 5. Admin User List & Filtering
  await test('Admin User List supports filtering by role', async () => {
    const res = await api('/admin/users?role=STORE_OWNER', { token: adminToken });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const users = res.data.data.users;
    if (users.length === 0 || !users.every((u) => u.role === 'STORE_OWNER')) {
      throw new Error(`Filter by role failed: ${JSON.stringify(users)}`);
    }
  });

  // 6. Admin User Details (Store Owner should show store rating)
  await test('Admin User Details for Store Owner displays store rating', async () => {
    const ownerList = await api('/admin/users?role=STORE_OWNER', { token: adminToken });
    const owner = ownerList.data.data.users[0];
    const res = await api(`/admin/users/${owner.id}`, { token: adminToken });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
    const userDetail = res.data.data.user;
    if (!userDetail.store || typeof userDetail.store.overall_rating !== 'number') {
      throw new Error(`Store owner details missing store rating: ${JSON.stringify(userDetail)}`);
    }
    console.log(`   Owner store rating: ${userDetail.store.name} -> ${userDetail.store.overall_rating}`);
  });

  // 7. Admin Add Store
  await test('Admin Add Store validates and persists store', async () => {
    const res = await api('/admin/stores', {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({
        name: 'The Grand Gourmet Bakery Downtown', // > 20 chars
        email: 'bakery@grandgourmetmarket.com',
        address: '88 Sweet Briar Court, Suite 10, Portland, OR 97201',
      }),
    });
    if (res.status !== 201 || !res.data.data.store.id) {
      throw new Error(`Create store failed: ${JSON.stringify(res.data)}`);
    }
    createdStoreId = res.data.data.store.id;
  });

  // 8. Admin Add User
  await test('Admin Add User validates name/password and creates user', async () => {
    const res = await api('/admin/users', {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({
        name: 'Samantha Williams Admin Created', // > 20 chars
        email: 'samantha.williams@example.com',
        password: 'SecurePass@123',
        address: '99 Highland Avenue, Cambridge, MA 02138',
        role: 'USER',
      }),
    });
    if (res.status !== 201 || !res.data.data.user.id) {
      throw new Error(`Create user failed: ${JSON.stringify(res.data)}`);
    }
    createdUserId = res.data.data.user.id;
  });

  // 9. Normal User Registration
  await test('Normal User Registration enforces validation and creates USER', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Jonathan Doe Regular Shopper', // 28 chars
        email: 'jonathan.doe@example.com',
        password: 'ShopperPass@123',
        address: '55 Ocean View Terrace, San Francisco, CA 94122',
      }),
    });
    if (res.status !== 201 || !res.data.data.token || res.data.data.user.role !== 'USER') {
      throw new Error(`Register failed: ${JSON.stringify(res.data)}`);
    }
    userToken = res.data.data.token;
  });

  // 10. Normal User Store List (Shows user submitted rating)
  await test('Normal User Store List includes user_submitted_rating', async () => {
    const res = await api('/stores', { token: userToken });
    if (res.status !== 200 || !Array.isArray(res.data.data.stores)) {
      throw new Error(`Stores list failed: ${res.status}`);
    }
    // Initially user has not rated the newly created store
    const store = res.data.data.stores.find((s) => s.id === createdStoreId);
    if (!store) throw new Error('Created store not found in user list');
    if (store.user_submitted_rating !== null) {
      throw new Error('Expected user_submitted_rating to be null before rating');
    }
  });

  // 11. Normal User Store Search by Name and Address
  await test('Normal User Store Search works for Name and Address', async () => {
    const res = await api('/stores?search=Gourmet', { token: userToken });
    if (res.status !== 200 || res.data.data.stores.length === 0) {
      throw new Error('Search did not return matches');
    }
  });

  // 12. Normal User Submit Rating (1-5)
  await test('Normal User Submit Rating persists rating and updates store average', async () => {
    const res = await api(`/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({ rating: 5 }),
    });
    if (res.status !== 201 || res.data.data.rating.rating !== 5) {
      throw new Error(`Submit rating failed: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.store.overall_rating !== 5) {
      throw new Error(`Overall rating expected 5, got ${res.data.data.store.overall_rating}`);
    }
  });

  // 13. Normal User Cannot Submit Duplicate Rating (must modify)
  await test('Normal User cannot submit duplicate rating for same store', async () => {
    const res = await api(`/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({ rating: 4 }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${res.status}`);
    }
  });

  // 14. Normal User Modify Rating
  await test('Normal User Modify Rating updates existing rating', async () => {
    const res = await api(`/stores/${createdStoreId}/ratings`, {
      method: 'PUT',
      token: userToken,
      body: JSON.stringify({ rating: 4 }),
    });
    if (res.status !== 200 || res.data.data.rating.rating !== 4) {
      throw new Error(`Modify rating failed: ${JSON.stringify(res.data)}`);
    }
    if (res.data.data.store.overall_rating !== 4) {
      throw new Error(`Updated overall rating expected 4, got ${res.data.data.store.overall_rating}`);
    }
  });

  // 15. Store Owner Login & Dashboard
  await test('Store Owner Login and Dashboard returns ratings and store stats', async () => {
    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'charlie@storeratings.com',
        password: 'OwnerPass@123',
      }),
    });
    if (loginRes.status !== 200 || loginRes.data.data.user.role !== 'STORE_OWNER') {
      throw new Error(`Store owner login failed: ${JSON.stringify(loginRes.data)}`);
    }
    ownerToken = loginRes.data.data.token;

    const dashRes = await api('/store-owner/dashboard', { token: ownerToken });
    if (dashRes.status !== 200 || !dashRes.data.data.hasStore) {
      throw new Error(`Store owner dashboard failed: ${JSON.stringify(dashRes.data)}`);
    }
    const d = dashRes.data.data;
    if (typeof d.average_rating !== 'number' || !Array.isArray(d.ratings)) {
      throw new Error(`Invalid dashboard data format: ${JSON.stringify(d)}`);
    }
    console.log(`   Store Owner (${d.store.name}) Avg Rating: ${d.average_rating}, Total: ${d.total_ratings}`);
  });

  // 16. Security Authorization Tests
  await test('Normal User cannot access Admin Dashboard (403 Forbidden)', async () => {
    const res = await api('/admin/dashboard', { token: userToken });
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  });

  await test('Store Owner cannot submit ratings (403 Forbidden)', async () => {
    const res = await api(`/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({ rating: 5 }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403, got ${res.status}`);
    }
  });

  await test('Unauthenticated request is rejected (401 Unauthorized)', async () => {
    const res = await api('/admin/dashboard');
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  // 17. Validation Constraints Tests
  await test('Validation rejects short name (< 20 chars)', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Short Name',
        email: 'short@example.com',
        password: 'ValidPass@123',
        address: '123 Valid Address Way',
      }),
    });
    if (res.status !== 400 || !res.data.errors.name) {
      throw new Error(`Expected 400 with name error, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await test('Validation rejects invalid password (no uppercase or no special)', async () => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Valid Name Over Twenty Characters',
        email: 'nopass@example.com',
        password: 'password123', // missing uppercase and special char
        address: '123 Valid Address Way',
      }),
    });
    if (res.status !== 400 || !res.data.errors.password) {
      throw new Error(`Expected 400 with password error, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await test('Validation rejects out-of-range rating (e.g. 6)', async () => {
    const res = await api(`/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      token: userToken,
      body: JSON.stringify({ rating: 6 }),
    });
    if (res.status !== 400 || !res.data.errors.rating) {
      throw new Error(`Expected 400 with rating error, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  // 18. Password Update Test
  await test('Normal User can change password successfully', async () => {
    const res = await api('/auth/password', {
      method: 'PUT',
      token: userToken,
      body: JSON.stringify({
        currentPassword: 'ShopperPass@123',
        newPassword: 'BrandNewPass@456',
      }),
    });
    if (res.status !== 200) {
      throw new Error(`Password update failed: ${JSON.stringify(res.data)}`);
    }
    // Verify login with new password works
    const relogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'jonathan.doe@example.com',
        password: 'BrandNewPass@456',
      }),
    });
    if (relogin.status !== 200) {
      throw new Error('Login with new password failed');
    }
  });

  console.log(`\nTESTS COMPLETED: ${passed} passed, ${failed} failed.`);
  server.close();
  await db.closeDb();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error in tests:', err);
  if (server) server.close();
  process.exit(1);
});
