#!/usr/bin/env node

/**
 * Debug Deal Approval Issue
 */

const apiRequest = async (method, endpoint, data = null, token = null) => {
  const url = `http://localhost:5000${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

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

const debugApproval = async () => {
  try {
    console.log('=== Debugging Deal Approval Issue ===');
    
    // First get a fresh admin token
    const adminLogin = await apiRequest('POST', '/api/auth/login', {
      credential: 'admin@instoredealz.com',
      password: 'admin123'
    });
    console.log('✓ Admin authenticated');
    
    // Get pending deals
    const pendingDeals = await apiRequest('GET', '/api/admin/deals/pending', null, adminLogin.token);
    console.log('✓ Pending deals:', pendingDeals.map(d => ({ id: d.id, title: d.title, isApproved: d.isApproved })));
    
    if (pendingDeals.length === 0) {
      console.log('No pending deals to approve. Creating one first...');
      
      // Create a vendor deal first
      const vendorLogin = await apiRequest('POST', '/api/auth/login', {
        credential: 'vendor@test.com',
        password: 'vendor123'
      });
      
      const dealData = {
        title: `Debug Deal ${Date.now()}`,
        description: 'Debug deal for approval testing',
        category: 'electronics',
        discountPercentage: 20,
        originalPrice: '500.00',
        discountedPrice: '400.00',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        maxRedemptions: 50,
        requiredMembership: 'basic',
        address: 'Debug Store, Mumbai, Maharashtra',
        verificationPin: '3579',
        dealAvailability: 'all-stores'
      };
      
      const createdDeal = await apiRequest('POST', '/api/vendors/deals', dealData, vendorLogin.token);
      console.log('✓ Created deal for testing:', { id: createdDeal.id, title: createdDeal.title });
      
      // Now try to approve it
      try {
        const approvedDeal = await apiRequest('POST', `/api/admin/deals/${createdDeal.id}/approve`, {}, adminLogin.token);
        console.log('✓ Deal approved successfully:', {
          id: approvedDeal.id,
          isApproved: approvedDeal.isApproved,
          approvedBy: approvedDeal.approvedBy
        });
      } catch (error) {
        console.error('✗ Deal approval failed:', error.message);
        
        // Try to get the deal details to see what happened
        try {
          const dealDetails = await apiRequest('GET', `/api/deals/${createdDeal.id}`, null, adminLogin.token);
          console.log('Deal after failed approval:', {
            id: dealDetails.id,
            isApproved: dealDetails.isApproved,
            isActive: dealDetails.isActive,
            vendorId: dealDetails.vendorId
          });
        } catch (getError) {
          console.error('Could not get deal details:', getError.message);
        }
      }
    } else {
      // Try to approve an existing pending deal
      const testDeal = pendingDeals[0];
      console.log('Attempting to approve pending deal:', { id: testDeal.id, title: testDeal.title });
      
      try {
        const approvedDeal = await apiRequest('POST', `/api/admin/deals/${testDeal.id}/approve`, {}, adminLogin.token);
        console.log('✓ Deal approved successfully:', {
          id: approvedDeal.id,
          isApproved: approvedDeal.isApproved,
          approvedBy: approvedDeal.approvedBy
        });
      } catch (error) {
        console.error('✗ Deal approval failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
};

debugApproval();