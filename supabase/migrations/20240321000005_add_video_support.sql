-- Add video support to spotlight_content table
ALTER TABLE spotlight_content 
ADD COLUMN video_url TEXT,
ADD COLUMN video_thumbnail TEXT,
ADD COLUMN video_type TEXT CHECK (video_type IN ('brand_campaign', 'behind_scenes', 'interview', 'product_demo')),
ADD COLUMN video_description TEXT;

-- Add video support to products table
ALTER TABLE products 
ADD COLUMN video_url TEXT,
ADD COLUMN video_thumbnail TEXT,
ADD COLUMN video_type TEXT CHECK (video_type IN ('product_demo', 'styling_guide', 'behind_scenes', 'campaign')),
ADD COLUMN video_description TEXT;

-- Add comment to document the video fields
COMMENT ON COLUMN spotlight_content.video_url IS 'URL to brand campaign, interview, or behind-the-scenes video';
COMMENT ON COLUMN spotlight_content.video_thumbnail IS 'Thumbnail image for the video (fallback to main_image if not provided)';
COMMENT ON COLUMN spotlight_content.video_type IS 'Type of video content: brand_campaign, behind_scenes, interview, product_demo';
COMMENT ON COLUMN spotlight_content.video_description IS 'Description or caption for the video content';

COMMENT ON COLUMN products.video_url IS 'URL to product demonstration or styling video';
COMMENT ON COLUMN products.video_thumbnail IS 'Thumbnail image for the video (fallback to main product image if not provided)';
COMMENT ON COLUMN products.video_type IS 'Type of video content: product_demo, styling_guide, behind_scenes, campaign';
COMMENT ON COLUMN products.video_description IS 'Description or caption for the video content'; 