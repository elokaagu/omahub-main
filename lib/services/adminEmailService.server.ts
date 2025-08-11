import { createServerSupabaseClient } from "@/lib/supabase-unified";

export interface AdminEmailConfig {
  super_admin_emails: string[];
  brand_admin_emails: string[];
  webhook_admin_emails: string[];
}

export class AdminEmailServiceServer {
  private static instance: AdminEmailServiceServer;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): AdminEmailServiceServer {
    if (!AdminEmailServiceServer.instance) {
      AdminEmailServiceServer.instance = new AdminEmailServiceServer();
    }
    return AdminEmailServiceServer.instance;
  }

  /**
   * Get all admin email configurations from the database
   */
  async getAdminEmailConfig(): Promise<AdminEmailConfig> {
    const cacheKey = 'admin_email_config';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const supabase = await createServerSupabaseClient();
      
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['super_admin_emails', 'brand_admin_emails', 'webhook_admin_emails']);

      if (error) {
        console.error('Error fetching admin email config:', error);
        throw error;
      }

      const config: AdminEmailConfig = {
        super_admin_emails: [],
        brand_admin_emails: [],
        webhook_admin_emails: []
      };

      data?.forEach(setting => {
        try {
          const emails = JSON.parse(setting.value);
          if (Array.isArray(emails)) {
            config[setting.key as keyof AdminEmailConfig] = emails;
          }
        } catch (parseError) {
          console.error(`Error parsing ${setting.key}:`, parseError);
        }
      });

      // Cache the result
      this.cache.set(cacheKey, {
        data: config,
        timestamp: Date.now()
      });

      return config;
    } catch (error) {
      console.error('Failed to fetch admin email config:', error);
      // Return fallback configuration
      return {
        super_admin_emails: ['eloka.agu@icloud.com', 'shannonalisa@oma-hub.com'],
        brand_admin_emails: ['eloka@culturin.com'],
        webhook_admin_emails: ['eloka.agu@icloud.com', 'shannonalisa@oma-hub.com', 'eloka@satellitelabs.xyz']
      };
    }
  }

  /**
   * Check if an email is a super admin
   */
  async isSuperAdmin(email: string): Promise<boolean> {
    const config = await this.getAdminEmailConfig();
    return config.super_admin_emails.includes(email);
  }

  /**
   * Check if an email is a brand admin
   */
  async isBrandAdmin(email: string): Promise<boolean> {
    const config = await this.getAdminEmailConfig();
    return config.brand_admin_emails.includes(email);
  }

  /**
   * Get all super admin emails
   */
  async getSuperAdminEmails(): Promise<string[]> {
    const config = await this.getAdminEmailConfig();
    return config.super_admin_emails;
  }

  /**
   * Get all brand admin emails
   */
  async getBrandAdminEmails(): Promise<string[]> {
    const config = await this.getAdminEmailConfig();
    return config.brand_admin_emails;
  }

  /**
   * Get all webhook admin emails
   */
  async getWebhookAdminEmails(): Promise<string[]> {
    const config = await this.getAdminEmailConfig();
    return config.webhook_admin_emails;
  }

  /**
   * Update admin email configuration (super admin only)
   */
  async updateAdminEmailConfig(
    config: Partial<AdminEmailConfig>,
    userEmail: string
  ): Promise<boolean> {
    // Verify user is super admin
    if (!(await this.isSuperAdmin(userEmail))) {
      throw new Error('Unauthorized: Only super admins can update admin email configuration');
    }

    try {
      const supabase = await createServerSupabaseClient();
      
      const updates = Object.entries(config).map(([key, emails]) => ({
        key: key,
        value: JSON.stringify(emails),
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('platform_settings')
        .upsert(updates, { onConflict: 'key' });

      if (error) {
        console.error('Error updating admin email config:', error);
        throw error;
      }

      // Clear cache to force refresh
      this.cache.clear();
      
      return true;
    } catch (error) {
      console.error('Failed to update admin email config:', error);
      throw error;
    }
  }

  /**
   * Add a new super admin email
   */
  async addSuperAdmin(email: string, userEmail: string): Promise<boolean> {
    const config = await this.getAdminEmailConfig();
    if (!config.super_admin_emails.includes(email)) {
      config.super_admin_emails.push(email);
      return await this.updateAdminEmailConfig({ super_admin_emails: config.super_admin_emails }, userEmail);
    }
    return true; // Already exists
  }

  /**
   * Remove a super admin email
   */
  async removeSuperAdmin(email: string, userEmail: string): Promise<boolean> {
    const config = await this.getAdminEmailConfig();
    const filtered = config.super_admin_emails.filter(e => e !== email);
    if (filtered.length !== config.super_admin_emails.length) {
      return await this.updateAdminEmailConfig({ super_admin_emails: filtered }, userEmail);
    }
    return true; // Wasn't in the list
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const adminEmailServiceServer = AdminEmailServiceServer.getInstance();

// Export convenience functions for backward compatibility
export const isSuperAdmin = (email: string) => adminEmailServiceServer.isSuperAdmin(email);
export const isBrandAdmin = (email: string) => adminEmailServiceServer.isBrandAdmin(email);
export const getSuperAdminEmails = () => adminEmailServiceServer.getSuperAdminEmails();
export const getBrandAdminEmails = () => adminEmailServiceServer.getBrandAdminEmails();
export const getWebhookAdminEmails = () => adminEmailServiceServer.getWebhookAdminEmails();
