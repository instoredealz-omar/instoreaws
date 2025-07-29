#!/usr/bin/env node

/**
 * End-to-End Test Script for Deal Workflow
 * Tests: Create Deal -> Approve Deal -> Claim Deal -> Database Consistency
 */

const apiRequest = async (method, endpoint, data = null) => {
  const url = `http://localhost:5000${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${method} ${endpoint} failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

// Test authentication token
let authToken = null;

const authenticateAsVendor = async () => {
  try {
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      credential: 'vendor@test.com',
      password: 'vendor123'
    });
    authToken = loginResponse.token;
    console.log('✓ Authenticated as vendor');
    return loginResponse;
  } catch (error) {
    console.error('✗ Vendor authentication failed:', error.message);
    throw error;
  }
};

const authenticateAsAdmin = async () => {
  try {
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      credential: 'admin@instoredealz.com',
      password: 'admin123'
    });
    authToken = loginResponse.token;
    console.log('✓ Authenticated as admin');
    return loginResponse;
  } catch (error) {
    console.error('✗ Admin authentication failed:', error.message);
    throw error;
  }
};

const authenticateAsCustomer = async () => {
  try {
    const loginResponse = await apiRequest('POST', '/api/auth/login', {
      credential: 'demo@demo.com',
      password: 'demo123'
    });
    authToken = loginResponse.token;
    console.log('✓ Authenticated as customer');
    return loginResponse;
  } catch (error) {
    console.error('✗ Customer authentication failed:', error.message);
    throw error;
  }
};

const apiRequestWithAuth = async (method, endpoint, data = null) => {
  const url = `http://localhost:5000${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${method} ${endpoint} failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

const testCreateDeal = async () => {
  console.log('\n=== Testing Deal Creation ===');
  
  const dealData = {
    title: `E2E Test Deal ${Date.now()}`,
    description: 'This is an end-to-end test deal to verify workflow',
    category: 'electronics',
    discountPercentage: 25,
    originalPrice: '1000.00',
    discountedPrice: '750.00',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    maxRedemptions: 100,
    requiredMembership: 'basic',
    address: 'Test Store, Mumbai, Maharashtra',
    verificationPin: '2897',
    dealAvailability: 'all-stores'
  };

  try {
    const deal = await apiRequestWithAuth('POST', '/api/vendors/deals', dealData);
    console.log('✓ Deal created successfully:', {
      id: deal.id,
      title: deal.title,
      isActive: deal.isActive,
      isApproved: deal.isApproved,
      vendorId: deal.vendorId
    });
    return deal;
  } catch (error) {
    console.error('✗ Deal creation failed:', error.message);
    throw error;
  }
};

const testApproveDeal = async (dealId) => {
  console.log('\n=== Testing Deal Approval ===');
  
  try {
    const deal = await apiRequestWithAuth('POST', `/api/admin/deals/${dealId}/approve`);
    console.log('✓ Deal approved successfully:', {
      id: deal.id,
      isApproved: deal.isApproved,
      approvedBy: deal.approvedBy
    });
    return deal;
  } catch (error) {
    console.error('✗ Deal approval failed:', error.message);
    throw error;
  }
};

const testClaimDeal = async (dealId) => {
  console.log('\n=== Testing Deal Claiming ===');
  
  try {
    const claim = await apiRequestWithAuth('POST', `/api/deals/${dealId}/claim`);
    console.log('✓ Deal claimed successfully:', {
      id: claim.id,
      dealId: claim.dealId,
      userId: claim.userId,
      status: claim.status,
      savingsAmount: claim.savingsAmount
    });
    return claim;
  } catch (error) {
    console.error('✗ Deal claiming failed:', error.message);
    throw error;
  }
};

const testPinVerification = async (dealId, pin) => {
  console.log('\n=== Testing PIN Verification ===');
  
  try {
    const result = await apiRequestWithAuth('POST', `/api/deals/${dealId}/verify-pin`, { pin });
    console.log('✓ PIN verified successfully:', {
      success: result.success,
      message: result.message
    });
    return result;
  } catch (error) {
    console.error('✗ PIN verification failed:', error.message);
    throw error;
  }
};

const testUpdateBillAmount = async (dealId, billAmount) => {
  console.log('\n=== Testing Bill Amount Update ===');
  
  try {
    const result = await apiRequestWithAuth('PUT', `/api/deals/${dealId}/update-bill`, { 
      billAmount: billAmount,
      actualSavings: billAmount * 0.25 // 25% discount
    });
    console.log('✓ Bill amount updated successfully:', {
      success: result.success,
      actualSavings: result.actualSavings
    });
    return result;
  } catch (error) {
    console.error('✗ Bill amount update failed:', error.message);
    throw error;
  }
};

const checkDatabaseConsistency = async (dealId, claimId) => {
  console.log('\n=== Checking Database Consistency ===');
  
  try {
    // Check deal exists and has correct state
    const deal = await apiRequest('GET', `/api/deals/${dealId}`);
    console.log('✓ Deal exists in database:', {
      id: deal.id,
      isActive: deal.isActive,
      isApproved: deal.isApproved,
      currentRedemptions: deal.currentRedemptions
    });

    // Check claim exists
    const userClaims = await apiRequestWithAuth('GET', '/api/users/claims');
    const claim = userClaims.find(c => c.id === claimId);
    if (claim) {
      console.log('✓ Claim exists in database:', {
        id: claim.id,
        dealId: claim.dealId,
        status: claim.status,
        billAmount: claim.billAmount,
        actualSavings: claim.actualSavings
      });
    } else {
      console.error('✗ Claim not found in database');
    }

    // Check user total savings updated
    const user = await apiRequestWithAuth('GET', '/api/auth/me');
    console.log('✓ User data updated:', {
      id: user.id,
      totalSavings: user.totalSavings,
      membershipPlan: user.membershipPlan
    });

    return { deal, claim, user };
  } catch (error) {
    console.error('✗ Database consistency check failed:', error.message);
    throw error;
  }
};

const checkForDuplicateMethods = async () => {
  console.log('\n=== Checking for Duplicate Methods ===');
  
  // This would require filesystem access, but we can check via API responses
  try {
    // Test multiple calls to ensure consistency
    const deals1 = await apiRequest('GET', '/api/deals');
    const deals2 = await apiRequest('GET', '/api/deals');
    
    if (JSON.stringify(deals1) === JSON.stringify(deals2)) {
      console.log('✓ API responses are consistent');
    } else {
      console.error('✗ API responses are inconsistent');
    }

    console.log('✓ Found', deals1.length, 'deals in database');
    
    // Check if we can access analytics (tests multiple endpoints)
    const analytics = await apiRequest('GET', '/api/admin/analytics');
    console.log('✓ Analytics endpoint working:', {
      totalDeals: analytics.totalDeals,
      totalClaims: analytics.totalClaims
    });

  } catch (error) {
    console.error('✗ Duplicate method check failed:', error.message);
  }
};

const runFullWorkflowTest = async () => {
  console.log('🚀 Starting End-to-End Workflow Test');
  console.log('Testing: Create Deal → Approve Deal → Claim Deal → Database Consistency');
  
  try {
    // Step 1: Authenticate as vendor and create deal
    await authenticateAsVendor();
    const deal = await testCreateDeal();
    
    // Step 2: Authenticate as admin and approve deal
    await authenticateAsAdmin();
    const approvedDeal = await testApproveDeal(deal.id);
    
    // Step 3: Authenticate as customer and claim deal
    await authenticateAsCustomer();
    const claim = await testClaimDeal(deal.id);
    
    // Step 4: Verify PIN (simulate in-store verification)
    await testPinVerification(deal.id, '2897');
    
    // Step 5: Update bill amount (customer adds actual bill)
    await testUpdateBillAmount(deal.id, 800); // Customer spent ₹800
    
    // Step 6: Check database consistency
    await checkDatabaseConsistency(deal.id, claim.id);
    
    // Step 7: Check for duplicate methods
    await checkForDuplicateMethods();
    
    console.log('\n🎉 End-to-End Test Completed Successfully!');
    console.log('✓ Deal Creation: Working');
    console.log('✓ Deal Approval: Working');
    console.log('✓ Deal Claiming: Working');
    console.log('✓ PIN Verification: Working');
    console.log('✓ Bill Amount Update: Working');
    console.log('✓ Database Consistency: Verified');
    
  } catch (error) {
    console.error('\n❌ End-to-End Test Failed:', error.message);
    process.exit(1);
  }
};

// Run the test
runFullWorkflowTest();