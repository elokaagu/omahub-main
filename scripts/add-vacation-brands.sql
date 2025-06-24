-- Add vacation-themed brands to support the vacation category
INSERT INTO public.brands (
    id,
    name,
    description,
    long_description,
    location,
    price_range,
    category,
    rating,
    is_verified,
    image
)
SELECT * FROM (
    VALUES 
    (
        'coastal-vibes',
        'Coastal Vibes',
        'Vacation and resort wear',
        'Coastal Vibes specializes in comfortable, stylish vacation wear perfect for beach destinations, resort getaways, and tropical adventures. Our collections feature breathable fabrics, vibrant prints, and relaxed silhouettes.',
        'Cape Town, South Africa',
        '$$',
        'Vacation',
        4.5,
        true,
        '/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png'
    ),
    (
        'safari-chic',
        'Safari Chic',
        'Adventure and safari wear',
        'Safari Chic creates stylish adventure wear for the modern explorer. From safari expeditions to city escapes, our pieces combine functionality with African-inspired design elements.',
        'Nairobi, Kenya',
        '$$',
        'Vacation',
        4.6,
        true,
        '/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png'
    ),
    (
        'island-escape',
        'Island Escape',
        'Beach and island vacation wear',
        'Island Escape designs effortless vacation pieces inspired by tropical islands and coastal living. Our collections feature flowing fabrics, ocean-inspired colors, and versatile pieces that transition from beach to dinner.',
        'Zanzibar, Tanzania',
        '$$',
        'Vacation',
        4.7,
        true,
        '/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png'
    )
) AS vacation_brands(id, name, description, long_description, location, price_range, category, rating, is_verified, image)
WHERE NOT EXISTS (
    SELECT 1 FROM public.brands WHERE id = vacation_brands.id
);

-- Verify the vacation brands were added
SELECT id, name, category, location FROM public.brands WHERE category = 'Vacation'; 