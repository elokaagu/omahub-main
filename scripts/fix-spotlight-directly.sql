-- Check spotlight content status
SELECT 
    id,
    title,
    brand_name,
    is_active,
    created_at
FROM spotlight_content
ORDER BY created_at DESC;

-- If no content exists, create sample spotlight content
INSERT INTO spotlight_content (
    title,
    subtitle,
    brand_name,
    brand_description,
    brand_quote,
    brand_quote_author,
    main_image,
    video_url,
    video_thumbnail,
    video_type,
    video_description,
    featured_products,
    brand_link,
    is_active
) VALUES (
    'Featured Designer',
    'Discover exceptional craftsmanship',
    'Elegant Couture',
    'Specializing in bespoke evening wear and bridal collections with over 10 years of experience in luxury fashion.',
    'Fashion is about expressing your unique story through timeless elegance',
    'Sarah Johnson, Creative Director',
    '/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png',
    NULL,
    NULL,
    NULL,
    NULL,
    '[
        {
            "name": "Evening Gown",
            "collection": "Midnight Collection",
            "image": "/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png"
        },
        {
            "name": "Cocktail Dress",
            "collection": "Urban Chic",
            "image": "/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png"
        }
    ]'::jsonb,
    '/brand/elegant-couture',
    true
)
ON CONFLICT DO NOTHING;

-- Ensure only one spotlight is active at a time
UPDATE spotlight_content 
SET is_active = false 
WHERE is_active = true;

-- Activate the most recent spotlight content
UPDATE spotlight_content 
SET is_active = true 
WHERE id = (
    SELECT id 
    FROM spotlight_content 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- Verify the result
SELECT 
    id,
    title,
    brand_name,
    is_active,
    created_at
FROM spotlight_content
WHERE is_active = true; 