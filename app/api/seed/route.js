import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Import sample data
const brandsData = {
  "adire-designs": {
    name: "Adire Designs",
    description:
      "Founded in 2015, Adire Designs specializes in contemporary ready to wear pieces that incorporate traditional Nigerian adire textile techniques. Each piece celebrates the rich cultural heritage of Yoruba textile art while embracing modern silhouettes and styling.",
    longDescription:
      "Adire Designs works closely with local artisans in Abeokuta, Nigeria, to create authentic adire fabrics using traditional indigo dyeing methods that have been passed down through generations. The brand is committed to preserving these ancient techniques while innovating through contemporary design applications.\n\nTheir collections feature a range of ready to wear pieces from casual daywear to elegant evening options, all characterized by the distinctive patterns and rich blue hues of traditional adire. The brand has gained recognition for successfully bridging the gap between cultural heritage and modern fashion sensibilities.",
    location: "Lagos, Nigeria",
    priceRange: "₦15,000 - ₦120,000",
    category: "Ready to Wear",
    rating: 4.8,
    reviews: [
      {
        author: "Ngozi Okafor",
        comment:
          "Absolutely stunning designs! The quality of the adire fabric is exceptional, and the fit is perfect. I always get compliments when I wear my Adire Designs piece.",
        rating: 5,
        date: "2024-03-15",
      },
      {
        author: "Chike Obi",
        comment:
          "I love how Adire Designs blends traditional techniques with modern styles. Their clothing is unique and makes a statement. Highly recommend!",
        rating: 4,
        date: "2024-02-28",
      },
      {
        author: "Aisha Bello",
        comment:
          "The customer service was excellent, and I received my order quickly. The adire top I purchased is beautiful and well-made. Will definitely be buying more!",
        rating: 5,
        date: "2024-01-10",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Summer 2023 Collection",
        image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
      },
      {
        id: 2,
        title: "Adire Heritage Line",
        image: "/lovable-uploads/840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
      },
      {
        id: 3,
        title: "Modern Classics",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
    ],
  },
  "zora-atelier": {
    name: "Zora Atelier",
    description:
      "Zora Atelier creates unique bridal pieces that blend contemporary design with African craftsmanship. Each gown is meticulously crafted to celebrate the beauty of African brides.",
    longDescription:
      "Founded in 2018 by renowned designer Zora Mbeki, Zora Atelier has quickly established itself as a premier bridal design house in Nairobi. The brand seamlessly integrates traditional African beadwork, textiles, and embroidery techniques with modern silhouettes and innovative design.\n\nEach bridal piece is custom-made, starting with an in-depth consultation with the bride to understand her vision, personal style, and cultural background. The atelier prides itself on creating gowns that honor both heritage and individual expression, resulting in truly unique wedding attire.\n\nThe brand has gained international recognition for its ability to create cross-cultural pieces that resonate with modern brides while honoring African design traditions.",
    location: "Nairobi, Kenya",
    priceRange: "KSh 150,000 - KSh 850,000",
    category: "Bridal",
    rating: 4.9,
    reviews: [
      {
        author: "Amara Okafor",
        comment:
          "I cannot express how special my wedding gown from Zora Atelier was. The attention to detail and the way they incorporated my Nigerian heritage into the design made me feel both modern and connected to my roots.",
        rating: 5,
        date: "2023-12-05",
      },
      {
        author: "Nadia Kimathi",
        comment:
          "My experience with Zora Atelier was exceptional from start to finish. They really listened to what I wanted and created a gown beyond my dreams. Worth every shilling!",
        rating: 5,
        date: "2024-02-18",
      },
      {
        author: "Fatima Ndongo",
        comment:
          "The craftsmanship and quality of my dress was incredible. The team was so patient during fittings and made the process stress-free. My only small critique would be that the final delivery was cutting it close to my wedding date.",
        rating: 4.5,
        date: "2024-01-10",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Celestial Bride 2023",
        image: "/lovable-uploads/41fa65eb-36f2-4987-8c7b-a267b4d0e938.png",
      },
      {
        id: 2,
        title: "Heritage Collection",
        image: "/lovable-uploads/6f7a1022-2d82-4fb9-9365-6455df679707.png",
      },
      {
        id: 3,
        title: "Modern Royalty",
        image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
      },
    ],
  },
  "kente-collective": {
    name: "Kente Collective",
    description:
      "Authentic Ghanaian kente accessories and home decor crafted by skilled artisans using traditional techniques and designs.",
    longDescription:
      "Kente Collective was established in 2016 to preserve and promote authentic Ghanaian kente craftsmanship while creating economic opportunities for traditional weavers. All products are handwoven using centuries-old techniques by artisans in the Ashanti and Volta regions of Ghana.",
    location: "Accra, Ghana",
    priceRange: "GH₵100 - GH₵2,000",
    category: "Accessories",
    rating: 4.7,
    reviews: [
      {
        author: "Kwame Asante",
        comment:
          "The kente stole I purchased for my graduation was absolutely beautiful. The craftsmanship is exceptional.",
        rating: 5,
        date: "2023-12-18",
      },
      {
        author: "Michelle Johnson",
        comment:
          "I bought several items as gifts and was impressed by both the quality and the beautiful packaging.",
        rating: 4,
        date: "2024-01-30",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Heritage Collection",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
      {
        id: 2,
        title: "Modern Accents",
        image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
      },
    ],
  },
  "mbali-studio": {
    name: "Mbali Studio",
    description:
      "Contemporary ready-to-wear fashion celebrating South African aesthetics with a focus on ethical production and sustainable practices.",
    longDescription:
      "Founded in 2017 by designer Mbali Ndlovu, the brand creates minimalist yet distinctive pieces inspired by South Africa's diverse cultural landscape and natural environment.",
    location: "Johannesburg, South Africa",
    priceRange: "R800 - R5,000",
    category: "Ready to Wear",
    rating: 4.6,
    reviews: [
      {
        author: "Thandi Mbeki",
        comment:
          "The quality and fit of Mbali Studio pieces are exceptional. I appreciate their commitment to sustainability.",
        rating: 5,
        date: "2024-02-10",
      },
      {
        author: "Jessica Taylor",
        comment:
          "Beautiful designs that transition well from work to evening. My only wish is that they offered more size options.",
        rating: 4,
        date: "2023-11-25",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Winter 2023",
        image: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
      },
      {
        id: 2,
        title: "Cape Town Capsule",
        image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
      },
    ],
  },
};

// For security, use a secure seed key
const SEED_KEY = process.env.SEED_KEY || "secure-seed-key-for-database";

export async function GET(request) {
  // Add security to prevent unauthorized seeding
  const { searchParams } = new URL(request.url);
  const seedKey = searchParams.get("key");

  if (seedKey !== SEED_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Supabase credentials not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Starting data migration to Supabase...");
    const results = { brands: [], reviews: [], collections: [] };

    // Migrate brands
    for (const [id, brand] of Object.entries(brandsData)) {
      console.log(`Migrating brand: ${brand.name}`);

      // Check if brand already exists
      const { data: existingBrand } = await supabase
        .from("brands")
        .select("id")
        .eq("id", id)
        .single();

      if (existingBrand) {
        console.log(`Brand ${id} already exists, skipping...`);
        continue;
      }

      // Insert brand
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .insert({
          id,
          name: brand.name,
          description: brand.description,
          long_description: brand.longDescription,
          location: brand.location,
          price_range: brand.priceRange,
          category: brand.category,
          rating: brand.rating,
          is_verified: brand.isVerified,
          image: brand.collections[0]?.image || "",
        })
        .select()
        .single();

      if (brandError) {
        console.error(`Error inserting brand ${id}:`, brandError);
        continue;
      }

      results.brands.push(brandData);

      // Migrate reviews
      for (const review of brand.reviews) {
        const { data: reviewData, error: reviewError } = await supabase
          .from("reviews")
          .insert({
            brand_id: id,
            author: review.author,
            comment: review.comment,
            rating: review.rating,
            date: review.date,
          })
          .select();

        if (reviewError) {
          console.error(`Error inserting review for ${id}:`, reviewError);
        } else if (reviewData) {
          results.reviews.push(reviewData[0]);
        }
      }

      // Migrate collections
      for (const collection of brand.collections) {
        const { data: collectionData, error: collectionError } = await supabase
          .from("collections")
          .insert({
            brand_id: id,
            title: collection.title,
            image: collection.image,
          })
          .select();

        if (collectionError) {
          console.error(
            `Error inserting collection for ${id}:`,
            collectionError
          );
        } else if (collectionData) {
          results.collections.push(collectionData[0]);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      results: {
        brandsCount: results.brands.length,
        reviewsCount: results.reviews.length,
        collectionsCount: results.collections.length,
      },
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json(
      { error: "Failed to seed database", details: error.message },
      { status: 500 }
    );
  }
}
