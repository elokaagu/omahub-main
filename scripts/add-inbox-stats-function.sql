-- Add the missing get_inbox_stats function for the inbox system

CREATE OR REPLACE FUNCTION get_inbox_stats(admin_user_id UUID)
RETURNS TABLE (
  total_inquiries BIGINT,
  unread_inquiries BIGINT,
  replied_inquiries BIGINT,
  urgent_inquiries BIGINT,
  today_inquiries BIGINT,
  this_week_inquiries BIGINT,
  inquiries_by_type JSONB,
  inquiries_by_priority JSONB,
  inquiries_by_status JSONB
) AS $$
BEGIN
  -- Get user profile to determine access level
  DECLARE
    user_role TEXT;
    user_brands UUID[];
  BEGIN
    SELECT role, owned_brands INTO user_role, user_brands
    FROM profiles
    WHERE id = admin_user_id;
    
    -- Build base query with role-based filtering
    IF user_role = 'super_admin' THEN
      -- Super admin sees all inquiries
      RETURN QUERY
      SELECT 
        (SELECT COUNT(*) FROM inquiries)::BIGINT as total_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE status = 'unread')::BIGINT as unread_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE status = 'replied')::BIGINT as replied_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE priority = 'urgent')::BIGINT as urgent_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE DATE(created_at) = CURRENT_DATE)::BIGINT as today_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE))::BIGINT as this_week_inquiries,
        (SELECT COALESCE(jsonb_object_agg(inquiry_type, count), '{}'::jsonb) FROM (
          SELECT inquiry_type, COUNT(*) as count FROM inquiries GROUP BY inquiry_type
        ) t) as inquiries_by_type,
        (SELECT COALESCE(jsonb_object_agg(priority, count), '{}'::jsonb) FROM (
          SELECT priority, COUNT(*) as count FROM inquiries GROUP BY priority
        ) t) as inquiries_by_priority,
        (SELECT COALESCE(jsonb_object_agg(status, count), '{}'::jsonb) FROM (
          SELECT status, COUNT(*) as count FROM inquiries GROUP BY status
        ) t) as inquiries_by_status;
    ELSE
      -- Brand admin sees only their brands' inquiries
      RETURN QUERY
      SELECT 
        (SELECT COUNT(*) FROM inquiries WHERE brand_id = ANY(user_brands))::BIGINT as total_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE brand_id = ANY(user_brands) AND status = 'unread')::BIGINT as unread_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE brand_id = ANY(user_brands) AND status = 'replied')::BIGINT as replied_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE brand_id = ANY(user_brands) AND priority = 'urgent')::BIGINT as urgent_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE brand_id = ANY(user_brands) AND DATE(created_at) = CURRENT_DATE)::BIGINT as today_inquiries,
        (SELECT COUNT(*) FROM inquiries WHERE brand_id = ANY(user_brands) AND created_at >= DATE_TRUNC('week', CURRENT_DATE))::BIGINT as this_week_inquiries,
        (SELECT COALESCE(jsonb_object_agg(inquiry_type, count), '{}'::jsonb) FROM (
          SELECT inquiry_type, COUNT(*) as count FROM inquiries WHERE brand_id = ANY(user_brands) GROUP BY inquiry_type
        ) t) as inquiries_by_type,
        (SELECT COALESCE(jsonb_object_agg(priority, count), '{}'::jsonb) FROM (
          SELECT priority, COUNT(*) as count FROM inquiries WHERE brand_id = ANY(user_brands) GROUP BY priority
        ) t) as inquiries_by_priority,
        (SELECT COALESCE(jsonb_object_agg(status, count), '{}'::jsonb) FROM (
          SELECT status, COUNT(*) as count FROM inquiries WHERE brand_id = ANY(user_brands) GROUP BY status
        ) t) as inquiries_by_status;
    END IF;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_inbox_stats(UUID) TO authenticated; 