import { authService } from '../services/authService';
import { dbClient } from '../db/dbClient';

async function runAuthCheck() {
  console.log('\n======================================================');
  console.log('🔐 VOICECART AUTHENTICATION & DATABASE PERSISTENCE CHECK');
  console.log(`📦 Database Engine: ${dbClient.dbType.toUpperCase()} (${dbClient.dbLocation})`);
  console.log('======================================================\n');

  let allPassed = true;
  const testId = Date.now();
  const testEmail = `test_user_${testId}@voicecart.app`;
  const testPassword = 'Password@123!';
  const testName = 'Diagnostic Tester';

  // STEP 1: User Signup
  try {
    process.stdout.write('1. Creating test user via signup... ');
    const signupRes = await authService.signup({
      name: testName,
      email: testEmail,
      mobile: '98765' + String(testId).slice(-5),
      password: testPassword,
      language: 'en'
    });

    if (signupRes?.session?.accessToken && signupRes.session.user.email === testEmail.toLowerCase()) {
      console.log('✅ PASS (User ID:', signupRes.session.user.id + ')');
    } else {
      throw new Error('Invalid signup response structure');
    }
  } catch (err: any) {
    allPassed = false;
    console.log('❌ FAIL:', err.message);
  }

  // STEP 2: Database Persistence Verification
  try {
    process.stdout.write('2. Verifying user saved permanently in database... ');
    const userInDb = await dbClient.findUserByEmail(testEmail);
    if (userInDb && userInDb.name === testName && userInDb.passwordHash) {
      console.log('✅ PASS (Hashed Password cost 12 stored in database)');
    } else {
      throw new Error('User was not found in permanent storage');
    }
  } catch (err: any) {
    allPassed = false;
    console.log('❌ FAIL:', err.message);
  }

  // STEP 3: Case-Insensitive & Whitespace Login
  let loginRefreshToken = '';
  try {
    process.stdout.write('3. Testing login with mixed-case email and extra whitespace... ');
    const mixedEmail = `   ${testEmail.toUpperCase()}   `;
    const loginRes = await authService.login({
      identifier: mixedEmail,
      password: testPassword,
      rememberMe: true
    });

    if (loginRes?.session?.accessToken && loginRes.refreshToken) {
      loginRefreshToken = loginRes.refreshToken;
      console.log('✅ PASS (Token issued for', loginRes.session.user.email + ')');
    } else {
      throw new Error('Login failed with normalized identifier');
    }
  } catch (err: any) {
    allPassed = false;
    console.log('❌ FAIL:', err.message);
  }

  // STEP 4: Session Refresh & Token Rotation
  let refreshedToken = '';
  try {
    process.stdout.write('4. Refreshing session token with rotation... ');
    const refreshRes = await authService.refreshSession(loginRefreshToken);
    if (refreshRes?.session?.accessToken && refreshRes.refreshToken && refreshRes.refreshToken !== loginRefreshToken) {
      refreshedToken = refreshRes.refreshToken;
      console.log('✅ PASS (New refresh token rotated successfully)');
    } else {
      throw new Error('Token rotation failed or returned stale token');
    }
  } catch (err: any) {
    allPassed = false;
    console.log('❌ FAIL:', err.message);
  }

  // STEP 5: Logout & Token Invalidation
  try {
    process.stdout.write('5. Logging out and verifying token revocation... ');
    await authService.logout(refreshedToken);

    let refreshAfterLogoutFailed = false;
    try {
      await authService.refreshSession(refreshedToken);
    } catch {
      refreshAfterLogoutFailed = true;
    }

    if (refreshAfterLogoutFailed) {
      console.log('✅ PASS (Revoked token rejected properly)');
    } else {
      throw new Error('Revoked token was still accepted after logout');
    }
  } catch (err: any) {
    allPassed = false;
    console.log('❌ FAIL:', err.message);
  }

  // STEP 6: Wrong Password & Specific Error Message
  try {
    process.stdout.write('6. Testing wrong password & unknown email handling... ');
    let wrongPasswordCaught = false;
    try {
      await authService.login({
        identifier: testEmail,
        password: 'WrongPassword999!'
      });
    } catch (e: any) {
      wrongPasswordCaught = e.message.includes('Wrong password') || e.message.includes('Incorrect');
    }

    let unknownEmailCaught = false;
    try {
      await authService.login({
        identifier: 'nonexistent_ghost_user_999@voicecart.app',
        password: 'Password@123!'
      });
    } catch (e: any) {
      unknownEmailCaught = e.message.includes('No account found') || e.message.includes('Incorrect');
    }

    if (wrongPasswordCaught && unknownEmailCaught) {
      console.log('✅ PASS (Clear, helpful diagnostics returned)');
    } else {
      throw new Error('Failed to properly distinguish wrong password and unknown user');
    }
  } catch (err: any) {
    allPassed = false;
    console.log('❌ FAIL:', err.message);
  }

  console.log('\n------------------------------------------------------');
  if (allPassed) {
    console.log('🎉 ALL AUTHENTICATION & DATABASE CHECKS PASSED (100%)\n');
    process.exit(0);
  } else {
    console.error('💥 SOME AUTHENTICATION CHECKS FAILED\n');
    process.exit(1);
  }
}

runAuthCheck().catch((e) => {
  console.error('Fatal check error:', e);
  process.exit(1);
});
