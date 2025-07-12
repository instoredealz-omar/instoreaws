import { MailService } from '@sendgrid/mail';

const SENDGRID_ENABLED = !!process.env.SENDGRID_API_KEY;

let mailService: MailService | null = null;

if (SENDGRID_ENABLED) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY!);
  console.log('[EMAIL] SendGrid email service enabled');
} else {
  console.warn('[EMAIL] SendGrid API key not found. Email notifications will be disabled.');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!SENDGRID_ENABLED || !mailService) {
    console.log(`[EMAIL] Email sending disabled - would have sent: ${params.subject} to ${params.to}`);
    return true; // Return true to not break the flow
  }

  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) {
      emailData.text = params.text;
    }
    
    if (params.html) {
      emailData.html = params.html;
    }
    
    await mailService!.send(emailData);
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

// Email templates
export function getWelcomeCustomerEmail(name: string, email: string) {
  return {
    to: email,
    from: 'noreply@instoredealz.com', // Replace with your verified sender email
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
    from: 'noreply@instoredealz.com', // Replace with your verified sender email
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