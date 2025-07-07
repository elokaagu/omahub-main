-- Insert sample brands if they don't exist
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
        'imad-eduso',
        'Imad Eduso',
        'Luxury bridal wear',
        'Luxury bridal wear with a modern African twist.',
        'Lagos',
        '$$$',
        'Bridal',
        5.0,
        true,
        '/lovable-uploads/57cc6a40-0f0d-4a7d-8786-41f15832ebfb.png'
    ),
    (
        'adiree',
        'Adiree',
        'Contemporary African fashion',
        'Adiree creates contemporary fashion with African inspiration.',
        'Lagos',
        '$$',
        'Ready to Wear',
        4.8,
        true,
        '/lovable-uploads/4a7c7e86-6cde-4d07-a246-a5aa4cb6fa51.png'
    ),
    (
        'emmy-kasbit',
        'Emmy Kasbit',
            'Contemporary tailored',
    'Contemporary tailored with a focus on quality and detail.',
        'Accra',
        '$$',
        'Tailored',
        4.6,
        true,
        '/lovable-uploads/99ca757a-bed8-422e-b155-0b9d365b58e0.png'
    ),
    (
        'shekudo',
        'Shekudo',
        'Handcrafted accessories',
        'Handcrafted accessories made with local materials.',
        'Nairobi',
        '$$',
        'Accessories',
        4.7,
        true,
        '/lovable-uploads/25c3fe26-3fc4-43ef-83ac-6931a74468c0.png'
    )
) AS sample_brands
WHERE NOT EXISTS (
    SELECT 1 FROM public.brands WHERE id = sample_brands.id
);

-- Verify the data
SELECT id, name, category FROM public.brands; 