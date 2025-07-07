const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  console.log("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample brands for missing tailored categories
const missingTailoredBrands = [
  // Bridal brands
  {
    id: "bridal-brand-1",
    name: "Eternal Bridal",
    category: "Bridal",
    location: "Lagos, Nigeria",
    description: "Exquisite bridal wear and wedding dress specialists",
    image:
      "https://images.unsplash.com/photo-1594736797933-d0acc4d1dd4f?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.9,
    contact_email: "info@eternalbridal.com",
    whatsapp: "+234123456801",
  },
  {
    id: "bridal-brand-2",
    name: "Bliss Bridal Couture",
    category: "Bridal",
    location: "Abuja, Nigeria",
    description: "Custom bridal gowns and wedding party attire",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.8,
    contact_email: "hello@blissbridalcouture.com",
    whatsapp: "+234123456802",
  },

  // Custom Design brands
  {
    id: "custom-design-1",
    name: "Artisan Designs",
    category: "Custom Design",
    location: "Lagos, Nigeria",
    description: "Bespoke fashion design and custom clothing creation",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.7,
    contact_email: "create@artisandesigns.com",
    whatsapp: "+234123456803",
  },
  {
    id: "custom-design-2",
    name: "Signature Atelier",
    category: "Custom Design",
    location: "Port Harcourt, Nigeria",
    description: "One-of-a-kind custom pieces tailored to your vision",
    image:
      "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.6,
    contact_email: "info@signatureatelier.com",
    whatsapp: "+234123456804",
  },

  // Evening Gowns brands
  {
    id: "evening-gowns-1",
    name: "Glamour Evenings",
    category: "Evening Gowns",
    location: "Lagos, Nigeria",
    description: "Elegant evening wear and formal gowns for special occasions",
    image:
      "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.8,
    contact_email: "info@glamourevenings.com",
    whatsapp: "+234123456805",
  },
  {
    id: "evening-gowns-2",
    name: "Noir Elegance",
    category: "Evening Gowns",
    location: "Abuja, Nigeria",
    description: "Sophisticated evening wear with contemporary African flair",
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.7,
    contact_email: "hello@noireglegance.com",
    whatsapp: "+234123456806",
  },

  // Alterations brands
  {
    id: "alterations-1",
    name: "Perfect Fit Alterations",
    category: "Alterations",
    location: "Lagos, Nigeria",
    description: "Professional clothing alterations and tailoring services",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.6,
    contact_email: "info@perfectfitalterations.com",
    whatsapp: "+234123456807",
  },

  // Event Wear brands
  {
    id: "event-wear-1",
    name: "Occasion Couture",
    category: "Event Wear",
    location: "Lagos, Nigeria",
    description: "Stylish attire for all special occasions and events",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.5,
    contact_email: "info@occasioncouture.com",
    whatsapp: "+234123456808",
  },
  {
    id: "event-wear-2",
    name: "Festive Fashion",
    category: "Event Wear",
    location: "Abuja, Nigeria",
    description: "Beautiful outfits for celebrations and special events",
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.4,
    contact_email: "hello@festivefashion.com",
    whatsapp: "+234123456809",
  },

  // Wedding Guest brands
  {
    id: "wedding-guest-1",
    name: "Guest Elegance",
    category: "Wedding Guest",
    location: "Lagos, Nigeria",
    description: "Perfect attire for wedding guests and ceremony attendees",
    image:
      "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.5,
    contact_email: "info@guestelegance.com",
    whatsapp: "+234123456810",
  },

  // Birthday brands
  {
    id: "birthday-1",
    name: "Celebration Styles",
    category: "Birthday",
    location: "Lagos, Nigeria",
    description: "Fabulous outfits for birthday celebrations and parties",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.3,
    contact_email: "info@celebrationstyles.com",
    whatsapp: "+234123456811",
  },

  // General Tailored brands
  {
    id: "tailored-1",
    name: "Master Tailors",
    category: "Tailored",
    location: "Lagos, Nigeria",
    description: "Expert tailoring services for all your custom clothing needs",
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.7,
    contact_email: "info@mastertailors.com",
    whatsapp: "+234123456812",
  },
  {
    id: "tailored-2",
    name: "Precision Tailoring",
    category: "Tailored",
    location: "Abuja, Nigeria",
    description: "Precise measurements and perfect fits for discerning clients",
    image:
      "https://images.unsplash.com/photo-1566479179817-c0b5b4b4b1e5?w=800&h=800&fit=crop",
    is_verified: true,
    rating: 4.6,
    contact_email: "hello@precisiontailoring.com",
    whatsapp: "+234123456813",
  },
];

async function addMissingTailoredBrands() {
  console.log("🔄 Adding brands to missing tailored categories...\n");

  try {
    // First, check current categories
    console.log("1. Checking current tailored categories...");
    const { data: currentBrands, error: fetchError } = await supabase
      .from("brands")
      .select("category")
      .not("category", "is", null);

    if (fetchError) {
      console.error("❌ Error fetching current brands:", fetchError);
      return;
    }

    const currentCategories = [
      ...new Set(currentBrands.map((b) => b.category)),
    ];
    console.log("Current categories:", currentCategories);

    // Check which tailored categories are missing
    const targetTailoredCategories = [
      "Bridal",
      "Custom Design",
      "Evening Gowns",
      "Alterations",
      "Tailored",
      "Event Wear",
      "Wedding Guest",
      "Birthday",
    ];

    const missingCategories = targetTailoredCategories.filter(
      (cat) => !currentCategories.includes(cat)
    );

    console.log("Missing tailored categories:", missingCategories);

    if (missingCategories.length === 0) {
      console.log("✅ All tailored categories already have brands!");
      return;
    }

    // Add brands for missing categories
    console.log("\n2. Adding brands for missing tailored categories...");

    for (const brand of missingTailoredBrands) {
      if (missingCategories.includes(brand.category)) {
        console.log(`Adding ${brand.name} (${brand.category})...`);

        const { error: insertError } = await supabase
          .from("brands")
          .insert(brand);

        if (insertError) {
          if (insertError.code === "23505") {
            console.log(
              `  ⚠️  Brand ${brand.name} already exists, skipping...`
            );
          } else {
            console.error(`  ❌ Error adding ${brand.name}:`, insertError);
          }
        } else {
          console.log(`  ✅ Added ${brand.name} successfully`);
        }
      }
    }

    // Verify the results
    console.log("\n3. Verifying results...");
    const { data: updatedBrands, error: verifyError } = await supabase
      .from("brands")
      .select("category")
      .not("category", "is", null);

    if (verifyError) {
      console.error("❌ Error verifying results:", verifyError);
      return;
    }

    const updatedCategories = [
      ...new Set(updatedBrands.map((b) => b.category)),
    ];
    const categoryCounts = {};
    updatedBrands.forEach((brand) => {
      categoryCounts[brand.category] =
        (categoryCounts[brand.category] || 0) + 1;
    });

    console.log("\n📊 Updated tailored category counts:");
    targetTailoredCategories.forEach((category) => {
      const count = categoryCounts[category] || 0;
      const status = count > 0 ? "✅" : "❌";
      console.log(`  ${status} ${category}: ${count} brands`);
    });

    console.log("\n✅ Missing tailored categories have been added!");
    console.log("🔄 The Tailored dropdown should now show all options.");
    console.log("💡 You may need to refresh your browser to see the changes.");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

addMissingTailoredBrands();
