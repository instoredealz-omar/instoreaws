import { SendMailClient } from 'zeptomail';

let zeptoClient: SendMailClient | null = null;
let fromEmail: string = 'noreply@instoredealz.com';

async function getZeptoClient() {
  if (zeptoClient) {
    return { client: zeptoClient, fromEmail };
  }

  try {
    const token = process.env.ZMPT_TOKEN;
    
    if (!token) {
      throw new Error('ZMPT_TOKEN not found in environment');
    }

    const url = "api.zeptomail.com/";
    zeptoClient = new SendMailClient({ url, token });
    fromEmail = 'customersupport@instoredealz.com';
    console.log('[EMAIL] ZeptoMail email service enabled');
    console.log(`[EMAIL] Using sender email: ${fromEmail}`);
    
    return { client: zeptoClient, fromEmail };
  } catch (error) {
    console.error('[EMAIL] Failed to initialize ZeptoMail:', error);
    console.warn('[EMAIL] Email notifications will be disabled.');
    return { client: null, fromEmail: 'noreply@instoredealz.com' };
  }
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const { client } = await getZeptoClient();
    
    if (!client) {
      console.log(`[EMAIL] Email sending disabled - would have sent: ${params.subject} to ${params.to}`);
      return true;
    }

    const emailPayload = {
      from: {
        address: params.from,
        name: "Instoredealz"
      },
      to: [
        {
          email_address: {
            address: params.to,
            name: params.to.split('@')[0]
          }
        }
      ],
      subject: params.subject,
      htmlbody: params.html || params.text || '',
      textbody: params.text || ''
    };
    
    await client.sendMail(emailPayload);
    
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('ZeptoMail email error:', error);
    return false;
  }
}

export async function getFromEmail(): Promise<string> {
  const { fromEmail: email } = await getZeptoClient();
  return email;
}

// Email templates
export function getWelcomeCustomerEmail(name: string, email: string) {
  return {
    to: email,
    from: 'noreply@instoredealz.com',
    subject: 'Welcome to Instoredealz - Start Saving Today!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Instoredealz</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Instoredealz!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your gateway to amazing deals and savings</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${name}! 👋</h2>
          
          <p>Thank you for joining Instoredealz! We're excited to help you discover amazing deals and save money on your favorite products and services.</p>
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Browse thousands of deals from local businesses</li>
              <li>Claim deals with just a few clicks</li>
              <li>Use PIN verification for offline redemption</li>
              <li>Track your savings in your personal dashboard</li>
              <li>Upgrade to Premium or Ultimate for exclusive deals</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://instoredealz.com/customer/dashboard" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Start Exploring Deals
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px; margin: 0;">
            Need help? Contact our support team at <a href="mailto:support@instoredealz.com" style="color: #667eea;">support@instoredealz.com</a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
            Happy saving!<br>
            The Instoredealz Team
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to Instoredealz!
      
      Hi ${name}!
      
      Thank you for joining Instoredealz! We're excited to help you discover amazing deals and save money on your favorite products and services.
      
      What's Next?
      - Browse thousands of deals from local businesses
      - Claim deals with just a few clicks
      - Use PIN verification for offline redemption
      - Track your savings in your personal dashboard
      - Upgrade to Premium or Ultimate for exclusive deals
      
      Visit your dashboard: https://instoredealz.com/customer/dashboard
      
      Need help? Contact our support team at support@instoredealz.com
      
      Happy saving!
      The Instoredealz Team
    `
  };
}

export function getReportEmail(reportType: string, adminName: string, adminEmail: string, reportData: any) {
  const reportTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1) + ' Report';
  const generatedDate = new Date().toLocaleDateString();
  
  return {
    to: adminEmail,
    from: 'noreply@instoredealz.com',
    subject: `${reportTitle} - ${generatedDate}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTitle}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${reportTitle}</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Generated on ${generatedDate}</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${adminName}! 📊</h2>
          
          <p>Your requested ${reportType} report has been generated and is ready for review.</p>
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">Report Summary</h3>
            <p><strong>Report Type:</strong> ${reportTitle}</p>
            <p><strong>Generated:</strong> ${generatedDate}</p>
            <p><strong>Total Records:</strong> ${reportData.length || 0}</p>
            <p><strong>Requested By:</strong> ${adminName} (${adminEmail})</p>
          </div>
          
          <div style="background: #fff5f5; border-left: 4px solid #f5576c; padding: 20px; margin: 20px 0;">
            <h3 style="color: #f5576c; margin-top: 0;">📋 Report Details</h3>
            <p>This report contains the latest data from your Instoredealz platform. You can download the complete CSV file from your admin dashboard.</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>All data is current as of generation time</li>
              <li>Report includes comprehensive filtering options</li>
              <li>Data is formatted for easy analysis</li>
              <li>CSV format compatible with Excel and other tools</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://instoredealz.com/admin/reports" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Access Admin Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px; margin: 0;">
            Need help with your reports? Contact our support team at <a href="mailto:support@instoredealz.com" style="color: #667eea;">support@instoredealz.com</a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
            Best regards,<br>
            The Instoredealz Analytics Team
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      ${reportTitle} - ${generatedDate}
      
      Hi ${adminName}!
      
      Your requested ${reportType} report has been generated and is ready for review.
      
      Report Summary:
      - Report Type: ${reportTitle}
      - Generated: ${generatedDate}
      - Total Records: ${reportData.length || 0}
      - Requested By: ${adminName} (${adminEmail})
      
      This report contains the latest data from your Instoredealz platform. You can download the complete CSV file from your admin dashboard.
      
      Access your dashboard: https://instoredealz.com/admin/reports
      
      Need help with your reports? Contact our support team at support@instoredealz.com
      
      Best regards,
      The Instoredealz Analytics Team
    `
  };
}

export function getVendorRegistrationEmail(businessName: string, contactName: string, email: string) {
  return {
    to: email,
    from: 'noreply@instoredealz.com',
    subject: 'Business Registration Received - Welcome to Instoredealz',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Business Registration - Instoredealz</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Business Registration Received</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to the Instoredealz Vendor Network</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${contactName}! 🏪</h2>
          
          <p>Thank you for registering <strong>${businessName}</strong> with Instoredealz! We've received your business registration and our team is now reviewing your application.</p>
          
          <div style="background: #fff5f5; border-left: 4px solid #f5576c; padding: 20px; margin: 20px 0;">
            <h3 style="color: #f5576c; margin-top: 0;">⏳ What Happens Next?</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li><strong>Review Process:</strong> Our team will review your business details within 24-48 hours</li>
              <li><strong>Verification:</strong> We may contact you for additional verification if needed</li>
              <li><strong>Approval:</strong> Once approved, you'll receive an email confirmation</li>
              <li><strong>Start Selling:</strong> Create your first deals and start attracting customers</li>
            </ol>
          </div>
          
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
            <h3 style="color: #10b981; margin-top: 0;">🚀 Get Ready to Succeed</h3>
            <p style="margin: 0;">While you wait, start planning your first deals:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Attractive discount percentages</li>
              <li>Clear deal descriptions</li>
              <li>High-quality product images</li>
              <li>Competitive pricing strategies</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://instoredealz.com/vendor/dashboard" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Access Vendor Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px;">
            <strong>Business Details Registered:</strong><br>
            Business Name: ${businessName}<br>
            Contact Person: ${contactName}<br>
            Email: ${email}
          </p>
          
          <p style="color: #666; font-size: 14px; margin: 20px 0 0 0;">
            Questions? Contact our vendor support team at <a href="mailto:vendor-support@instoredealz.com" style="color: #f5576c;">vendor-support@instoredealz.com</a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
            Welcome to the family!<br>
            The Instoredealz Vendor Team
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Business Registration Received - Instoredealz
      
      Hi ${contactName}!
      
      Thank you for registering ${businessName} with Instoredealz! We've received your business registration and our team is now reviewing your application.
      
      What Happens Next?
      1. Review Process: Our team will review your business details within 24-48 hours
      2. Verification: We may contact you for additional verification if needed
      3. Approval: Once approved, you'll receive an email confirmation
      4. Start Selling: Create your first deals and start attracting customers
      
      Business Details Registered:
      Business Name: ${businessName}
      Contact Person: ${contactName}
      Email: ${email}
      
      Access your vendor dashboard: https://instoredealz.com/vendor/dashboard
      
      Questions? Contact our vendor support team at vendor-support@instoredealz.com
      
      Welcome to the family!
      The Instoredealz Vendor Team
    `
  };
}

export function getDealApprovalEmail(dealTitle: string, businessName: string, vendorName: string, email: string) {
  return {
    to: email,
    from: 'noreply@instoredealz.com',
    subject: 'Deal Approved - Your deal is now live!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deal Approved</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Deal Approved!</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your deal is now live and available to customers</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hello ${vendorName}!</h2>
          
          <p>Great news! Your deal "<strong>${dealTitle}</strong>" has been approved and is now live on Instoredealz.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #10b981; margin-top: 0;">✅ Deal Details</h3>
            <p><strong>Deal Title:</strong> ${dealTitle}</p>
            <p><strong>Business:</strong> ${businessName}</p>
            <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">LIVE</span></p>
            <p><strong>Visibility:</strong> Available to all customers</p>
          </div>
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">🚀 What's Next?</h3>
            <p>Your deal is now discoverable by customers. Here's what you can expect:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Customers can now view and claim your deal</li>
              <li>Track performance in your vendor dashboard</li>
              <li>Monitor PIN verifications and redemptions</li>
              <li>View analytics and customer feedback</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://instoredealz.com/vendor/dashboard" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View Deal Dashboard
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px; margin: 0;">
            Need help managing your deal? Contact our support team at <a href="mailto:support@instoredealz.com" style="color: #667eea;">support@instoredealz.com</a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
            Congratulations on your approved deal!<br>
            The Instoredealz Team
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Deal Approved!
      
      Hello ${vendorName}!
      
      Great news! Your deal "${dealTitle}" has been approved and is now live on Instoredealz.
      
      Deal Details:
      - Deal Title: ${dealTitle}
      - Business: ${businessName}
      - Status: LIVE
      - Visibility: Available to all customers
      
      What's Next?
      Your deal is now discoverable by customers. Here's what you can expect:
      - Customers can now view and claim your deal
      - Track performance in your vendor dashboard
      - Monitor PIN verifications and redemptions
      - View analytics and customer feedback
      
      View your deal dashboard: https://instoredealz.com/vendor/dashboard
      
      Need help managing your deal? Contact our support team at support@instoredealz.com
      
      Congratulations on your approved deal!
      The Instoredealz Team
    `
  };
}

export async function getApiKeyGeneratedEmail(businessName: string, vendorName: string, email: string, apiKey: string, createdAt: string, rateLimit: number, expiresAt: string | null) {
  const { fromEmail: senderEmail } = await getZeptoClient();
  const expiryInfo = expiresAt 
    ? `<p><strong>Expires:</strong> ${new Date(expiresAt).toLocaleDateString()}</p>`
    : `<p><strong>Expires:</strong> Never</p>`;
  
  const expiryText = expiresAt 
    ? `Expires: ${new Date(expiresAt).toLocaleDateString()}`
    : `Expires: Never`;

  return {
    to: email,
    from: senderEmail,
    subject: '🔐 Your API Key for POS Integration - Instoredealz',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>API Key Generated</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 API Key Generated</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">POS Integration Credentials for ${businessName}</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${vendorName}! 🎉</h2>
          
          <p>Great news! Your API key for POS integration has been generated successfully. You can now integrate your Point of Sale system with Instoredealz for automated claim verification.</p>
          
          <div style="background: #fff5f5; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ef4444; margin-top: 0;">⚠️ IMPORTANT SECURITY NOTICE</h3>
            <p style="margin: 0;"><strong>This is the only time you'll see your complete API key.</strong> Save it securely immediately. You won't be able to retrieve it later.</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px;">
              <li>Never share your API key publicly</li>
              <li>Don't commit it to version control (GitHub, etc.)</li>
              <li>Store it securely in your POS system configuration</li>
              <li>Contact support immediately if compromised</li>
            </ul>
          </div>
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">🔑 Your API Credentials</h3>
            <p><strong>Business:</strong> ${businessName}</p>
            <p><strong>API Key:</strong></p>
            <div style="background: #1a1a1a; color: #0f0; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 10px 0;">
              ${apiKey}
            </div>
            <p><strong>Generated:</strong> ${new Date(createdAt).toLocaleString()}</p>
            ${expiryInfo}
            <p><strong>Rate Limit:</strong> ${rateLimit} requests per minute</p>
          </div>
          
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
            <h3 style="color: #10b981; margin-top: 0;">🚀 Next Steps</h3>
            <ol style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Copy & Save:</strong> Copy your API key to a secure location</li>
              <li><strong>Configure POS:</strong> Add the API key to your POS system settings</li>
              <li><strong>Test Integration:</strong> Make a test API call to verify connectivity</li>
              <li><strong>Go Live:</strong> Start accepting automated claim verifications</li>
            </ol>
          </div>
          
          <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">📖 Integration Guide</h3>
            <p>Example API call to verify a claim:</p>
            <div style="background: #1a1a1a; color: #0f0; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 11px; overflow-x: auto; margin: 10px 0;">
curl -X POST https://your-domain.com/api/v1/claims/verify \\<br>
  -H "Authorization: Bearer YOUR_API_KEY" \\<br>
  -H "Content-Type: application/json" \\<br>
  -d '{"pin": "123456"}'
            </div>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://instoredealz.com/vendor/api-settings" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              View API Documentation
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #666; font-size: 14px; margin: 0;">
            Need help with integration? Contact our technical support team at <a href="mailto:api-support@instoredealz.com" style="color: #667eea;">api-support@instoredealz.com</a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
            Happy integrating!<br>
            The Instoredealz Development Team
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      API Key Generated - Instoredealz
      
      Hi ${vendorName}!
      
      Great news! Your API key for POS integration has been generated successfully. You can now integrate your Point of Sale system with Instoredealz for automated claim verification.
      
      ⚠️ IMPORTANT SECURITY NOTICE
      This is the only time you'll see your complete API key. Save it securely immediately. You won't be able to retrieve it later.
      
      - Never share your API key publicly
      - Don't commit it to version control (GitHub, etc.)
      - Store it securely in your POS system configuration
      - Contact support immediately if compromised
      
      🔑 Your API Credentials
      Business: ${businessName}
      API Key: ${apiKey}
      Generated: ${new Date(createdAt).toLocaleString()}
      ${expiryText}
      Rate Limit: ${rateLimit} requests per minute
      
      🚀 Next Steps
      1. Copy & Save: Copy your API key to a secure location
      2. Configure POS: Add the API key to your POS system settings
      3. Test Integration: Make a test API call to verify connectivity
      4. Go Live: Start accepting automated claim verifications
      
      📖 Integration Guide
      Example API call to verify a claim:
      
      curl -X POST https://your-domain.com/api/v1/claims/verify \\
        -H "Authorization: Bearer YOUR_API_KEY" \\
        -H "Content-Type: application/json" \\
        -d '{"pin": "123456"}'
      
      View API Documentation: https://instoredealz.com/vendor/api-settings
      
      Need help with integration? Contact our technical support team at api-support@instoredealz.com
      
      Happy integrating!
      The Instoredealz Development Team
    `
  };
}
