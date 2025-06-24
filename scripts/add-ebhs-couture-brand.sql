-- Add Ebhs Couture brand to the database
-- This fixes the contact form issue where the brand doesn't exist

INSERT INTO brands (
    id, 
    name, 
    description, 
    long_description,
    category,
    location, 
    price_range, 
    contact_email, 
    contact_phone, 
    website, 
    instagram,
    rating,
    is_verified,
    image,
    created_at
)
VALUES (
    'ebhs-couture',
    'Ebhs Couture',
    'Exquisite couture designs for the modern woman, blending traditional craftsmanship with contemporary elegance.',
    'Ebhs Couture creates show stopping pieces that celebrate the modern woman. Our designs blend traditional African craftsmanship with contemporary silhouettes, using luxurious fabrics and intricate details. Each piece is meticulously crafted to make you feel confident and beautiful for any special occasion.',
    'Fashion Designer',
    'Abuja, Nigeria',
    '₦50,000 - ₦500,000',
    'hello@ebhscouture.com',
    '+234-803-123-4567',
    'https://ebhscouture.com',
    '@ebhscouture',
    4.8,
    true,
    'https://gqwduyodzqgucjscilvz.supabase.co/storage/v1/object/public/brand-assets/brands/ebhs-couture-hero.jpg',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    long_description = EXCLUDED.long_description,
    category = EXCLUDED.category,
    location = EXCLUDED.location,
    price_range = EXCLUDED.price_range,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    website = EXCLUDED.website,
    instagram = EXCLUDED.instagram,
    rating = EXCLUDED.rating,
    is_verified = EXCLUDED.is_verified,
    image = EXCLUDED.image,
    updated_at = NOW(); 