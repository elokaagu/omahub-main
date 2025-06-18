# Legal Documents System Setup

The legal documents management system allows super admins to manage Terms of Service and Privacy Policy documents directly from the studio.

## Setup Required

The system requires a database table to be created. Follow these steps:

### 1. Access Supabase Dashboard

- Go to your Supabase project dashboard
- Navigate to **SQL Editor**

### 2. Run the Setup Script

- Copy the entire contents of `scripts/create-legal-documents-table.sql`
- Paste it into the SQL Editor
- Click **Run** to execute the script

### 3. Verify Setup

The script will:

- Create the `legal_documents` table with proper structure
- Set up Row Level Security (RLS) policies
- Create indexes for performance
- Insert default Terms of Service and Privacy Policy documents
- Set up automatic versioning triggers

### 4. Test the System

- Go to Studio → Settings → Legal Documents
- You should see the default documents
- Try creating/editing documents
- Check that public pages display the documents correctly

## Features

### For Super Admins:

- Create and edit legal documents
- Version management (automatic versioning)
- Rich text editor with formatting
- Document activation/deactivation
- Preview documents before publishing

### For Public Users:

- Access current Terms of Service at `/terms-of-service`
- Access current Privacy Policy at `/privacy-policy`
- Clean, readable formatting
- Always shows the active version

## Troubleshooting

### "Failed to load legal documents" Error

This means the database table hasn't been created yet. Follow the setup steps above.

### Permission Denied

Only super admins can manage legal documents. Check that your user has the `super_admin` role in the profiles table.

### Documents Not Showing on Public Pages

- Check that documents are marked as `is_active = true`
- Verify the public pages are correctly fetching from the API
- Check browser console for any JavaScript errors

## Default Content

The system comes with basic default content for both documents. You should customize these to match your specific legal requirements and business needs.

**Important**: The default legal documents are generic templates. You should consult with legal professionals to ensure your Terms of Service and Privacy Policy meet your specific business and legal requirements.
