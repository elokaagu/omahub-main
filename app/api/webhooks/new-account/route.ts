import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { adminEmailServiceServer } from "@/lib/services/adminEmailService.server";

// Admin emails will be fetched from database

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from Supabase (basic security)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.WEBHOOK_SECRET || "your-webhook-secret";

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      console.log("❌ Unauthorized webhook request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, table, record, old_record } = body;

    // Only process INSERT events on the profiles table
    if (type !== "INSERT" || table !== "profiles") {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 });
    }

    const newUser = record;
    console.log("🎉 New account created:", {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      created_at: newUser.created_at,
    });

    // Get admin emails from database
    const adminEmails = await adminEmailServiceServer.getWebhookAdminEmails();
    
    // Send notification emails to admins
    await sendNewAccountNotification(newUser, adminEmails);

    // Log to console for immediate visibility
    console.log("=== NEW ACCOUNT CREATED ===");
    console.log(`Email: ${newUser.email}`);
    console.log(`Role: ${newUser.role}`);
    console.log(`User ID: ${newUser.id}`);
    console.log(`Created: ${new Date(newUser.created_at).toLocaleString("en-GB")}`);
    console.log(`Notifying admins: ${adminEmails.join(', ')}`);
    console.log("============================");

    return NextResponse.json({
      message: "New account notification processed successfully",
      user_email: newUser.email,
    });
  } catch (error) {
    console.error("❌ Error processing new account webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function sendNewAccountNotification(user: any, adminEmails: string[]) {
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

    const userCreatedDate = new Date(user.created_at).toLocaleString("en-GB");
    const roleDisplay = user.role.replace("_", " ").toUpperCase();

    // Send email to each admin
    for (const adminEmail of adminEmails) {
      try {
        await resend.emails.send({
          from: "OmaHub <info@oma-hub.com>",
          to: [adminEmail],
          subject: `🎉 New Account Created - ${user.email}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3a1e2d 0%, #a07f68 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 2px;">OmaHub</h1>
                <p style="margin: 8px 0 0 0; opacity: 0.9;">New Account Alert</p>
              </div>
              
              <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #3a1e2d; margin: 0 0 16px 0; font-size: 20px;">🎉 New User Registered</h2>
                  <p style="margin: 0; color: #666;">A new user has just created an account on OmaHub!</p>
                </div>

                <div style="background: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="color: #3a1e2d; margin: 0 0 16px 0; font-size: 16px;">Account Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Email:</td>
                      <td style="padding: 8px 0; color: #333;"><strong>${user.email}</strong></td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Role:</td>
                      <td style="padding: 8px 0; color: #333;">${roleDisplay}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">User ID:</td>
                      <td style="padding: 8px 0; color: #333; font-family: monospace; font-size: 12px;">${user.id}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #666; font-weight: 500;">Created:</td>
                      <td style="padding: 8px 0; color: #333;">${userCreatedDate}</td>
                    </tr>
                  </table>
                </div>

                <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #3a1e2d; margin: 0 0 12px 0; font-size: 16px;">Quick Actions</h3>
                  <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">You can manage this user from the admin panel:</p>
                  <a href="https://oma-hub.com/studio/users" 
                     style="display: inline-block; background: linear-gradient(135deg, #3a1e2d 0%, #a07f68 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
                    View in Admin Panel
                  </a>
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
        });

        console.log(`✅ New account notification sent to ${adminEmail}`);
      } catch (emailError) {
        console.error(
          `❌ Failed to send notification to ${adminEmail}:`,
          emailError
        );
      }
    }
  } catch (error) {
    console.error("❌ Error sending new account notifications:", error);
  }
}
