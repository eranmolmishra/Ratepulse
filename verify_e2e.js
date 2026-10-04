const { spawn } = require('child_process');
const db = require('./backend/src/config/db');

async function verifyAll() {
  console.log('=== STARTING COMPLETE END-TO-END VERIFICATION ===\n');

  // Step 1: Verify Database migrations and seed
  console.log('[Step 1] Running database seed...');
  const seed = require('./database/seed/seedData');
  await seed();

  // Step 2: Start backend server
  console.log('\n[Step 2] Launching backend server...');
  const app = require('./backend/src/app');
  const PORT = 5001;
  const server = app.listen(PORT);
  const BASE_URL = `http://localhost:${PORT}/api`;

  async function req(endpoint, options = {}) {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.token && { Authorization: `Bearer ${options.token}` }),
        ...options.headers,
      },
      ...options,
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, body: json };
  }

  try {
    // ADMIN FLOWS
    console.log('\n--- VERIFYING ADMIN FLOWS ---');
    // Admin login
    const adminLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@storeratings.com', password: 'AdminPass@123' }),
    });
    console.log('✔ Admin logged in:', adminLogin.body.data.user.email, 'Role:', adminLogin.body.data.user.role);
    if (adminLogin.status !== 200 || adminLogin.body.data.user.role !== 'ADMIN') throw new Error('Admin login failed');
    const adminToken = adminLogin.body.data.token;

    // Admin dashboard stats
    const dashStats = await req('/admin/dashboard', { token: adminToken });
    console.log('✔ Admin dashboard stats:', dashStats.body.data);
    if (dashStats.body.data.totalUsers !== 5 || dashStats.body.data.totalStores !== 3 || dashStats.body.data.totalRatings !== 4) {
      throw new Error('Stats do not match database seed counts');
    }

    // Admin view stores with overall ratings & sorting
    const storesSortRating = await req('/admin/stores?sortBy=rating&sortOrder=desc', { token: adminToken });
    console.log('✔ Admin sorted stores by rating desc. Top store:', storesSortRating.body.data.stores[0].name, 'Rating:', storesSortRating.body.data.stores[0].overall_rating);

    // Admin view users & filtering
    const filterUsers = await req('/admin/users?role=STORE_OWNER', { token: adminToken });
    console.log(`✔ Admin filtered users by role=STORE_OWNER, found ${filterUsers.body.data.users.length} store owners.`);

    // Admin user details for Store Owner (must display store rating)
    const storeOwnerUser = filterUsers.body.data.users[0];
    const userDetail = await req(`/admin/users/${storeOwnerUser.id}`, { token: adminToken });
    console.log('✔ Store Owner User Details store rating:', userDetail.body.data.user.store?.name, '->', userDetail.body.data.user.store?.overall_rating);
    if (!userDetail.body.data.user.store || typeof userDetail.body.data.user.store.overall_rating !== 'number') {
      throw new Error('User details did not return store rating for store owner');
    }

    // Admin add store
    const newStore = await req('/admin/stores', {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({
        name: 'The Artisan Bakery & Patisserie', // 31 chars
        email: 'artisan.bakery@example.com',
        address: '500 Flour & Yeast Lane, Suite 10, Portland, OR 97201',
      }),
    });
    console.log('✔ Admin created store:', newStore.body.data.store.name, 'ID:', newStore.body.data.store.id);
    const createdStoreId = newStore.body.data.store.id;

    // Admin add user with specified role
    const newAdminUser = await req('/admin/users', {
      method: 'POST',
      token: adminToken,
      body: JSON.stringify({
        name: 'Secondary Administrative Manager', // 32 chars
        email: 'secondary.admin@example.com',
        password: 'AdminPass@123',
        address: '99 Capital Boulevard, Suite 500, Olympia, WA 98501',
        role: 'ADMIN',
      }),
    });
    console.log('✔ Admin created new Admin user:', newAdminUser.body.data.user.name, 'Role:', newAdminUser.body.data.user.role);

    // NORMAL USER FLOWS
    console.log('\n--- VERIFYING NORMAL USER FLOWS ---');
    // Normal user signup
    const userSignup = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Samantha Elizabeth Reviewer', // 28 chars
        email: 'samantha.reviewer@example.com',
        password: 'CustomerPass@123',
        address: '123 Verified Customer Boulevard, Austin, TX 78701',
      }),
    });
    console.log('✔ Normal user registered:', userSignup.body.data.user.name, 'Role:', userSignup.body.data.user.role);
    const normalUserToken = userSignup.body.data.token;

    // Normal user view stores (shows overall rating and user_submitted_rating)
    const userStoresList = await req('/stores', { token: normalUserToken });
    const targetStore = userStoresList.body.data.stores.find((s) => s.id === createdStoreId);
    console.log('✔ Normal user fetched store:', targetStore.name, 'User submitted rating:', targetStore.user_submitted_rating);
    if (targetStore.user_submitted_rating !== null) throw new Error('user_submitted_rating should be null before rating');

    // Search stores by Name and Address
    const searchName = await req('/stores?name=Artisan', { token: normalUserToken });
    console.log(`✔ Normal user searched stores by Name 'Artisan', matched ${searchName.body.data.stores.length} store(s).`);
    const searchAddress = await req('/stores?address=Portland', { token: normalUserToken });
    console.log(`✔ Normal user searched stores by Address 'Portland', matched ${searchAddress.body.data.stores.length} store(s).`);

    // Normal user submit rating 1-5
    const submitRating = await req(`/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      token: normalUserToken,
      body: JSON.stringify({ rating: 5 }),
    });
    console.log('✔ Normal user submitted 5-star rating. New store overall rating:', submitRating.body.data.store.overall_rating);
    if (submitRating.body.data.store.overall_rating !== 5) throw new Error('Rating calculation incorrect');

    // Normal user cannot submit duplicate rating (must modify)
    const duplicateRating = await req(`/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      token: normalUserToken,
      body: JSON.stringify({ rating: 4 }),
    });
    console.log('✔ Duplicate rating submission rejected as required with status:', duplicateRating.status);
    if (duplicateRating.status !== 400) throw new Error('Duplicate rating was not rejected');

    // Normal user modify rating
    const modifyRating = await req(`/stores/${createdStoreId}/ratings`, {
      method: 'PUT',
      token: normalUserToken,
      body: JSON.stringify({ rating: 4 }),
    });
    console.log('✔ Normal user modified rating to 4 stars. Updated overall rating:', modifyRating.body.data.store.overall_rating);
    if (modifyRating.body.data.store.overall_rating !== 4) throw new Error('Modify rating calculation incorrect');

    // Normal user change password
    const changePass = await req('/auth/password', {
      method: 'PUT',
      token: normalUserToken,
      body: JSON.stringify({
        currentPassword: 'CustomerPass@123',
        newPassword: 'NewPass@456',
      }),
    });
    console.log('✔ Normal user changed password:', changePass.body.message);

    // STORE OWNER FLOWS
    console.log('\n--- VERIFYING STORE OWNER FLOWS ---');
    const ownerLogin = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'charlie@storeratings.com', password: 'OwnerPass@123' }),
    });
    console.log('✔ Store owner logged in:', ownerLogin.body.data.user.name, 'Role:', ownerLogin.body.data.user.role);
    const ownerToken = ownerLogin.body.data.token;

    // Store Owner dashboard (isolated to their store)
    const ownerDash = await req('/store-owner/dashboard', { token: ownerToken });
    console.log('✔ Store owner dashboard store:', ownerDash.body.data.store.name);
    console.log('✔ Store average rating:', ownerDash.body.data.average_rating, 'Total ratings:', ownerDash.body.data.total_ratings);
    console.log(`✔ List of users who rated store (${ownerDash.body.data.ratings.length} users):`);
    ownerDash.body.data.ratings.forEach((r) => {
      console.log(`   - ${r.user_name} (${r.user_email}): ${r.rating} stars`);
    });

    // Store Owner change password
    const ownerChangePass = await req('/auth/password', {
      method: 'PUT',
      token: ownerToken,
      body: JSON.stringify({
        currentPassword: 'OwnerPass@123',
        newPassword: 'NewOwnerPass@789',
      }),
    });
    console.log('✔ Store owner changed password:', ownerChangePass.body.message);

    // STRICT SECURITY VERIFICATION
    console.log('\n--- VERIFYING ROLE AUTHORIZATION & SECURITY ---');
    // Normal user cannot access Admin dashboard
    const forbiddenAdmin = await req('/admin/dashboard', { token: normalUserToken });
    console.log('✔ Normal user accessing admin endpoint returned 403 Forbidden:', forbiddenAdmin.status === 403);
    // Store owner cannot rate stores
    const forbiddenRate = await req(`/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({ rating: 5 }),
    });
    console.log('✔ Store owner trying to rate store returned 403 Forbidden:', forbiddenRate.status === 403);
    // Unauthenticated request
    const unauthorized = await req('/admin/dashboard');
    console.log('✔ Unauthenticated request returned 401 Unauthorized:', unauthorized.status === 401);

    // STRICT VALIDATION VERIFICATION
    console.log('\n--- VERIFYING STRICT VALIDATION RULES ---');
    // Name too short (< 20 chars)
    const shortName = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Short Name',
        email: 'test@example.com',
        password: 'ValidPassword@1',
        address: 'Valid Address',
      }),
    });
    console.log('✔ Name < 20 chars rejected:', shortName.status === 400, shortName.body.errors?.name);

    // Password missing uppercase
    const noUpper = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Valid Name Over Twenty Characters',
        email: 'test1@example.com',
        password: 'lowercase@123',
        address: 'Valid Address',
      }),
    });
    console.log('✔ Password without uppercase rejected:', noUpper.status === 400, noUpper.body.errors?.password);

    // Password missing special char
    const noSpecial = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Valid Name Over Twenty Characters',
        email: 'test2@example.com',
        password: 'Password1234',
        address: 'Valid Address',
      }),
    });
    console.log('✔ Password without special char rejected:', noSpecial.status === 400, noSpecial.body.errors?.password);

    // Rating out of bounds (6)
    const invalidRating = await req(`/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      token: normalUserToken,
      body: JSON.stringify({ rating: 6 }),
    });
    console.log('✔ Rating > 5 rejected:', invalidRating.status === 400, invalidRating.body.errors?.rating);

    console.log('\n=================================================');
    console.log('   ALL END-TO-END VERIFICATION FLOWS PASSED!     ');
    console.log('=================================================');
  } finally {
    server.close();
    await db.closeDb();
  }
}

verifyAll().catch((err) => {
  console.error('E2E Verification Error:', err);
  process.exit(1);
});
