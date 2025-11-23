# Admin Dashboard - Complete Tutorial Guide

Welcome to the Admin Dashboard! This comprehensive guide will walk you through all the administrative features and functionalities available to manage your deal platform effectively.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Admin Dashboard Overview](#admin-dashboard-overview)
3. [User Management](#user-management)
4. [Vendor Management](#vendor-management)
5. [Deal Management](#deal-management)
6. [Claimed Deals Management](#claimed-deals-management)
7. [Analytics & Reports](#analytics--reports)
8. [Location Analytics](#location-analytics)
9. [Deal Distribution](#deal-distribution)
10. [Commission Reports](#commission-reports)
11. [API Key Management](#api-key-management)
12. [Promotional Banners](#promotional-banners)
13. [System Logs (Super Admin)](#system-logs-super-admin)

---

## Getting Started

### Accessing the Admin Dashboard

1. **Login**: Log in with your admin credentials
2. **Navigation**: Once logged in, you'll be automatically redirected to `/admin/dashboard`
3. **Role Requirements**: You must have either 'admin' or 'superadmin' role to access admin features

### Admin Navigation Menu

The admin dashboard provides a sidebar or navigation menu with quick access to:
- Dashboard (Overview)
- User Management
- Vendor Management
- Deal Management
- Claimed Deals
- Analytics & Reports
- Commission Reports
- API Keys
- Promotional Banners
- And more...

---

## Admin Dashboard Overview

**Route**: `/admin/dashboard`

### What You'll See

The main dashboard provides a comprehensive overview of your platform's performance:

#### Key Metrics Cards
- **Total Users**: Total registered users on the platform
- **Active Vendors**: Number of approved and active vendors
- **Active Deals**: Currently active deals
- **Pending Approvals**: Vendors and deals awaiting approval
- **Total Claims**: Number of deals claimed by customers
- **Total Savings**: Aggregate savings delivered to customers

#### Quick Stats
- Recent user registrations
- Vendor approval queue
- Deal approval queue
- Recent claims and redemptions
- Platform activity trends

#### Visual Charts
- User growth over time
- Deal claims by category
- Vendor distribution by location
- Savings delivered monthly

### Quick Actions

From the dashboard, you can:
- View pending vendor approvals
- Review pending deal approvals
- Check recent system activity
- Access detailed reports with one click

---

## User Management

**Route**: `/admin/users`

### Overview

Manage all customer accounts, membership plans, and user activity from one centralized location.

### Key Features

#### 1. User List View
- **Search**: Search users by name, email, or phone number
- **Filter**: Filter by membership plan (Basic, Premium, Ultimate)
- **Sort**: Sort by registration date, savings amount, or deals claimed

#### 2. User Details
For each user, you can view:
- **Personal Information**: Name, email, phone, city, gender
- **Membership Details**: Current plan and expiry date
- **Activity Stats**: Total savings, deals claimed, last active date
- **Account Status**: Active/Inactive status

#### 3. User Actions

**Upgrade Membership**
1. Click on a user row
2. Click "Upgrade Membership" button
3. Select new plan (Premium or Ultimate)
4. Confirm upgrade
5. User immediately gets access to plan benefits

**Deactivate/Activate User**
1. Open user details
2. Click "Deactivate Account" or "Activate Account"
3. Confirm action
4. User's access will be updated immediately

**View User Activity**
- See all deals claimed by the user
- Check claim redemption history
- View savings breakdown
- Monitor membership usage

#### 4. Bulk Operations
- Export user data to CSV
- Send promotional emails to selected users
- Bulk upgrade memberships (for promotions)

### Best Practices

- **Regular Monitoring**: Check for inactive accounts monthly
- **Membership Renewals**: Proactively reach out to users with expiring memberships
- **Support Issues**: Cross-reference with help tickets when resolving user issues
- **Data Privacy**: Only access user data when necessary for support or platform management

---

## Vendor Management

**Route**: `/admin/vendors`

### Overview

Approve, manage, and monitor all vendor accounts and their business operations.

### Key Features

#### 1. Vendor Approval Workflow

**Pending Vendors**
1. Navigate to vendors page
2. Filter by status: "Pending"
3. Review vendor application:
   - Business name and details
   - Contact information
   - GST number (if applicable)
   - PAN card verification
   - Business address and location

**Approval Process**
1. Click on pending vendor
2. Review all submitted documents
3. Verify business credentials
4. Choose action:
   - **Approve**: Vendor can start creating deals
   - **Reject**: Provide rejection reason
   - **Request More Info**: Ask for additional documents

**Approval Checklist**
- ✓ Valid business registration
- ✓ Correct contact information
- ✓ PAN card uploaded and verified
- ✓ GST number valid (if applicable)
- ✓ Business address verified
- ✓ Complete business profile

#### 2. Vendor Management

**View Vendor Details**
- Business information
- Contact person details
- Location and operating areas
- Total deals created
- Total redemptions
- Vendor rating
- Commission details

**Edit Vendor Information**
1. Click on vendor
2. Click "Edit" button
3. Update business details
4. Save changes

**Suspend/Reactivate Vendor**
1. Open vendor profile
2. Click "Suspend Account" or "Reactivate"
3. Provide reason for suspension
4. Confirm action

#### 3. Vendor Performance Tracking

Monitor vendor performance:
- **Deal Creation Rate**: How many deals they create
- **Redemption Rate**: How many deals get claimed
- **Customer Rating**: Average rating from customer reviews
- **Response Time**: How quickly they verify claims
- **Commission Earned**: Total commissions from their deals

#### 4. Vendor Communication

- Send notifications to vendors
- Bulk email for policy updates
- Individual messaging for compliance issues
- Automated reminders for pending verifications

### Best Practices

- **Thorough Verification**: Always verify business documents before approval
- **Regular Reviews**: Quarterly review of active vendors
- **Quality Control**: Monitor vendor ratings and customer feedback
- **Communication**: Keep vendors informed of policy changes
- **Support**: Provide onboarding assistance to new vendors

---

## Deal Management

**Route**: `/admin/deals`

### Overview

Approve, edit, and manage all deals posted by vendors on the platform.

### Key Features

#### 1. Deal Approval Queue

**Filter Deals**
- **Status**: Pending, Approved, Rejected, All
- **Category**: Electronics, Fashion, Food, Travel, etc.
- **Date Range**: Filter by creation date
- **Vendor**: Filter by specific vendor

**Deal Review Process**
1. Click on pending deal
2. Review deal details:
   - Title and description
   - Discount percentage
   - Original and discounted price
   - Validity period
   - Category and subcategory
   - Deal image
   - Terms and conditions
   - Target locations

**Approval Criteria Checklist**
- ✓ Clear and accurate title
- ✓ Detailed description
- ✓ Realistic discount percentage
- ✓ Proper pricing information
- ✓ Valid deal duration
- ✓ Appropriate category
- ✓ High-quality image
- ✓ Complete terms and conditions
- ✓ No misleading information

**Approval Actions**
1. **Approve**: Deal goes live immediately
2. **Reject**: Provide detailed rejection reason
3. **Request Changes**: Ask vendor to modify and resubmit

#### 2. Active Deal Management

**Edit Deal Details**
1. Find the deal
2. Click "Edit" button
3. Modify necessary fields
4. Save changes
5. Changes reflect immediately

**Deactivate Deal**
1. Select deal
2. Click "Deactivate"
3. Confirm action
4. Deal is hidden from customers

**Monitor Deal Performance**
- View count (how many customers viewed)
- Claim count (how many claimed)
- Redemption rate
- Customer ratings and reviews
- Remaining redemptions available

#### 3. Deal Categories

Manage deal categories:
- Add new categories
- Edit category names
- Set category icons
- Organize subcategories

### Best Practices

- **Quick Turnaround**: Approve/reject within 24 hours
- **Quality Standards**: Maintain high-quality deal listings
- **Vendor Feedback**: Provide specific reasons for rejections
- **Regular Cleanup**: Remove expired deals regularly
- **Trending Monitoring**: Promote popular categories

---

## Claimed Deals Management

**Route**: `/admin/claimed-deals`

### Overview

Monitor and manage all deal claims and customer redemptions across the platform.

### Key Features

#### 1. Claims Dashboard

**View All Claims**
- See all claimed deals in real-time
- Track claim status (Pending, Verified, Completed, Expired)
- Monitor redemption progress

**Filter and Search**
- By customer name or email
- By vendor name
- By deal category
- By claim status
- By date range

#### 2. Claim Details

For each claim, view:
- **Customer Information**: Who claimed the deal
- **Deal Details**: What deal was claimed
- **Vendor Information**: Which vendor's deal
- **Claim Code**: Unique verification code
- **Bill Amount**: Customer's purchase amount
- **Savings Amount**: Discount received
- **Status**: Current claim status
- **Timestamps**: When claimed, when verified

#### 3. Claim Management Actions

**Verify Manual Claims**
1. If vendor hasn't verified, admin can verify
2. Check claim code validity
3. Confirm with vendor if needed
4. Mark as verified

**Handle Disputes**
1. Review claim details
2. Check customer and vendor communication
3. Verify actual transaction
4. Resolve in favor of appropriate party

**Cancel/Refund Claims**
1. Select claim
2. Choose cancellation reason
3. Process refund if applicable
4. Notify both parties

### Best Practices

- **Dispute Resolution**: Be fair and investigate thoroughly
- **Quick Response**: Handle disputes within 48 hours
- **Documentation**: Keep records of all resolutions
- **Pattern Detection**: Watch for fraudulent activity
- **Vendor Support**: Help vendors understand the claim process

---

## Analytics & Reports

**Route**: `/admin/analytics`

### Overview

Comprehensive analytics dashboard with insights into platform performance, user behavior, and business metrics.

### Key Features

#### 1. Time Range Selection

Choose analysis period:
- Last 7 days
- Last 30 days
- Last 90 days
- Custom date range

#### 2. Overview Metrics

**Platform-Wide Stats**
- Total users and growth rate
- Active vendors count
- Live deals count
- Total claims processed
- Total savings delivered
- Revenue generated

**Growth Trends**
- User registration trends
- Deal creation trends
- Claim volume trends
- Revenue growth charts

#### 3. Category Analytics

**Performance by Category**
- Most popular categories
- Claims per category
- Average discount by category
- Revenue by category
- Category growth rates

**Visual Charts**
- Bar charts for category comparison
- Pie charts for distribution
- Line charts for trends over time

#### 4. User Analytics

**Membership Distribution**
- Basic vs Premium vs Ultimate users
- Conversion rates between plans
- Membership renewal rates
- Plan upgrade trends

**User Behavior**
- Average claims per user
- Most active users
- User retention rates
- Engagement metrics

#### 5. Vendor Analytics

**Vendor Performance**
- Top performing vendors
- Vendor deal creation rates
- Vendor redemption rates
- Average vendor rating
- Commission distribution

#### 6. Export Options

Export reports as:
- PDF for presentations
- CSV for data analysis
- Excel for detailed reporting

### Best Practices

- **Regular Review**: Check analytics weekly
- **Identify Trends**: Look for patterns in user behavior
- **Data-Driven Decisions**: Use insights for platform improvements
- **Benchmark Performance**: Compare month-over-month growth
- **Share Insights**: Report key metrics to stakeholders

---

## Location Analytics

**Route**: `/admin/location-analytics`

### Overview

Analyze platform performance across different geographical locations to optimize regional strategies.

### Key Features

#### 1. City-wise Breakdown

**Metrics by City**
- Number of users per city
- Active vendors per city
- Total deals available per city
- Claims processed per city
- Total savings delivered per city

**Top Performing Cities**
- Ranked by user activity
- Ranked by deal volume
- Ranked by redemptions

#### 2. State-level Analytics

View aggregated data by state:
- Total users
- Total vendors
- Average deal value
- Popular categories per state

#### 3. Heat Maps

Visual representation of:
- User density by location
- Deal availability by region
- Activity hotspots
- Growth areas

#### 4. Expansion Opportunities

Identify:
- Underserved areas
- High potential locations
- Vendor gaps by region
- Growth opportunities

### Best Practices

- **Regional Focus**: Target marketing to high-growth areas
- **Vendor Recruitment**: Focus on areas with vendor gaps
- **Local Partnerships**: Develop region-specific strategies
- **Competitive Analysis**: Understand regional competition

---

## Deal Distribution

**Route**: `/admin/deal-distribution`

### Overview

Manage deal distribution across categories and maintain platform balance.

### Key Features

#### 1. Category Distribution View

**See Deal Count by Category**
- Electronics: X deals
- Fashion: Y deals
- Food & Dining: Z deals
- Travel: W deals
- And more...

**Visual Representation**
- Pie chart showing percentage distribution
- Bar chart showing absolute numbers

#### 2. Balance Management

**Identify Imbalances**
- Categories with too many deals
- Categories lacking deals
- Trending vs stagnant categories

**Category Management Actions**
- Promote underrepresented categories
- Encourage vendors to create needed deals
- Feature diverse category deals on homepage

#### 3. Bulk Operations

**Delete Deals by Category** (Use with caution!)
1. Select category
2. Review all deals in category
3. Confirm deletion
4. All deals in category are removed

**Warning**: This is a destructive action. Always backup data first!

### Best Practices

- **Maintain Balance**: Aim for diverse category representation
- **Seasonal Adjustments**: Promote seasonal categories
- **Quality over Quantity**: Better to have fewer high-quality deals
- **Regular Cleanup**: Remove outdated or irrelevant deals

---

## Commission Reports

**Route**: `/admin/commission-reports`

### Overview

Track, manage, and process vendor commissions and platform payouts.

### Key Features

#### 1. Commission Overview

**Summary Dashboard**
- Total pending commissions
- Total paid commissions
- Commission by vendor
- Commission by period

**Filter Options**
- By vendor
- By date range
- By payout status (Pending, Paid, Cancelled)

#### 2. Detailed Commission Reports

**Transaction-Level Detail**
For each transaction, see:
- Deal information
- Customer details
- Transaction amount
- Commission percentage
- Commission amount
- Transaction date
- Payout status

**Vendor Commission Summary**
- Total commissions earned
- Pending payout amount
- Payment history
- Average commission per deal

#### 3. Payout Management

**Create Payout**
1. Select payout period (start and end date)
2. Choose vendor (or all vendors)
3. Review commission summary
4. Add payout notes
5. Create payout record

**Process Payout**
1. Select pending payout
2. Enter payment method (Bank Transfer, UPI, Cheque, etc.)
3. Add transaction reference number
4. Mark as paid
5. System sends confirmation to vendor

**Cancel Payout**
1. Select payout
2. Provide cancellation reason
3. Confirm cancellation
4. Commission returns to pending status

#### 4. Export Commission Reports

Download detailed reports:
- CSV format for accounting
- PDF for vendor statements
- Excel for detailed analysis

### Best Practices

- **Regular Payouts**: Process payouts monthly or bi-weekly
- **Clear Communication**: Notify vendors before and after payouts
- **Accurate Records**: Maintain detailed transaction records
- **Timely Processing**: Don't delay legitimate payouts
- **Audit Trail**: Keep all payout documentation
- **Dispute Resolution**: Have a clear process for commission disputes

---

## API Key Management

**Route**: `/admin/api-keys`

### Overview

Generate and manage API keys for vendors who want to integrate their POS systems with the platform for automated claim verification.

### Key Features

#### 1. API Keys Dashboard

**View All API Keys**
- List of all generated API keys
- Vendor association
- Key status (Active, Inactive, Expired)
- Creation date
- Last used date
- Rate limit information

**Filter and Search**
- Search by vendor name
- Filter by status (Active, Inactive, Expired)
- Sort by creation date or last used

#### 2. Generate New API Key

**Step-by-Step Process**
1. Click "Generate New Key" button
2. Select vendor from dropdown
3. Click "Generate Key"
4. API key and secret are created
5. Display modal with key details

**Important Information Shown**
- ✓ **Vendor Name**: Which vendor this key belongs to
- ✓ **API Key**: The actual key (copy to clipboard)
- ✓ **Created Date**: When the key was generated
- ✓ **Expires Date**: When the key expires (if applicable)
- ✓ **Rate Limit**: Requests per minute allowed
- ✓ **Usage Instructions**: Sample curl command

**Security Alert**
⚠️ The API key and secret are shown ONLY ONCE. The vendor must copy and save them securely immediately. They cannot be retrieved later.

#### 3. API Key Management

**View Key Details**
- Click on any key to see full details
- View usage statistics
- Check recent API calls
- Monitor rate limit usage

**Deactivate API Key**
1. Select API key
2. Click "Deactivate"
3. Confirm action
4. Key is immediately disabled

**Delete API Key**
1. Select API key
2. Click "Delete"
3. Confirm permanent deletion
4. Key is removed from system

**Reactivate API Key**
- Select inactive key
- Click "Reactivate"
- Key becomes active again

#### 4. API Key Statistics

Monitor:
- Total active keys
- Keys expiring soon
- Number of vendors with keys
- API usage patterns

#### 5. Usage Instructions for Vendors

Share these instructions with vendors:

```bash
# Example API call to verify claim
curl -X POST https://your-domain.com/api/v1/claims/verify \
  -H "X-API-Key: <VENDOR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"claimCode": "ABC123"}'
```

### Best Practices

- **One Key Per Vendor**: Each vendor should have their own unique key
- **Regular Rotation**: Encourage vendors to rotate keys periodically
- **Monitor Usage**: Watch for suspicious API activity
- **Rate Limiting**: Protect the platform from abuse
- **Documentation**: Provide clear API documentation to vendors
- **Support**: Help vendors integrate their POS systems
- **Security**: Never share API keys via insecure channels
- **Expiration**: Set reasonable expiration dates for keys

---

## Promotional Banners

**Route**: `/admin/promotional-banners`

### Overview

Create and manage promotional banners displayed on the homepage and other key locations to promote deals, events, or platform features.

### Key Features

#### 1. Banner Management

**View All Banners**
- Active banners
- Scheduled banners
- Expired banners
- Draft banners

**Banner List Shows**
- Banner title
- Image thumbnail
- Display position
- Status (Active, Scheduled, Expired, Inactive)
- Click-through rate
- Impressions count

#### 2. Create New Banner

**Banner Creation Form**
1. **Title**: Descriptive banner title
2. **Image**: Upload banner image (recommended: 1920x400px)
3. **Link**: URL where banner should redirect
4. **Display Location**:
   - Homepage (hero section)
   - Category pages
   - Deal detail pages
   - User dashboard
5. **Schedule**:
   - Start date and time
   - End date and time
6. **Priority**: Display order (higher priority shows first)
7. **Target Audience**:
   - All users
   - Specific membership tiers
   - Specific locations
8. **Status**: Active or Inactive

#### 3. Edit Banner

1. Select banner from list
2. Click "Edit" button
3. Modify banner details
4. Upload new image (optional)
5. Update schedule or targeting
6. Save changes

#### 4. Banner Performance

**Analytics for Each Banner**
- Total impressions (views)
- Click-through rate (CTR)
- Clicks count
- Conversion rate (if applicable)
- Engagement by time period

#### 5. A/B Testing

- Create multiple banner versions
- Test different images or messaging
- Compare performance
- Keep best performing banner

### Best Practices

- **Eye-Catching Design**: Use high-quality, professional images
- **Clear Call-to-Action**: Make it obvious what users should do
- **Mobile Optimization**: Ensure banners look good on all devices
- **Regular Updates**: Rotate banners to keep content fresh
- **Seasonal Content**: Align with holidays and events
- **Performance Tracking**: Monitor and optimize based on data
- **Load Time**: Optimize images for fast page loading
- **Relevance**: Show appropriate banners to target audiences

---

## System Logs (Super Admin)

**Route**: `/superadmin/logs`

**Access**: Super Admin only

### Overview

Monitor all system activities, user actions, and platform events for security, debugging, and compliance purposes.

### Key Features

#### 1. Activity Logs

**Track All Actions**
- User registrations and logins
- Deal creations and approvals
- Claim submissions and verifications
- Admin actions (approvals, edits, deletions)
- API calls and integrations
- Payment transactions
- System errors and exceptions

#### 2. Log Filtering

**Filter by**
- Action type
- User/Admin who performed action
- Date and time range
- IP address
- Success/Failure status
- Severity level

#### 3. Security Monitoring

**Security Events**
- Failed login attempts
- Unauthorized access attempts
- Suspicious API activity
- Account takeover attempts
- Multiple claims from same IP
- Pattern anomalies

#### 4. Audit Trail

Maintain complete audit trail for:
- Compliance requirements
- Dispute resolution
- Performance monitoring
- Debugging issues
- Security investigations

#### 5. Export Logs

Download logs for:
- External analysis
- Long-term archival
- Compliance reporting
- Security audits

### Best Practices

- **Regular Monitoring**: Check logs daily for anomalies
- **Security Alerts**: Set up alerts for suspicious activities
- **Data Retention**: Archive logs according to compliance requirements
- **Access Control**: Limit log access to authorized personnel only
- **Investigation**: Use logs to troubleshoot issues and disputes
- **Pattern Analysis**: Look for trends that indicate problems

---

## General Admin Best Practices

### 1. Security
- Never share admin credentials
- Use strong, unique passwords
- Enable two-factor authentication
- Log out when not in use
- Monitor for suspicious activity

### 2. Data Management
- Regular backups
- Verify data accuracy
- Clean up obsolete records
- Maintain data privacy
- Follow GDPR/data protection laws

### 3. Customer Service
- Respond to issues promptly
- Be fair in dispute resolution
- Maintain professional communication
- Document all interactions
- Follow up on resolved issues

### 4. Platform Quality
- Maintain high standards for deals
- Remove spam or fraudulent content
- Verify vendor authenticity
- Monitor user feedback
- Continuously improve user experience

### 5. Performance Monitoring
- Check analytics regularly
- Track key performance indicators
- Identify and address bottlenecks
- Optimize slow processes
- Plan for scalability

### 6. Vendor Relations
- Provide clear guidelines
- Offer training and support
- Communicate policy changes
- Recognize top performers
- Address issues promptly

### 7. Compliance
- Follow platform policies
- Adhere to legal requirements
- Maintain proper documentation
- Conduct regular audits
- Stay updated on regulations

---

## Keyboard Shortcuts (Coming Soon)

Quick actions to improve efficiency:
- `Ctrl + D` - Go to Dashboard
- `Ctrl + U` - User Management
- `Ctrl + V` - Vendor Management
- `Ctrl + A` - Analytics
- `Ctrl + K` - Search anything

---

## Support & Help

### Getting Help

If you need assistance:
1. **Documentation**: Refer to this tutorial
2. **Help Center**: Access in-app help guides
3. **Support Ticket**: Submit a ticket for technical issues
4. **Training**: Request additional admin training
5. **Community**: Join admin forums for best practices

### Reporting Issues

To report a bug or issue:
1. Go to Support section
2. Click "Report Issue"
3. Provide detailed description
4. Include screenshots if applicable
5. Submit ticket

---

## Conclusion

This admin dashboard gives you complete control over your deal platform. Use these tools responsibly to create the best experience for both customers and vendors.

**Remember**: With great power comes great responsibility. Always act in the best interest of the platform and its users.

For questions or additional training, contact the platform administrator.

---

**Last Updated**: November 2025
**Version**: 1.0
