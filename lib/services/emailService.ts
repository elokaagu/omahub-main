import { Resend } from "resend";

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendContactEmail(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
  to?: string; // Optional recipient email
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - email service unavailable"
      );
      console.error(
        "💡 Please add RESEND_API_KEY environment variable to enable email sending"
      );
      console.error(
        "📖 See EMAIL_SERVICE_SETUP.md for detailed setup instructions"
      );
      return {
        success: false,
        error:
          "Email service not configured. Please contact administrator to set up RESEND_API_KEY.",
      };
    }

    // Determine recipient - use provided 'to' email or fallback to admin
    const recipientEmail = formData.to || "info@oma-hub.com";
    
    console.log("📧 Sending contact email via Resend to:", recipientEmail);
    const { data, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [recipientEmail],
      subject: `New Contact Form Submission: ${formData.subject}`,
      text: `
Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}
      `,
      replyTo: formData.email,
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Contact email sent successfully:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("💥 Failed to send contact email:", error);
    return { success: false, error };
  }
}

export async function sendInquiryReplyEmail(replyData: {
  customerName: string;
  customerEmail: string;
  originalSubject: string;
  originalMessage: string;
  replyMessage: string;
  brandName: string;
  adminName?: string;
  isFromSuperAdmin?: boolean;
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send inquiry reply email"
      );
      console.error("💡 Customer will not receive email notification of reply");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Reply to:", replyData.customerEmail);
      return {
        success: false,
        error:
          "Email service not configured. Reply saved but customer was not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const {
      customerName,
      customerEmail,
      originalSubject,
      originalMessage,
      replyMessage,
      brandName,
      adminName = "OmaHub Team",
      isFromSuperAdmin = false,
    } = replyData;

    // Determine sender name based on admin type
    const senderName = isFromSuperAdmin ? "OmaHub Support" : adminName;

    const { data, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [customerEmail],
      subject: `Re: ${originalSubject}`,
      text: `
Dear ${customerName},

Thank you for your inquiry about ${brandName}. Here's our response:

${replyMessage}

---
Original Message:
${originalMessage}

Best regards,
${senderName}
OmaHub Team

---
This is an automated response from the OmaHub platform.
      `,
      replyTo: isFromSuperAdmin ? "support@oma-hub.com" : "info@oma-hub.com",
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Inquiry reply email sent successfully:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("💥 Failed to send inquiry reply email:", error);
    return { success: false, error };
  }
}

export async function sendNewsletterConfirmationEmail(formData: {
  email: string;
  firstName: string;
  lastName: string;
  isReactivation?: boolean;
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send newsletter confirmation email"
      );
      console.error("💡 Subscriber will not receive confirmation email");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Confirmation to:", formData.email);
      return {
        success: false,
        error:
          "Email service not configured. Subscription saved but confirmation email was not sent. Please set up RESEND_API_KEY.",
      };
    }

    const { email, firstName, lastName, isReactivation = false } = formData;
    
    const displayName = firstName === "there" ? "there" : `${firstName} ${lastName}`.trim();
    const subject = isReactivation 
      ? "Welcome back to OmaHub Newsletter!" 
      : "Welcome to OmaHub Newsletter!";
    
    const welcomeMessage = isReactivation
      ? "Welcome back! We're thrilled to have you back in our community."
      : "Welcome to our community! We're excited to have you join us.";

    console.log("📧 Sending newsletter confirmation email to:", email);
    
    const { data, error } = await resend.emails.send({
      from: "OmaHub <newsletter@oma-hub.com>",
      to: [email],
      subject: subject,
      text: `
Dear ${displayName},

${welcomeMessage}

You're now subscribed to our newsletter and will receive:
• Early access to new designer collections
• Exclusive designer interviews and behind-the-scenes content
• Special event invitations and fashion industry updates
• Platform updates and new features

We're committed to bringing you the best in emerging fashion design and will only send you content that adds value to your experience.

If you ever want to unsubscribe, you can do so at any time by clicking the unsubscribe link in any of our emails.

Thank you for joining our community!

Best regards,
The OmaHub Team

---
This is an automated confirmation email. Please do not reply to this message.
      `,
      replyTo: "newsletter@oma-hub.com",
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Newsletter confirmation email sent successfully:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("💥 Failed to send newsletter confirmation email:", error);
    return { success: false, error };
  }
}

export async function subscribeToNewsletter(email: string) {
  // TODO: Implement Klaviyo/Mailchimp integration
  try {
    // For now, we'll just log the subscription
    console.log("📧 New newsletter subscription:", email);
    return { success: true };
  } catch (error) {
    console.error("💥 Failed to subscribe to newsletter:", error);
    return { success: false, error };
  }
}

export async function sendNewApplicationNotification(
  application: {
    id: string;
    brand_name: string;
    designer_name: string;
    email: string;
    phone?: string;
    location: string;
    category: string;
    description: string;
    website?: string;
    instagram?: string;
    year_founded?: number;
    created_at: string;
  },
  adminEmails: string[]
) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send new application notification"
      );
      console.error("💡 Super admins will not receive email notification");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      return {
        success: false,
        error:
          "Email service not configured. Application saved but admins were not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const applicationDate = new Date(application.created_at).toLocaleString("en-GB");
    const studioUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/studio/applications`;
    const applicationUrl = `${studioUrl}?id=${application.id}`;

    console.log("📧 Sending new application notification to super admins:", adminEmails);

    // Send email to each super admin
    const emailResults = [];
    for (const adminEmail of adminEmails) {
      try {
        const { data, error } = await resend.emails.send({
          from: "OmaHub <info@oma-hub.com>",
          to: [adminEmail],
          subject: `📝 New Designer Application - ${application.brand_name}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link rel="preconnect" href="https://fonts.googleapis.com">
              <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
              <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
            </head>
            <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1E1E1E; background-color: #F6F0E8; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #FFFDF8; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(58, 30, 45, 0.12);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #3A1E2D 0%, #2A1520 100%); color: white; padding: 48px 40px; text-align: center;">
                  <h1 style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 1px; font-family: 'Playfair Display', Georgia, serif;">OmaHub</h1>
                  <p style="margin: 12px 0 0 0; opacity: 0.95; font-size: 18px; font-weight: 300; letter-spacing: 0.5px;">New Designer Application</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px;">
                  <!-- Alert Banner -->
                  <div style="background: linear-gradient(135deg, #F6F0E8 0%, #FFFDF8 100%); border-left: 4px solid #D4B285; padding: 24px; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 2px 8px rgba(58, 30, 45, 0.06);">
                    <h2 style="color: #3A1E2D; margin: 0 0 12px 0; font-size: 24px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif;">📝 New Application Received</h2>
                    <p style="margin: 0; color: #A07F68; font-size: 16px; line-height: 1.6;">
                      A new designer application has been submitted and requires review.
                    </p>
                  </div>

                  <!-- Application Details Card -->
                  <div style="background: #FFFDF8; border: 1px solid #E5D6C6; border-radius: 12px; padding: 32px; margin-bottom: 32px; box-shadow: 0 2px 8px rgba(58, 30, 45, 0.04);">
                    <h3 style="color: #3A1E2D; margin: 0 0 24px 0; font-size: 20px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif; border-bottom: 2px solid #D4B285; padding-bottom: 12px;">Application Details</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; width: 140px; font-size: 15px;">Brand Name:</td>
                        <td style="padding: 12px 0; color: #1E1E1E; font-weight: 600; font-size: 15px;">${application.brand_name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; font-size: 15px;">Designer:</td>
                        <td style="padding: 12px 0; color: #1E1E1E; font-size: 15px;">${application.designer_name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; font-size: 15px;">Email:</td>
                        <td style="padding: 12px 0; color: #3A1E2D; font-size: 15px;">
                          <a href="mailto:${application.email}" style="color: #3A1E2D; text-decoration: underline; text-decoration-color: #D4B285;">${application.email}</a>
                        </td>
                      </tr>
                      ${application.phone ? `
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; font-size: 15px;">Phone:</td>
                        <td style="padding: 12px 0; color: #1E1E1E; font-size: 15px;">${application.phone}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; font-size: 15px;">Location:</td>
                        <td style="padding: 12px 0; color: #1E1E1E; font-size: 15px;">${application.location}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; font-size: 15px;">Category:</td>
                        <td style="padding: 12px 0; font-size: 15px;">
                          <span style="background: #F6F0E8; color: #3A1E2D; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; display: inline-block; border: 1px solid #D4B285;">
                            ${application.category}
                          </span>
                        </td>
                      </tr>
                      ${application.website ? `
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; font-size: 15px;">Website:</td>
                        <td style="padding: 12px 0; font-size: 15px;">
                          <a href="${application.website}" target="_blank" style="color: #3A1E2D; text-decoration: underline; text-decoration-color: #D4B285;">
                            ${application.website}
                          </a>
                        </td>
                      </tr>
                      ` : ''}
                      ${application.instagram ? `
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; font-size: 15px;">Instagram:</td>
                        <td style="padding: 12px 0; font-size: 15px;">
                          <a href="https://instagram.com/${application.instagram.replace(/^@/, '')}" target="_blank" style="color: #3A1E2D; text-decoration: underline; text-decoration-color: #D4B285;">
                            @${application.instagram.replace(/^@/, '')}
                          </a>
                        </td>
                      </tr>
                      ` : ''}
                      ${application.year_founded ? `
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; font-size: 15px;">Founded:</td>
                        <td style="padding: 12px 0; color: #1E1E1E; font-size: 15px;">${application.year_founded}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0; color: #A07F68; font-weight: 500; font-size: 15px;">Submitted:</td>
                        <td style="padding: 12px 0; color: #1E1E1E; font-size: 15px;">${applicationDate}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Description Card -->
                  <div style="background: #F6F0E8; border-left: 4px solid #D4B285; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
                    <h3 style="color: #3A1E2D; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif;">Description</h3>
                    <p style="margin: 0; color: #1E1E1E; line-height: 1.8; white-space: pre-wrap; font-size: 15px;">${application.description}</p>
                  </div>

                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 40px 0 32px 0;">
                    <a href="${applicationUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #3A1E2D 0%, #2A1520 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(58, 30, 45, 0.3); transition: all 0.3s ease;">
                      Review Application
                    </a>
                  </div>

                  <!-- Quick Access -->
                  <div style="background: #FFFDF8; border: 1px solid #E5D6C6; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                    <p style="margin: 0; color: #A07F68; font-size: 14px; line-height: 1.6;">
                      <strong style="color: #3A1E2D;">Quick Access:</strong> You can also view all applications in the 
                      <a href="${studioUrl}" style="color: #3A1E2D; text-decoration: underline; text-decoration-color: #D4B285; font-weight: 600;">Studio Applications Page</a>
                    </p>
                  </div>

                  <!-- Footer -->
                  <div style="border-top: 1px solid #E5D6C6; padding-top: 24px; margin-top: 32px;">
                    <p style="color: #A07F68; font-size: 13px; margin: 0; line-height: 1.6;">
                      This is an automated notification from <strong style="color: #3A1E2D;">OmaHub</strong>.<br>
                      You're receiving this because you're a super admin.
                    </p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
          text: `
New Designer Application - ${application.brand_name}

A new designer application has been submitted and requires review.

Application Details:
- Brand Name: ${application.brand_name}
- Designer: ${application.designer_name}
- Email: ${application.email}
${application.phone ? `- Phone: ${application.phone}` : ''}
- Location: ${application.location}
- Category: ${application.category}
${application.website ? `- Website: ${application.website}` : ''}
${application.instagram ? `- Instagram: @${application.instagram.replace(/^@/, '')}` : ''}
${application.year_founded ? `- Founded: ${application.year_founded}` : ''}
- Submitted: ${applicationDate}

Description:
${application.description}

Review this application: ${applicationUrl}
View all applications: ${studioUrl}

This is an automated notification from OmaHub.
You're receiving this because you're a super admin.
          `,
          replyTo: "info@oma-hub.com",
        });

        if (error) {
          console.error(`❌ Failed to send notification to ${adminEmail}:`, error);
          emailResults.push({ email: adminEmail, success: false, error });
        } else {
          console.log(`✅ New application notification sent to ${adminEmail}`);
          emailResults.push({ email: adminEmail, success: true });
        }
      } catch (emailError) {
        console.error(
          `❌ Error sending notification to ${adminEmail}:`,
          emailError
        );
        emailResults.push({
          email: adminEmail,
          success: false,
          error: emailError instanceof Error ? emailError.message : "Unknown error",
        });
      }
    }

    const successCount = emailResults.filter((r) => r.success).length;
    const failureCount = emailResults.filter((r) => !r.success).length;

    if (successCount > 0) {
      console.log(
        `✅ Sent new application notifications to ${successCount} admin(s)`
      );
    }
    if (failureCount > 0) {
      console.warn(
        `⚠️ Failed to send notifications to ${failureCount} admin(s)`
      );
    }

    return {
      success: successCount > 0,
      results: emailResults,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error("💥 Error sending new application notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendApplicationApprovalEmail(data: {
  designerName: string;
  brandName: string;
  email: string;
  temporaryPassword?: string;
  passwordResetLink?: string;
  isNewUser: boolean;
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send application approval email"
      );
      console.error("💡 Designer will not receive approval notification");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Approval notification to:", data.email);
      return {
        success: false,
        error:
          "Email service not configured. Application approved but designer was not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const { designerName, brandName, email, temporaryPassword, passwordResetLink, isNewUser } = data;
    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/login`;
    const studioUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/studio`;

    // Build password section - ALWAYS include temporary password for new users
    let passwordSection = '';
    
    if (isNewUser) {
      // For new users, ALWAYS show temporary password (it's always generated)
      // Also show password reset link if available
      passwordSection = `
        <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 24px; margin: 20px 0;">
          <h3 style="color: #3a1e2d; margin: 0 0 20px 0; font-size: 18px;">🔐 Your Login Credentials</h3>
          
          ${temporaryPassword ? `
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin-bottom: ${passwordResetLink ? '16px' : '0'}; border-radius: 4px;">
            <p style="margin: 0 0 12px 0; color: #856404; font-weight: 600; font-size: 16px;">${passwordResetLink ? 'Option 1: ' : ''}Login with Temporary Password</p>
            <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">
              You can log in immediately using these credentials:
            </p>
            <div style="background: #fff; padding: 16px; border-radius: 4px; margin-bottom: 12px;">
              <p style="margin: 0 0 8px 0; color: #333; font-size: 14px;">
                <strong>Email:</strong> <span style="font-family: monospace; font-weight: 600;">${email}</span>
              </p>
              <p style="margin: 0; color: #333; font-size: 14px;">
                <strong>Temporary Password:</strong><br>
                <code style="background: #f8f9fa; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 16px; font-weight: 700; letter-spacing: 1px; display: inline-block; margin-top: 8px; border: 2px solid #ffc107;">${temporaryPassword}</code>
              </p>
            </div>
            <p style="margin: 12px 0 0 0; color: #d32f2f; font-size: 13px; font-weight: 600;">
              ⚠️ <strong>Important:</strong> Please change your password after your first login for security.
            </p>
          </div>
          ` : ''}
          
          ${passwordResetLink ? `
          <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 16px; border-radius: 4px;">
            <p style="margin: 0 0 12px 0; color: #2e7d32; font-weight: 600; font-size: 14px;">Option 2: Set Your Password (Recommended)</p>
            <p style="margin: 0 0 16px 0; color: #1b5e20; font-size: 13px;">
              Click the button below to set your own secure password. This link expires in 7 days.
            </p>
            <div style="text-align: center; margin: 16px 0;">
              <a href="${passwordResetLink}" 
                 style="display: inline-block; background: #3a1e2d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Set My Password
              </a>
            </div>
            <p style="margin: 12px 0 0 0; color: #666; font-size: 11px; text-align: center;">
              Or copy: <code style="background: #fff; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 10px; word-break: break-all;">${passwordResetLink}</code>
            </p>
          </div>
          ` : ''}
          
          ${!temporaryPassword && !passwordResetLink ? `
          <p style="margin: 0; color: #666;">
            Your account has been created. Please use the "Forgot Password" feature to set your password.
          </p>
          ` : ''}
        </div>
      `;
    } else {
      passwordSection = `
        <div style="background: #f8f9fa; border-left: 4px solid #3a1e2d; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #666;">
            You can log in using your existing account credentials.
          </p>
        </div>
      `;
    }

    console.log("📧 Sending application approval email to:", email);

    const { data: emailData, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [email],
      subject: `🎉 Your Application Has Been Approved - Welcome to OmaHub!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #3a1e2d; color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">OmaHub</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Application Approved</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="color: #2e7d32; margin: 0 0 12px 0; font-size: 22px;">🎉 Congratulations, ${designerName}!</h2>
              <p style="margin: 0; color: #1b5e20; font-size: 16px;">
                Your application for <strong>${brandName}</strong> has been approved!
              </p>
            </div>

            <p style="color: #333; font-size: 16px; margin: 0 0 20px 0;">
              We're thrilled to welcome you to OmaHub! Your brand has been set up and you now have access to manage your brand profile, products, and customer inquiries.
            </p>

            ${passwordSection}

            <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 24px; margin: 30px 0;">
              <h3 style="color: #3a1e2d; margin: 0 0 16px 0; font-size: 18px;">What's Next?</h3>
              <ol style="margin: 0; padding-left: 20px; color: #666;">
                <li style="margin-bottom: 12px;">
                  <strong>Log in to your Studio:</strong> Visit <a href="${loginUrl}" style="color: #3a1e2d; text-decoration: none; font-weight: 600;">${loginUrl}</a>
                </li>
                <li style="margin-bottom: 12px;">
                  <strong>Access your brand dashboard:</strong> Once logged in, you'll be able to manage your brand from the <a href="${studioUrl}" style="color: #3a1e2d; text-decoration: none; font-weight: 600;">Studio</a>
                </li>
                <li style="margin-bottom: 12px;">
                  <strong>Complete your brand profile:</strong> Add your brand logo, images, and complete product listings
                </li>
                <li style="margin-bottom: 0;">
                  <strong>Start managing:</strong> Respond to customer inquiries, update your catalogue, and grow your presence on OmaHub
                </li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" style="display: inline-block; background: #3a1e2d; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Log In to Studio
              </a>
            </div>

            <div style="border-top: 1px solid #e9ecef; padding-top: 24px; margin-top: 30px;">
              <p style="color: #666; font-size: 14px; margin: 0 0 8px 0;">
                If you have any questions or need assistance, please don't hesitate to reach out to our support team.
              </p>
              <p style="color: #666; font-size: 14px; margin: 0;">
                Welcome aboard!<br>
                <strong>The OmaHub Team</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Congratulations, ${designerName}!

Your application for ${brandName} has been approved!

We're thrilled to welcome you to OmaHub! Your brand has been set up and you now have access to manage your brand profile, products, and customer inquiries.

${isNewUser
  ? `Your Login Credentials:

${temporaryPassword ? `${passwordResetLink ? 'Option 1: ' : ''}Login with Temporary Password
You can log in immediately using these credentials:

Email: ${email}
Temporary Password: ${temporaryPassword}

⚠️ Important: Please change your password after your first login for security.

${passwordResetLink ? '\n' : ''}` : ''}${passwordResetLink ? `Option 2: Set Your Password (Recommended)
Click the link below to set your own secure password. This link expires in 7 days.

Set My Password: ${passwordResetLink}

If the link doesn't work, copy and paste it into your browser.

` : ''}${!temporaryPassword && !passwordResetLink ? `Your account has been created. Please use the "Forgot Password" feature to set your password.` : ''}`
  : `You can log in using your existing account credentials.`}

What's Next?

1. Log in to your Studio: ${loginUrl}
2. Access your brand dashboard: Once logged in, you'll be able to manage your brand from the Studio
3. Complete your brand profile: Add your brand logo, images, and complete product listings
4. Start managing: Respond to customer inquiries, update your catalogue, and grow your presence on OmaHub

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Welcome aboard!
The OmaHub Team
      `,
      replyTo: "info@oma-hub.com",
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Application approval email sent successfully:", emailData?.id);
    return { success: true, data: emailData };
  } catch (error) {
    console.error("💥 Failed to send application approval email:", error);
    return { success: false, error };
  }
}

export async function sendApplicationRejectionEmail(data: {
  designerName: string;
  brandName: string;
  email: string;
  notes?: string;
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send application rejection email"
      );
      console.error("💡 Designer will not receive rejection notification");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Rejection notification to:", data.email);
      return {
        success: false,
        error:
          "Email service not configured. Application rejected but designer was not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const { designerName, brandName, email, notes } = data;
    const joinUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}/join`;

    console.log("📧 Sending application rejection email to:", email);

    const { data: emailData, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [email],
      subject: `Update on Your Application - ${brandName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1E1E1E; background-color: #F6F0E8; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFDF8; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(58, 30, 45, 0.12);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3A1E2D 0%, #2A1520 100%); color: white; padding: 48px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 1px; font-family: 'Playfair Display', Georgia, serif;">OmaHub</h1>
              <p style="margin: 12px 0 0 0; opacity: 0.95; font-size: 18px; font-weight: 300; letter-spacing: 0.5px;">Application Update</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px;">
              <!-- Notification Banner -->
              <div style="background: linear-gradient(135deg, #FFF5F5 0%, #FFFDF8 100%); border-left: 4px solid #D4B285; padding: 24px; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 2px 8px rgba(58, 30, 45, 0.06);">
                <h2 style="color: #3A1E2D; margin: 0 0 12px 0; font-size: 24px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif;">Thank You, ${designerName}</h2>
                <p style="margin: 0; color: #A07F68; font-size: 16px; line-height: 1.6;">
                  We've reviewed your application for <strong>${brandName}</strong> and unfortunately, we're unable to proceed at this time.
                </p>
              </div>

              <p style="color: #1E1E1E; font-size: 16px; margin: 0 0 20px 0; line-height: 1.8;">
                We appreciate the time and effort you put into your application. After careful consideration, we've decided not to move forward with your application at this moment.
              </p>

              ${notes ? `
              <div style="background: #F6F0E8; border-left: 4px solid #D4B285; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <h3 style="color: #3A1E2D; margin: 0 0 12px 0; font-size: 18px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif;">Feedback</h3>
                <p style="margin: 0; color: #1E1E1E; line-height: 1.8; white-space: pre-wrap; font-size: 15px;">${notes}</p>
              </div>
              ` : ''}

              <div style="background: #FFFDF8; border: 1px solid #E5D6C6; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <h3 style="color: #3A1E2D; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif;">What's Next?</h3>
                <p style="margin: 0 0 16px 0; color: #1E1E1E; font-size: 15px; line-height: 1.8;">
                  We encourage you to continue developing your brand and portfolio. You're welcome to apply again in the future when your brand has evolved or meets our current criteria.
                </p>
                <p style="margin: 0; color: #1E1E1E; font-size: 15px; line-height: 1.8;">
                  If you have any questions or would like to discuss your application further, please don't hesitate to reach out to our support team.
                </p>
              </div>

              <div style="text-align: center; margin: 40px 0 32px 0;">
                <a href="${joinUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #3A1E2D 0%, #2A1520 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(58, 30, 45, 0.3);">
                  Visit Our Website
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #E5D6C6; padding-top: 24px; margin-top: 32px;">
                <p style="color: #A07F68; font-size: 13px; margin: 0; line-height: 1.6;">
                  Thank you for your interest in OmaHub.<br>
                  <strong style="color: #3A1E2D;">The OmaHub Team</strong>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${designerName},

Thank you for your interest in OmaHub and for taking the time to submit your application for ${brandName}.

After careful consideration, we've decided not to move forward with your application at this time.

${notes ? `\nFeedback:\n${notes}\n` : ''}

We encourage you to continue developing your brand and portfolio. You're welcome to apply again in the future when your brand has evolved or meets our current criteria.

If you have any questions or would like to discuss your application further, please don't hesitate to reach out to our support team.

Thank you for your interest in OmaHub.

Best regards,
The OmaHub Team

Visit us: ${joinUrl}
      `,
      replyTo: "info@oma-hub.com",
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Application rejection email sent successfully:", emailData?.id);
    return { success: true, data: emailData };
  } catch (error) {
    console.error("💥 Failed to send application rejection email:", error);
    return { success: false, error };
  }
}

export async function sendApplicationConfirmationEmail(data: {
  designerName: string;
  brandName: string;
  email: string;
}) {
  try {
    // Check if Resend is properly configured
    if (!resend) {
      console.error(
        "❌ Resend API key not configured - cannot send application confirmation email"
      );
      console.error("💡 Designer will not receive confirmation notification");
      console.error("📖 See EMAIL_SERVICE_SETUP.md for setup instructions");
      console.error("🎯 Confirmation notification to:", data.email);
      return {
        success: false,
        error:
          "Email service not configured. Application saved but designer was not notified via email. Please set up RESEND_API_KEY.",
      };
    }

    const { designerName, brandName, email } = data;
    const websiteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://oma-hub.com"}`;
    const joinUrl = `${websiteUrl}/join`;

    console.log("📧 Sending application confirmation email to:", email);

    const { data: emailData, error } = await resend.emails.send({
      from: "OmaHub <info@oma-hub.com>",
      to: [email],
      subject: `Application Received - ${brandName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1E1E1E; background-color: #F6F0E8; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFDF8; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(58, 30, 45, 0.12);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3A1E2D 0%, #2A1520 100%); color: white; padding: 48px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 700; letter-spacing: 1px; font-family: 'Playfair Display', Georgia, serif;">OmaHub</h1>
              <p style="margin: 12px 0 0 0; opacity: 0.95; font-size: 18px; font-weight: 300; letter-spacing: 0.5px;">Application Received</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px;">
              <!-- Notification Banner -->
              <div style="background: linear-gradient(135deg, #F6F0E8 0%, #FFFDF8 100%); border-left: 4px solid #D4B285; padding: 24px; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 2px 8px rgba(58, 30, 45, 0.06);">
                <h2 style="color: #3A1E2D; margin: 0 0 12px 0; font-size: 24px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif;">Thank You, ${designerName}</h2>
                <p style="margin: 0; color: #A07F68; font-size: 16px; line-height: 1.6;">
                  We've successfully received your application for <strong>${brandName}</strong>.
                </p>
              </div>

              <p style="color: #1E1E1E; font-size: 16px; margin: 0 0 20px 0; line-height: 1.8;">
                Thank you for your interest in joining OmaHub. We appreciate you taking the time to submit your application and share your brand with us.
              </p>

              <div style="background: #FFFDF8; border: 1px solid #E5D6C6; border-radius: 12px; padding: 24px; margin: 32px 0;">
                <h3 style="color: #3A1E2D; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; font-family: 'Playfair Display', Georgia, serif;">What Happens Next?</h3>
                <p style="margin: 0 0 16px 0; color: #1E1E1E; font-size: 15px; line-height: 1.8;">
                  Our team will carefully review your application. We'll get back to you within <strong>5-7 business days</strong> with an update on your application status.
                </p>
                <p style="margin: 0; color: #1E1E1E; font-size: 15px; line-height: 1.8;">
                  If you have any questions or need to update your application, please don't hesitate to reach out to our support team.
                </p>
              </div>

              <div style="text-align: center; margin: 40px 0 32px 0;">
                <a href="${websiteUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #3A1E2D 0%, #2A1520 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(58, 30, 45, 0.3);">
                  Visit Our Website
                </a>
              </div>

              <!-- Footer -->
              <div style="border-top: 1px solid #E5D6C6; padding-top: 24px; margin-top: 32px;">
                <p style="color: #A07F68; font-size: 13px; margin: 0; line-height: 1.6;">
                  Thank you for your interest in OmaHub.<br>
                  <strong style="color: #3A1E2D;">The OmaHub Team</strong>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Dear ${designerName},

Thank you for your interest in joining OmaHub and for taking the time to submit your application for ${brandName}.

We've successfully received your application and appreciate you sharing your brand with us.

What Happens Next?

Our team will carefully review your application. We'll get back to you within 5-7 business days with an update on your application status.

If you have any questions or need to update your application, please don't hesitate to reach out to our support team.

Thank you for your interest in OmaHub.

Best regards,
The OmaHub Team

Visit us: ${websiteUrl}
      `,
      replyTo: "info@oma-hub.com",
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      throw error;
    }

    console.log("✅ Application confirmation email sent successfully:", emailData?.id);
    return { success: true, data: emailData };
  } catch (error) {
    console.error("💥 Failed to send application confirmation email:", error);
    return { success: false, error };
  }
}
