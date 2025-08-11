# Deal Creation and Data Flow Analysis

## Overview
This document provides a comprehensive analysis of how deal creation works in the Instoredealz platform, including multi-store location selection, data population in the database, customer data fetching, and admin management capabilities.

## 1. Deal Creation Form Components

### Main Deal Creation Form
Located in: `client/src/components/MultiStoreLocationManager.tsx`

The deal creation form includes the following key fields:
- **Deal Title** - The name of the deal
- **Description** - Detailed description of the offer
- **Discount %** - Percentage discount offered
- **Category** - Business category selection
- **Verification Code** - 6-character alphanumeric code for verification
- **Valid Until** - Expiration date
- **Max Redemptions** - Optional limit on total redemptions
- **Required Membership** - Basic/Premium/Ultimate membership requirement
- **Address** - Business address for the deal

### Deal Availability Options
The form provides two availability options:

1. **All Stores** - Available at all business locations
2. **Selected Locations Only** - Available at specific store locations

### Multi-Store Location Manager
When "Selected Locations Only" is chosen, the `MultiStoreLocationManager` component allows vendors to:

#### Store Location Fields:
- **Store Name** (required) - e.g., "Central Mall Branch"
- **Full Address** (required) - Complete store address
- **State** (required) - Selected from Indian states dropdown
- **City** (required) - Dynamically populated based on state selection
- **Pincode** - 6-digit postal code (auto-filled when sublocation is selected)
- **Store Phone** - Contact number for the specific location

#### Smart Location Features:
- **State → City Cascade**: City dropdown updates when state changes
- **Sublocation Support**: For metro cities like Mumbai, Delhi (shows areas like Dadar, Sion)
- **Auto-Pincode**: Automatically fills pincode when sublocation is selected
- **Dynamic Add/Remove**: Vendors can add multiple locations or remove unwanted ones

## 2. Database Schema and Storage

### Deal Table Schema
```sql
-- Main deals table
CREATE TABLE deals (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  discount_percentage INTEGER NOT NULL,
  verification_pin TEXT NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  max_redemptions INTEGER,
  required_membership TEXT DEFAULT 'basic',
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  current_redemptions INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id),
  deal_availability TEXT DEFAULT 'all-stores', -- 'all-stores' or 'selected-locations'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Deal Locations Table Schema
```sql
-- Store locations for deals
CREATE TABLE deal_locations (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id) NOT NULL,
  store_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  sublocation TEXT, -- For metro cities (Dadar, Sion, etc.)
  pincode TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 3. Data Flow When Creating Deals

### Step 1: Form Submission
1. Vendor fills out deal creation form
2. Selects deal availability (all stores vs selected locations)
3. If selected locations, adds multiple store details
4. Form validates all required fields
5. Data is sent to `/api/vendors/deals` endpoint

### Step 2: Server Processing
**Endpoint:** `POST /api/vendors/deals`

```javascript
// Server processes the request (server/routes.ts line 1484)
app.post('/api/vendors/deals', requireAuth, requireRole(['vendor']), async (req, res) => {
  // 1. Verify vendor is approved
  const vendor = await storage.getVendorByUserId(req.user.id);
  if (!vendor.isApproved) {
    return res.status(403).json({ message: "Vendor not approved yet" });
  }
  
  // 2. Generate secure PIN
  const finalPin = req.body.verificationPin || generateSecurePin();
  
  // 3. Create main deal record
  const dealData = insertDealSchema.parse({
    ...req.body,
    vendorId: vendor.id,
    verificationPin: finalPin,
    dealAvailability: req.body.dealAvailability || 'all-stores'
  });
  
  const deal = await storage.createDeal(dealData);
  
  // 4. Create location records if selected-locations
  if (req.body.locations && Array.isArray(req.body.locations)) {
    for (const location of req.body.locations) {
      const locationData = {
        dealId: deal.id,
        storeName: location.storeName,
        address: location.address,
        city: location.city,
        state: location.state,
        sublocation: location.sublocation || null,
        pincode: location.pincode || null,
        phone: location.phone || null
      };
      await storage.createDealLocation(locationData);
    }
  }
  
  // 5. Log deal creation
  await storage.createSystemLog({
    userId: req.user.id,
    action: "DEAL_CREATED",
    details: { dealId: deal.id, title: deal.title }
  });
});
```

### Step 3: Database Population
1. **Main Deal Record** - Inserted into `deals` table with vendor_id, deal details, and availability type
2. **Location Records** - If "selected-locations", multiple records inserted into `deal_locations` table
3. **System Log** - Activity logged for audit trail
4. **Vendor Statistics** - Vendor's totalDeals counter updated

## 4. Data Fetching When Customers View Deals

### Public Deal Listing
**Endpoint:** `GET /api/deals`

```javascript
// Customer views deals (server/routes.ts line 691)
app.get('/api/deals', async (req, res) => {
  // 1. Get base deals (only approved and active)
  const deals = await storage.getDealsBy({
    isApproved: true,
    isActive: true
  });
  
  // 2. Apply filters (city, category)
  let filteredDeals = deals;
  if (req.query.city) {
    filteredDeals = deals.filter(deal => 
      deal.city === req.query.city ||
      // Check if any deal location matches the city
      dealLocations.some(loc => 
        loc.dealId === deal.id && loc.city === req.query.city
      )
    );
  }
  
  // 3. Enrich with vendor and location data
  const vendors = await storage.getAllVendors();
  const vendorMap = new Map(vendors.map(v => [v.id, v]));
  
  const dealsWithData = await Promise.all(deals.map(async deal => {
    const locations = await storage.getDealLocations(deal.id);
    return {
      ...deal,
      vendor: vendorMap.get(deal.vendorId),
      locations: locations,
      locationCount: locations.length,
      hasMultipleLocations: locations.length > 1,
      // Remove sensitive data
      verificationPin: undefined
    };
  }));
  
  res.json(dealsWithData);
});
```

### Individual Deal View
**Endpoint:** `GET /api/deals/:id`

```javascript
// Customer views specific deal (server/routes.ts line 724)
app.get('/api/deals/:id', async (req, res) => {
  const deal = await storage.getDeal(parseInt(req.params.id));
  const vendor = await storage.getVendor(deal.vendorId);
  const locations = await storage.getDealLocations(deal.id);
  
  // Remove sensitive data and return enriched deal
  const { verificationPin, ...dealData } = deal;
  res.json({
    ...dealData,
    vendor,
    locations,
    locationCount: locations.length,
    hasMultipleLocations: locations.length > 1
  });
});
```

### Data Structure Returned to Customers
```javascript
{
  id: 1,
  title: "50% Off Electronics",
  description: "Great discount on all electronics",
  category: "electronics",
  discountPercentage: 50,
  validUntil: "2025-12-31T23:59:59Z",
  address: "Main Store Address",
  city: "Mumbai",
  state: "Maharashtra",
  dealAvailability: "selected-locations",
  currentRedemptions: 5,
  viewCount: 120,
  vendor: {
    id: 1,
    businessName: "TechWorld Electronics",
    city: "Mumbai",
    state: "Maharashtra",
    rating: "4.5"
  },
  locations: [
    {
      id: 1,
      storeName: "Central Mall Branch",
      address: "Shop 15, Ground Floor, Central Mall",
      city: "Mumbai",
      state: "Maharashtra",
      sublocation: "Dadar",
      pincode: "400014",
      phone: "+91 9876543210"
    },
    {
      id: 2,
      storeName: "Phoenix Mall Branch",
      address: "Unit 42, Second Floor, Phoenix Mall",
      city: "Mumbai", 
      state: "Maharashtra",
      sublocation: "Kurla",
      pincode: "400070",
      phone: "+91 9876543211"
    }
  ],
  locationCount: 2,
  hasMultipleLocations: true
}
```

## 5. Admin Deal Management

### Admin Deal Viewing
**Endpoints:**
- `GET /api/admin/deals` - View all deals
- `GET /api/admin/deals/pending` - View pending approval deals

Admin sees additional data:
```javascript
{
  // All regular deal data plus:
  verificationPin: "ABC123", // Admins can see PINs
  isApproved: false,
  approvedBy: null,
  createdAt: "2025-08-11T07:00:00Z",
  vendorDetails: {
    // Complete vendor information
    businessName: "TechWorld Electronics",
    panNumber: "ABCDE1234F",
    gstNumber: "27ABCDE1234F1Z5",
    isApproved: true
  }
}
```

### Admin Deal Approval
**Endpoint:** `POST /api/admin/deals/:id/approve`

```javascript
app.post('/api/admin/deals/:id/approve', requireAuth, requireRole(['admin']), async (req, res) => {
  const dealId = parseInt(req.params.id);
  
  // 1. Update deal approval status
  const deal = await storage.updateDeal(dealId, {
    isApproved: true,
    approvedBy: req.user.id,
    approvedAt: new Date()
  });
  
  // 2. Send notification email to vendor
  const vendor = await storage.getVendor(deal.vendorId);
  const vendorUser = await storage.getUserById(vendor.userId);
  await sendDealApprovalEmail(vendorUser.email, deal.title);
  
  // 3. Log admin action
  await storage.createSystemLog({
    userId: req.user.id,
    action: "DEAL_APPROVED",
    details: {
      dealId,
      dealTitle: deal.title,
      vendorId: vendor.id,
      adminName: req.user.name
    }
  });
  
  res.json({ message: "Deal approved successfully" });
});
```

### Admin Deal Rejection
**Endpoint:** `POST /api/admin/deals/:id/reject`

```javascript
app.post('/api/admin/deals/:id/reject', requireAuth, requireRole(['admin']), async (req, res) => {
  const { reason } = req.body; // Admin must provide rejection reason
  
  // 1. Update deal status
  const deal = await storage.updateDeal(dealId, {
    isApproved: false,
    rejectedBy: req.user.id,
    rejectedAt: new Date(),
    rejectionReason: reason
  });
  
  // 2. Send notification with reason
  await sendDealRejectionEmail(vendorUser.email, deal.title, reason);
  
  // 3. Log rejection
  await storage.createSystemLog({
    userId: req.user.id,
    action: "DEAL_REJECTED",
    details: { dealId, reason, adminName: req.user.name }
  });
});
```

### Admin Deal Editing
**Endpoint:** `PUT /api/admin/deals/:id`

Admins can edit any deal property:
- Title, description, discount percentage
- Category, membership requirements
- Validity period, redemption limits
- Location details (if accessing deal_locations table)

When admin edits a deal, it may reset approval status requiring re-approval.

## 6. Vendor Data Table Integration

### Vendor Registration → Data Table Flow

1. **Vendor Registration**: Uses `VendorRegister` component → Posts to `/api/vendors/register`
2. **Data Storage**: Creates vendor record with status "pending" 
3. **Redirect**: After registration → Navigate to `/vendor/profile-data`
4. **Data Display**: `VendorProfileData` component shows comprehensive vendor information using `VendorDataTable`

### Vendor Data Table Features

The `VendorDataTable` component provides:

#### Data Fetching
- Fetches vendor data via `/api/vendors/me` endpoint
- Includes business details, location, tax information
- Shows performance metrics (total deals, redemptions, rating)

#### Table Display
- **Business Details**: Name, ID, GST number
- **Location**: City, state, pincode, full address
- **Status & Performance**: Approval status, rating, deal counts
- **Registration**: Date registered, user ID
- **Actions**: View detailed information dialog

#### Detailed View Dialog
When "View Details" is clicked, shows:
- Complete business information
- Contact details with website links
- Location details including full address
- Legal & tax information (PAN, GST)
- Performance metrics with visual charts

## 7. Data Consistency and Validation

### Frontend Validation
- Form validation using Zod schemas
- Real-time field validation
- Location cascade validation (state → city → sublocation)
- Phone number format validation
- PIN code format validation

### Backend Validation
- Schema validation using `insertDealSchema`
- Vendor approval status checks
- Data sanitization and transformation
- PIN security (hashing for storage)

### Database Constraints
- Foreign key relationships maintained
- Required field enforcement
- Data type constraints
- Index optimization for queries

## 8. Summary

The Instoredealz platform provides a comprehensive deal creation and management system:

1. **Vendors** can create deals with single or multiple store locations
2. **Data** is properly structured and stored across deals and deal_locations tables
3. **Customers** receive enriched deal data including all location information
4. **Admins** have full control over deal approval, editing, and rejection
5. **Vendor Data** is properly fetched and displayed in organized tables after registration

The system ensures data integrity, security (PIN protection), and provides a seamless experience from deal creation to customer redemption.