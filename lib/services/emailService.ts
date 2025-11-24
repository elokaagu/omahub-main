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

    const applicationDate = new Date(application.created_at).toLocaleString();
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
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #3a1e2d; color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px;">OmaHub</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">New Designer Application</p>
              </div>
              
              <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                  <h2 style="color: #856404; margin: 0 0 12px 0; font-size: 22px;">📝 New Application Received</h2>
                  <p style="margin: 0; color: #856404; font-size: 16px;">
                    A new designer application has been submitted and requires review.
                  </p>
                </div>

                <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
                  <h3 style="color: #3a1e2d; margin: 0 0 20px 0; font-size: 18px;">Application Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500; width: 140px;">Brand Name:</td>
                      <td style="padding: 10px 0; color: #333;"><strong>${application.brand_name}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500;">Designer:</td>
                      <td style="padding: 10px 0; color: #333;">${application.designer_name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500;">Email:</td>
                      <td style="padding: 10px 0; color: #333;">${application.email}</td>
                    </tr>
                    ${application.phone ? `
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500;">Phone:</td>
                      <td style="padding: 10px 0; color: #333;">${application.phone}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500;">Location:</td>
                      <td style="padding: 10px 0; color: #333;">${application.location}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500;">Category:</td>
                      <td style="padding: 10px 0; color: #333;">
                        <span style="background: #f8f9fa; padding: 4px 12px; border-radius: 12px; font-size: 14px; display: inline-block;">
                          ${application.category}
                        </span>
                      </td>
                    </tr>
                    ${application.website ? `
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500;">Website:</td>
                      <td style="padding: 10px 0; color: #333;">
                        <a href="${application.website}" target="_blank" style="color: #3a1e2d; text-decoration: none;">
                          ${application.website}
                        </a>
                      </td>
                    </tr>
                    ` : ''}
                    ${application.instagram ? `
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500;">Instagram:</td>
                      <td style="padding: 10px 0; color: #333;">
                        <a href="https://instagram.com/${application.instagram.replace(/^@/, '')}" target="_blank" style="color: #3a1e2d; text-decoration: none;">
                          @${application.instagram.replace(/^@/, '')}
                        </a>
                      </td>
                    </tr>
                    ` : ''}
                    ${application.year_founded ? `
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500;">Founded:</td>
                      <td style="padding: 10px 0; color: #333;">${application.year_founded}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 10px 0; color: #666; font-weight: 500;">Submitted:</td>
                      <td style="padding: 10px 0; color: #333;">${applicationDate}</td>
                    </tr>
                  </table>
                </div>

                <div style="background: #f8f9fa; border-left: 4px solid #3a1e2d; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                  <h3 style="color: #3a1e2d; margin: 0 0 12px 0; font-size: 16px;">Description</h3>
                  <p style="margin: 0; color: #666; line-height: 1.6; white-space: pre-wrap;">${application.description}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${applicationUrl}" 
                     style="display: inline-block; background: #3a1e2d; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Review Application
                  </a>
                </div>

                <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #666; font-size: 14px;">
                    <strong>Quick Access:</strong> You can also view all applications in the 
                    <a href="${studioUrl}" style="color: #3a1e2d; text-decoration: none; font-weight: 600;">Studio Applications Page</a>
                  </p>
                </div>

                <div style="border-top: 1px solid #e9ecef; padding-top: 24px; margin-top: 30px;">
                  <p style="color: #666; font-size: 14px; margin: 0;">
                    This is an automated notification from OmaHub.<br>
                    You're receiving this because you're a super admin.
                  </p>
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
