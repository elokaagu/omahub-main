import { NextRequest, NextResponse } from "next/server";
import { adminEmailServiceServer } from "@/lib/services/adminEmailService.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, feedbackType, subject, message } = body;

    // Validate required fields
    if (!name || !email || !feedbackType || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    console.log("📧 Feedback submission received:", {
      name,
      email,
      feedbackType,
      subject,
      message: message.substring(0, 100) + "...",
    });

    // Get admin emails for feedback notifications
    const adminConfig = await adminEmailServiceServer.getAdminEmailConfig();

    // Combine super admin emails with info@oma-hub.com
    const feedbackEmails = [
      ...adminConfig.super_admin_emails,
      "info@oma-hub.com",
    ].filter((email, index, arr) => arr.indexOf(email) === index); // Remove duplicates

    console.log("📬 Sending feedback to:", feedbackEmails);

    // Send feedback email to admin team
    await sendFeedbackEmail({
      name,
      email,
      feedbackType,
      subject,
      message,
      adminEmails: feedbackEmails,
    });

    // Store feedback in database (optional - for tracking)
    await storeFeedbackInDatabase({
      name,
      email,
      feedbackType,
      subject,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("❌ Error processing feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback. Please try again." },
      { status: 500 }
    );
  }
}

async function sendFeedbackEmail(feedbackData: {
  name: string;
  email: string;
  feedbackType: string;
  subject: string;
  message: string;
  adminEmails: string[];
}) {
  try {
    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      console.log(
        "⚠️ RESEND_API_KEY not configured, skipping email notification"
      );
      return;
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { name, email, feedbackType, subject, message, adminEmails } =
      feedbackData;
    const timestamp = new Date().toLocaleString();
    const feedbackTypeDisplay = feedbackType
      .replace("_", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    // Send email to each admin
    for (const adminEmail of adminEmails) {
      try {
        await resend.emails.send({
          from: "OmaHub Feedback <info@oma-hub.com>",
          to: [adminEmail],
          subject: `📝 New Feedback: ${subject}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3a1e2d 0%, #a07f68 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px;">OmaHub</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">New Feedback Alert</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #3a1e2d; margin: 0 0 16px 0; font-size: 20px;">📝 New Feedback Received</h2>
                  <p style="margin: 0; color: #666;">A user has submitted feedback on OmaHub!</p>
                </div>

                <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="color: #3a1e2d; margin: 0 0 16px 0; font-size: 16px;">Feedback Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">From:</td>
                      <td style="padding: 8px 0; color: #333;"><strong>${name}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Email:</td>
                      <td style="padding: 8px 0; color: #333;"><strong>${email}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Type:</td>
                      <td style="padding: 8px 0; color: #333;">
                        <span style="background: #e8f4f8; color: #3a1e2d; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">
                          ${feedbackTypeDisplay}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Subject:</td>
                      <td style="padding: 8px 0; color: #333;"><strong>${subject}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Submitted:</td>
                      <td style="padding: 8px 0; color: #333;">${timestamp}</td>
                    </tr>
                  </table>
                </div>

                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="color: #856404; margin: 0 0 16px 0; font-size: 16px;">Message</h3>
                  <div style="color: #856404; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                </div>

                <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #3a1e2d; margin: 0 0 12px 0; font-size: 16px;">Quick Actions</h3>
                  <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">You can respond to this feedback or take action:</p>
                  <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <a href="mailto:${email}?subject=Re: ${subject}" 
                       style="display: inline-block; background: linear-gradient(135deg, #3a1e2d 0%, #a07f68 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                      Reply via Email
                    </a>
                    <a href="https://oma-hub.com/studio" 
                       style="display: inline-block; background: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px;">
                      View in Studio
                    </a>
                  </div>
                </div>

                <div style="border-top: 1px solid #e9ecef; padding-top: 20px; text-align: center;">
                  <p style="margin: 0; color: #666; font-size: 12px;">
                    This is an automated notification from OmaHub.<br>
                    You're receiving this because you're an admin.
                  </p>
                </div>
              </div>
            </div>
          `,
          replyTo: email, // Allow admins to reply directly to the user
        });

        console.log(`✅ Feedback notification sent to ${adminEmail}`);
      } catch (emailError) {
        console.error(
          `❌ Failed to send feedback notification to ${adminEmail}:`,
          emailError
        );
      }
    }
  } catch (error) {
    console.error("❌ Error sending feedback notifications:", error);
  }
}

async function storeFeedbackInDatabase(feedbackData: {
  name: string;
  email: string;
  feedbackType: string;
  subject: string;
  message: string;
}) {
  try {
    // This is optional - you can create a feedback table to store submissions
    // For now, we'll just log it to console
    console.log("💾 Feedback data (would be stored in database):", {
      ...feedbackData,
      timestamp: new Date().toISOString(),
    });

    // TODO: Create feedback table and store submissions
    // Example SQL:
    // CREATE TABLE feedback (
    //   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    //   name TEXT NOT NULL,
    //   email TEXT NOT NULL,
    //   feedback_type TEXT NOT NULL,
    //   subject TEXT NOT NULL,
    //   message TEXT NOT NULL,
    //   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    //   status TEXT DEFAULT 'new'
    // );
  } catch (error) {
    console.error("❌ Error storing feedback in database:", error);
  }
}
