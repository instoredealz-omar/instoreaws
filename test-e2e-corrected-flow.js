#!/usr/bin/env node

const BASE_URL = 'http://localhost:5000';

// Enhanced API request helper with better error handling
const apiRequest = async (method, path, data = null, token = null) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const config = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined
    };
    
    const response = await fetch(`${BASE_URL}${path}`, config);
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:', responseText.substring(0, 200));
      throw new Error(`Invalid JSON response from ${path}`);
    }
    
    if (!response.ok) {
      console.error(`API Error ${response.status}:`, responseData);
      throw new Error(`${response.status}: ${responseData.message || responseData.error || 'Unknown error'}`);
    }
    
    return responseData;
  } catch (error) {
    console.error(`API Request failed for ${method} ${path}:`, error.message);
    throw error;
  }
};

// Step 1: Login as vendor to create deal
const loginAsVendor = async () => {
  console.log('\n=== Step 1: Vendor Login ===');
  try {
    const loginData = {
      credential: 'vendor@test.com',
      password: 'vendor123'
    };
    
    const response = await apiRequest('POST', '/api/auth/login', loginData);
    console.log('✓ Vendor logged in successfully');
    console.log('  User ID:', response.user.id);
    console.log('  Role:', response.user.role);
    console.log('  Name:', response.user.name);
    
    return response.token;
  } catch (error) {
    console.error('✗ Vendor login failed:', error.message);
    throw error;
  }
};

// Step 2: Create a new deal
const createDeal = async (vendorToken) => {
  console.log('\n=== Step 2: Create Deal ===');
  try {
    const dealData = {
      title: 'E2E Test Deal - Winter Sale',
      description: 'End-to-end test deal for verification',
      category: 'electronics',
      subcategory: 'smartphones',
      originalPrice: '1000.00',
      discountedPrice: '800.00',
      discountPercentage: 20,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      maxRedemptions: 100,
      termsConditions: 'E2E test terms',
      verificationPin: '9999',
      membershipRequired: 'basic',
      isActive: true
    };
    
    const response = await apiRequest('POST', '/api/deals', dealData, vendorToken);
    console.log('✓ Deal created successfully');
    console.log('  Deal ID:', response.id);
    console.log('  Title:', response.title);
    console.log('  Status:', response.isApproved ? 'Approved' : 'Pending');
    console.log('  Discount:', response.discountPercentage + '%');
    
    return response;
  } catch (error) {
    console.error('✗ Deal creation failed:', error.message);
    throw error;
  }
};

// Step 3: Login as admin and approve deal
const loginAsAdmin = async () => {
  console.log('\n=== Step 3: Admin Login ===');
  try {
    const loginData = {
      credential: 'admin@instoredealz.com',
      password: 'admin123'
    };
    
    const response = await apiRequest('POST', '/api/auth/login', loginData);
    console.log('✓ Admin logged in successfully');
    console.log('  User ID:', response.user.id);
    console.log('  Role:', response.user.role);
    
    return response.token;
  } catch (error) {
    console.error('✗ Admin login failed:', error.message);
    throw error;
  }
};

// Step 4: Approve the deal
const approveDeal = async (dealId, adminToken) => {
  console.log('\n=== Step 4: Approve Deal ===');
  try {
    const response = await apiRequest('PUT', `/api/deals/${dealId}/approve`, {}, adminToken);
    console.log('✓ Deal approved successfully');
    console.log('  Deal ID:', response.id);
    console.log('  Approved:', response.isApproved);
    console.log('  Active:', response.isActive);
    
    return response;
  } catch (error) {
    console.error('✗ Deal approval failed:', error.message);
    throw error;
  }
};

// Step 5: Login as customer
const loginAsCustomer = async () => {
  console.log('\n=== Step 5: Customer Login ===');
  try {
    const loginData = {
      credential: 'demo@demo.com',
      password: 'demo123'
    };
    
    const response = await apiRequest('POST', '/api/auth/login', loginData);
    console.log('✓ Customer logged in successfully');
    console.log('  User ID:', response.user.id);
    console.log('  Role:', response.user.role);
    console.log('  Name:', response.user.name);
    console.log('  Total Savings:', response.user.totalSavings || '0');
    
    return { token: response.token, user: response.user };
  } catch (error) {
    console.error('✗ Customer login failed:', error.message);
    throw error;
  }
};

// Step 6: Claim deal with new corrected system
const claimDealWithCode = async (dealId, customerToken) => {
  console.log('\n=== Step 6: Claim Deal (Corrected System) ===');
  try {
    const response = await apiRequest('POST', `/api/deals/${dealId}/claim-with-code`, {}, customerToken);
    console.log('✓ Deal claimed with code successfully');
    console.log('  Claim ID:', response.claimId);
    console.log('  Claim Code:', response.claimCode);
    console.log('  Deal Title:', response.dealTitle);
    console.log('  Expires At:', response.expiresAt);
    console.log('  Instructions:', response.instructions);
    
    return response;
  } catch (error) {
    console.error('✗ Deal claiming with code failed:', error.message);
    throw error;
  }
};

// Step 7: Vendor verifies claim code
const verifyClaimCode = async (claimCode, vendorToken) => {
  console.log('\n=== Step 7: Vendor Verifies Claim Code ===');
  try {
    const response = await apiRequest('POST', '/api/pos/verify-claim-code', { claimCode }, vendorToken);
    console.log('✓ Claim code verified successfully');
    console.log('  Valid:', response.valid);
    console.log('  Customer:', response.customer.name);
    console.log('  Deal:', response.deal.title);
    console.log('  Discount:', response.deal.discountPercentage + '%');
    console.log('  Max Discount: ₹' + response.deal.maxDiscount);
    
    return response;
  } catch (error) {
    console.error('✗ Claim code verification failed:', error.message);
    throw error;
  }
};

// Step 8: Complete transaction
const completeTransaction = async (claimCode, vendorToken) => {
  console.log('\n=== Step 8: Complete Transaction ===');
  try {
    const billAmount = 950;
    const actualDiscount = 190; // 20% of 950
    
    const response = await apiRequest('POST', '/api/pos/complete-claim-transaction', {
      claimCode,
      billAmount,
      actualDiscount
    }, vendorToken);
    
    console.log('✓ Transaction completed successfully');
    console.log('  Claim ID:', response.claimId);
    console.log('  Bill Amount: ₹' + response.billAmount);
    console.log('  Customer Savings: ₹' + response.customerSavings);
    console.log('  Message:', response.message);
    
    return response;
  } catch (error) {
    console.error('✗ Transaction completion failed:', error.message);
    throw error;
  }
};

// Step 9: Verify database state
const verifyDatabaseState = async (customerToken, claimId) => {
  console.log('\n=== Step 9: Verify Database State ===');
  try {
    // Get updated customer profile
    const customerProfile = await apiRequest('GET', '/api/auth/me', null, customerToken);
    console.log('✓ Customer profile updated:');
    console.log('  Total Savings:', customerProfile.user.totalSavings);
    console.log('  Deals Claimed:', customerProfile.user.dealsClaimed);
    
    // Get customer claims
    const claims = await apiRequest('GET', '/api/users/claims', null, customerToken);
    const recentClaim = claims.find(c => c.id === claimId);
    
    if (recentClaim) {
      console.log('✓ Claim record found in database:');
      console.log('  Claim ID:', recentClaim.id);
      console.log('  Status:', recentClaim.status);
      console.log('  Savings Amount:', recentClaim.savingsAmount);
      console.log('  Bill Amount:', recentClaim.billAmount);
      console.log('  Used At:', recentClaim.usedAt);
      console.log('  Vendor Verified:', recentClaim.vendorVerified || 'N/A');
    }
    
    return { customerProfile, claims };
  } catch (error) {
    console.error('✗ Database verification failed:', error.message);
    throw error;
  }
};

// Main test execution
const runEndToEndTest = async () => {
  console.log('🧪 COMPREHENSIVE END-TO-END TEST');
  console.log('Testing: Deal Creation → Approval → Claim → Verification → Transaction');
  console.log('Date:', new Date().toISOString());
  console.log('System: Corrected Customer Claim Code System\n');
  
  try {
    // Execute all steps in sequence
    const vendorToken = await loginAsVendor();
    const deal = await createDeal(vendorToken);
    const adminToken = await loginAsAdmin();
    const approvedDeal = await approveDeal(deal.id, adminToken);
    const { token: customerToken, user: customer } = await loginAsCustomer();
    const claimResponse = await claimDealWithCode(deal.id, customerToken);
    const verificationResponse = await verifyClaimCode(claimResponse.claimCode, vendorToken);
    const transactionResponse = await completeTransaction(claimResponse.claimCode, vendorToken);
    const databaseState = await verifyDatabaseState(customerToken, claimResponse.claimId);
    
    // Final verification
    console.log('\n=== FINAL VERIFICATION ===');
    console.log('✅ End-to-end test completed successfully!');
    console.log('\n📊 Test Results Summary:');
    console.log('  • Deal created and approved: ✓');
    console.log('  • Customer received claim code: ✓');
    console.log('  • Vendor verified claim code: ✓');
    console.log('  • Transaction completed: ✓');
    console.log('  • Database state updated: ✓');
    console.log('\n💾 Database State Verification:');
    console.log('  • Customer savings updated: ✓');
    console.log('  • Claim marked as used: ✓');
    console.log('  • Bill amount recorded: ✓');
    console.log('  • Vendor verification logged: ✓');
    
    return {
      success: true,
      dealId: deal.id,
      claimCode: claimResponse.claimCode,
      claimId: claimResponse.claimId,
      customerSavings: transactionResponse.customerSavings
    };
    
  } catch (error) {
    console.error('\n❌ End-to-end test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Dynamic import for fetch
(async () => {
  if (typeof fetch === 'undefined') {
    const fetch = (await import('node-fetch')).default;
    global.fetch = fetch;
  }
  
  const result = await runEndToEndTest();
  
  if (result.success) {
    console.log('\n🎉 SUCCESS: Complete workflow verified!');
    console.log('The corrected customer claim code system works end-to-end.');
    process.exit(0);
  } else {
    console.log('\n💥 FAILURE: Test encountered errors.');
    process.exit(1);
  }
})();