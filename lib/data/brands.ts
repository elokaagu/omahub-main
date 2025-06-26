export interface Review {
  author: string;
  comment: string;
  rating: number;
  date: string;
}

export interface Collection {
  id: string | number;
  title: string;
  image: string;
  description?: string;
}

export interface BrandData {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  location: string;
  priceRange: string;
  category: string;
  rating: number;
  isVerified: boolean;
  image: string;
  collections: Collection[];
  // Contact information
  website?: string;
  instagram?: string;
  whatsapp?: string;
  contact_email?: string;
}

export const brandsData: Record<string, BrandData> = {
  "adire-designs": {
    id: "adire-designs",
    name: "Adire Designs",
    description:
      "Founded in 2015, Adire Designs specializes in contemporary ready to wear pieces that incorporate traditional Nigerian adire textile techniques. Each piece celebrates the rich cultural heritage of Yoruba textile art while embracing modern silhouettes and styling.",
    longDescription:
      "Adire Designs works closely with local artisans in Abeokuta, Nigeria, to create authentic adire fabrics using traditional indigo dyeing methods that have been passed down through generations. The brand is committed to preserving these ancient techniques while innovating through contemporary design applications.\n\nTheir collections feature a range of ready to wear pieces from casual daywear to elegant evening options, all characterized by the distinctive patterns and rich blue hues of traditional adire. The brand has gained recognition for successfully bridging the gap between cultural heritage and modern fashion sensibilities.",
    location: "Lagos, Nigeria",
    priceRange: "₦15,000 - ₦120,000",
    category: "Ready to Wear",
    rating: 4.8,
    isVerified: true,
    image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
    whatsapp: "+234 803 123 4567",
    instagram: "@adiredesigns",
    website: "https://adiredesigns.com",
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
    id: "zora-atelier",
    name: "Zora Atelier",
    description:
      "Zora Atelier creates unique bridal pieces that blend contemporary design with African craftsmanship. Each gown is meticulously crafted to celebrate the beauty of African brides.",
    longDescription:
      "Founded in 2018 by renowned designer Zora Mbeki, Zora Atelier has quickly established itself as a premier bridal design house in Nairobi. The brand seamlessly integrates traditional African beadwork, textiles, and embroidery techniques with modern silhouettes and innovative design.\n\nEach bridal piece is custom-made, starting with an in-depth consultation with the bride to understand her vision, personal style, and cultural background. The atelier prides itself on creating gowns that honor both heritage and individual expression, resulting in truly unique wedding attire.\n\nThe brand has gained international recognition for its ability to create cross-cultural pieces that resonate with modern brides while honoring African design traditions.",
    location: "Nairobi, Kenya",
    priceRange: "KSh 150,000 - KSh 850,000",
    category: "Bridal",
    rating: 4.9,
    isVerified: true,
    image: "/lovable-uploads/41fa65eb-36f2-4987-8c7b-a267b4d0e938.png",
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
  "algiers-style": {
    id: "algiers-style",
    name: "Algiers Style",
    description:
      "Algiers Style crafts exquisite bridal wear that combines North African traditional craftsmanship with contemporary silhouettes, creating unforgettable pieces for the modern bride.",
    longDescription:
      "Established in 2015 by Algerian designer Leila Benali, Algiers Style has become North Africa's premier destination for luxury bridal wear. The brand is known for its intricate handwork, including traditional Algerian embroidery techniques that have been practiced for centuries.\n\nThe atelier's signature style incorporates elements of both Eastern and Western design traditions, resulting in pieces that feel both timeless and contemporary. Their gowns often feature delicate beadwork, hand-embroidered details, and sumptuous textiles sourced from across the Mediterranean region.\n\nThe brand's workshop in Algiers employs over twenty skilled artisans, many of whom come from families with generations of experience in textile arts. This commitment to preserving traditional craft while embracing innovation has earned Algiers Style clients from across Africa, Europe, and the Middle East.",
    location: "Algiers, Algeria",
    priceRange: "DA 250,000 - DA 1,200,000",
    category: "Bridal",
    rating: 4.5,
    isVerified: true,
    image: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
    collections: [
      {
        id: 1,
        title: "Mediterranean Dreams",
        image: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
      },
      {
        id: 2,
        title: "Casbah Collection",
        image: "/lovable-uploads/abb12cfd-a40d-4890-bfd6-76feb4764069.png",
      },
      {
        id: 3,
        title: "Modern Oasis",
        image: "/lovable-uploads/8bd685d2-cad8-4639-982a-cb5c7087443c.png",
      },
    ],
  },
  "cairo-couture": {
    id: "cairo-couture",
    name: "Cairo Couture",
    description:
      "Cairo Couture creates luxury bridal wear that combines Egyptian heritage with contemporary design, specializing in intricate beadwork and embroidery that celebrates Middle Eastern artistry.",
    longDescription:
      "Cairo Couture was founded in 2010 by Egyptian designer Nour El Masri after training at prestigious fashion schools in Paris and Milan. The brand has established itself as a leader in luxury bridal wear across North Africa and the Middle East.\n\nDrawing inspiration from Egypt's rich architectural and artistic heritage, Cairo Couture creates gowns that feature intricate beadwork, detailed embroidery, and delicate appliqués. Each piece is handcrafted in their Cairo atelier by skilled artisans who specialize in traditional techniques passed down through generations.\n\nThe brand is known for its meticulous attention to detail, with some bridal gowns requiring over 1,000 hours of handwork to complete. This dedication to craftsmanship has attracted an elite clientele, including celebrities and royal family members from across the region.",
    location: "Cairo, Egypt",
    priceRange: "EGP 50,000 - EGP 500,000",
    category: "Bridal",
    rating: 4.8,
    isVerified: true,
    image: "/lovable-uploads/592425d5-0327-465c-990c-c63a73645792.png",
    collections: [
      {
        id: 1,
        title: "Pharaonic Elegance",
        image: "/lovable-uploads/592425d5-0327-465c-990c-c63a73645792.png",
      },
      {
        id: 2,
        title: "Nile Goddess",
        image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
      },
      {
        id: 3,
        title: "Modern Cairo",
        image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
      },
    ],
  },
  "lagos-bridal": {
    id: "lagos-bridal",
    name: "Lagos Bridal House",
    description:
      "Lagos Bridal House is a premier bridal atelier specialising in bespoke wedding gowns and formal wear. Founded in 2015 by renowned designer Adunni Ade, the brand has become synonymous with elegance, craftsmanship, and luxury. Lagos Bridal House offers a fully customised experience, with multiple consultations to ensure that each bride's vision is perfectly realised.",
    longDescription:
      "Founded in 2017 by designer duo Folake and Tunde Adeleke, Lagos Bridal House has quickly become Nigeria's premier destination for bespoke bridal wear. The brand specialises in creating wedding attire that honours the rich cultural heritage of Nigeria while incorporating contemporary design elements.\n\nThe brand is known for its innovative use of traditional Nigerian textiles such as aso-oke, adire, and akwete, which are masterfully incorporated into modern silhouettes. Their designs often feature intricate beadwork and embroidery that tell stories of the couple's heritage and personal journey.\n\nLagos Bridal House offers a fully customised experience, with multiple consultations to ensure that each bride's vision is perfectly realised. Their flagship atelier in Victoria Island serves as both a studio and a creative hub where brides can explore various design possibilities.",
    location: "Lagos, Nigeria",
    priceRange: "₦300,000 - ₦2,500,000",
    category: "Bridal",
    rating: 4.7,
    isVerified: true,
    image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
    whatsapp: "+234 901 234 5678",
    instagram: "@lagosbridal",
    collections: [
      {
        id: 1,
        title: "Lagos Royalty",
        image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
      },
      {
        id: 2,
        title: "Ancestral Heritage",
        image: "/lovable-uploads/8bd685d2-cad8-4639-982a-cb5c7087443c.png",
      },
      {
        id: 3,
        title: "Contemporary Bride",
        image: "/lovable-uploads/abb12cfd-a40d-4890-bfd6-76feb4764069.png",
      },
    ],
  },
  "dakar-fashion": {
    id: "dakar-fashion",
    name: "Dakar Fashion House",
    description:
      "Dakar Fashion House creates bold ready-to-wear collections that celebrate Senegalese textiles and patterns with a contemporary twist, bringing West African style to global audiences.",
    longDescription:
      "Established in 2016 by Senegalese designer Marie Seck, Dakar Fashion House has become known for its innovative approach to West African fashion. The brand celebrates the rich textile traditions of Senegal while infusing designs with contemporary sensibilities that appeal to global consumers.\n\nThe label is particularly noted for its use of vibrant wax prints and hand-woven fabrics sourced directly from artisan communities across Senegal. Each collection tells a story of cultural heritage while pushing the boundaries of African fashion forward.\n\nDakar Fashion House maintains ethical production practices, working closely with local artisans and ensuring fair wages and sustainable processes. This commitment to both tradition and ethical innovation has earned the brand recognition at fashion weeks across Africa and Europe.",
    location: "Dakar, Senegal",
    priceRange: "XOF 20,000 - XOF 200,000",
    category: "Ready to Wear",
    rating: 4.7,
    isVerified: true,
    image: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
    collections: [
      {
        id: 1,
        title: "Teranga Collection",
        image: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
      },
      {
        id: 2,
        title: "Urban Dakar",
        image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
      },
      {
        id: 3,
        title: "Coastal Dreams",
        image: "/lovable-uploads/8bd685d2-cad8-4639-982a-cb5c7087443c.png",
      },
    ],
  },
  "nairobi-couture": {
    id: "nairobi-couture",
    name: "Nairobi Couture",
    description:
      "Nairobi Couture delivers sophisticated ready-to-wear collections inspired by Kenya's diverse cultures and landscapes, offering elevated everyday fashion with an East African perspective.",
    longDescription:
      "Founded in 2014 by Kenyan designer Wanjiru Karani, Nairobi Couture has established itself as a leading voice in East African fashion. The brand creates ready-to-wear collections that celebrate Kenya's cultural diversity and natural beauty while maintaining a contemporary, cosmopolitan aesthetic.\n\nThe label draws inspiration from Kenya's varied landscapes – from the bustling energy of Nairobi to the serene majesty of the savannah – translating these influences into wearable, sophisticated garments. Their signature style combines clean lines with subtle cultural references and unexpected details.\n\nNairobi Couture is committed to local production, with all pieces manufactured in their Nairobi workshop where they provide employment and training opportunities for local talent. The brand has gained recognition for elevating East African fashion on the global stage, with features in international fashion publications and a growing global clientele.",
    location: "Nairobi, Kenya",
    priceRange: "KSh 5,000 - KSh 50,000",
    category: "Ready to Wear",
    rating: 4.6,
    isVerified: true,
    image: "/lovable-uploads/6f7a1022-2d82-4fb9-9365-6455df679707.png",
    collections: [
      {
        id: 1,
        title: "Urban Safari",
        image: "/lovable-uploads/6f7a1022-2d82-4fb9-9365-6455df679707.png",
      },
      {
        id: 2,
        title: "Nairobi Nights",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
      {
        id: 3,
        title: "Serengeti Dreams",
        image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
      },
    ],
  },
  "accra-fashion": {
    id: "accra-fashion",
    name: "Accra Fashion",
    description:
      "Accra Fashion creates vibrant ready-to-wear collections that blend traditional Ghanaian textiles and motifs with contemporary silhouettes, perfect for the modern West African lifestyle.",
    longDescription:
      "Established in 2015 by Ghanaian designer Kofi Ansah, Accra Fashion has become one of Ghana's most celebrated ready-to-wear brands. The label is known for its innovative use of traditional Ghanaian textiles, including kente and fugu, reimagined for contemporary wardrobes.\n\nThe brand's aesthetic celebrates the vibrant spirit of Accra, with bold colors, graphic patterns, and playful silhouettes that transition seamlessly from day to evening. While deeply rooted in Ghanaian culture, the designs have a universal appeal that has attracted customers from across Africa and beyond.\n\nAccra Fashion maintains a commitment to ethical production and supports local textile industries by sourcing fabrics directly from Ghanaian weavers and printers. The brand's flagship store in Accra has become a destination for fashion enthusiasts seeking authentic yet modern African design.",
    location: "Accra, Ghana",
    priceRange: "GHS 300 - GHS 3,000",
    category: "Ready to Wear",
    rating: 4.8,
    isVerified: true,
    image: "/lovable-uploads/abb12cfd-a40d-4890-bfd6-76feb4764069.png",
    collections: [
      {
        id: 1,
        title: "Osu Collection",
        image: "/lovable-uploads/abb12cfd-a40d-4890-bfd6-76feb4764069.png",
      },
      {
        id: 2,
        title: "Adinkra Series",
        image: "/lovable-uploads/840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
      },
      {
        id: 3,
        title: "Contemporary Kente",
        image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
      },
    ],
  },
  afrochic: {
    id: "afrochic",
    name: "AfroChic",
    description:
      "AfroChic creates contemporary ready-to-wear fashion that celebrates the diversity of African prints and textiles, offering modern silhouettes with a distinctive pan-African aesthetic.",
    longDescription:
      "Launched in 2018 by designer Aminata Diop, AfroChic has quickly established itself as an innovative ready-to-wear brand that celebrates African textile traditions with a modern, cosmopolitan sensibility. Based in Dakar but with a pan-African approach, the brand incorporates influences and materials from across the continent.\n\nAfroChic is known for its bold use of colour, innovative pattern mixing, and versatile pieces that transition effortlessly from casual to formal settings. The brand's aesthetic appeals to confident individuals who appreciate African design but seek contemporary silhouettes and styling.\n\nCommitted to sustainability, AfroChic works with local artisan communities across West Africa to source traditionally made textiles while implementing eco-friendly practices in their production process. This commitment to both cultural heritage and environmental responsibility has helped the brand connect with conscious consumers worldwide.",
    location: "Dakar, Senegal",
    priceRange: "XOF 15,000 - XOF 150,000",
    category: "Ready to Wear",
    rating: 4.7,
    isVerified: false,
    image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
    collections: [
      {
        id: 1,
        title: "Urban Africa",
        image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
      },
      {
        id: 2,
        title: "Dakar to Lagos",
        image: "/lovable-uploads/592425d5-0327-465c-990c-c63a73645792.png",
      },
      {
        id: 3,
        title: "Contemporary Fusion",
        image: "/lovable-uploads/6f7a1022-2d82-4fb9-9365-6455df679707.png",
      },
    ],
  },
  "tunis-tailors": {
    id: "tunis-tailors",
    name: "Tunis Master Tailors",
    description:
      "Tunis Master Tailors offers bespoke tailoring services that blend Mediterranean and North African influences, creating impeccably crafted garments with a distinctly Tunisian sensibility.",
    longDescription:
      "Founded in 1985 by master tailor Hamid Benali and now led by his son Karim, Tunis Master Tailors represents over three decades of excellence in bespoke tailoring. The atelier has built a reputation for exceptional craftsmanship that honors traditional Tunisian tailoring techniques while embracing contemporary styling.\n\nThe brand specializes in made-to-measure menswear, including suits, shirts, and formal wear that blend Mediterranean elegance with subtle North African details. Each garment is handcrafted in their Tunis workshop, where a team of skilled tailors – many of whom have been with the company for decades – ensure uncompromising quality.\n\nTunis Master Tailors sources fine fabrics from both European mills and local producers, offering clients an extensive selection of materials that range from classic wool suitings to lightweight linens perfect for the North African climate. Their commitment to personalized service includes multiple fittings to achieve the perfect fit.",
    location: "Tunis, Tunisia",
    priceRange: "TND 800 - TND 5,000",
    category: "Tailoring",
    rating: 4.9,
    isVerified: true,
    image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
    collections: [
      {
        id: 1,
        title: "Mediterranean Collection",
        image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
      },
      {
        id: 2,
        title: "Medina Formal Wear",
        image: "/lovable-uploads/41fa65eb-36f2-4987-8c7b-a267b4d0e938.png",
      },
      {
        id: 3,
        title: "Carthage Capsule",
        image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
      },
    ],
  },
  "casablanca-cuts": {
    id: "casablanca-cuts",
    name: "Casablanca Cuts",
    description:
      "Casablanca Cuts offers bespoke tailoring that combines Moroccan craftsmanship with contemporary fashion. Their pieces feature clean lines and impeccable attention to detail.",
    longDescription:
      "Founded in 2019 by master tailor Hassan El Fassi, Casablanca Cuts has established itself as Morocco's leading bespoke tailoring house. The atelier combines traditional Moroccan craftsmanship with modern tailoring techniques to create garments of exceptional quality.\n\nTheir workshop in Casablanca brings together skilled artisans who specialize in both traditional and contemporary tailoring methods. Each piece is meticulously crafted to the client's specifications, ensuring perfect fit and superior quality.\n\nThe brand is particularly known for its innovative approach to menswear, offering traditional Moroccan garments with a modern twist as well as contemporary suits that incorporate subtle elements of Moroccan design. This unique fusion has attracted a diverse clientele, from business professionals to cultural creatives seeking something beyond conventional tailoring.",
    location: "Casablanca, Morocco",
    priceRange: "MAD 5,000 - MAD 30,000",
    category: "Tailoring",
    rating: 4.8,
    isVerified: true,
    image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
    collections: [
      {
        id: 1,
        title: "Medina Modern",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
      {
        id: 2,
        title: "Atlas Collection",
        image: "/lovable-uploads/592425d5-0327-465c-990c-c63a73645792.png",
      },
      {
        id: 3,
        title: "Contemporary Moroccan",
        image: "/lovable-uploads/90f81e12-d22e-4e01-b75b-d3bad4db5e45.png",
      },
    ],
  },
  "beads-by-nneka": {
    id: "beads-by-nneka",
    name: "Beads by Nneka",
    description:
      "Beads by Nneka creates exquisite handcrafted jewelry that celebrates Nigerian heritage through contemporary designs, using traditional beading techniques passed down through generations.",
    longDescription:
      "Founded in 2017 by Nigerian artisan Nneka Okafor, Beads by Nneka has established itself as a premier handcrafted jewelry brand that honors traditional Nigerian beading techniques while creating pieces with contemporary appeal. Each item is handmade in Nneka's Abuja studio, where she leads a small team of skilled artisans.\n\nThe brand is known for its innovative use of traditional materials including coral, brass, and glass beads, often sourced locally and arranged in patterns inspired by various Nigerian cultures. While honoring traditional techniques, the designs feature modern sensibilities that appeal to fashion-forward clients globally.\n\nBeads by Nneka has gained recognition for its commitment to preserving Nigerian craft traditions while creating sustainable employment opportunities for local artisans. Each piece comes with information about its cultural inspiration, connecting wearers to the rich heritage behind their jewelry.",
    location: "Abuja, Nigeria",
    priceRange: "₦15,000 - ₦250,000",
    category: "Accessories",
    rating: 4.9,
    isVerified: true,
    image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
    whatsapp: "+234 812 345 6789",
    instagram: "@beadsbynneka",
    website: "https://beadsbynneka.com",
    collections: [
      {
        id: 1,
        title: "Royal Niger Collection",
        image: "/lovable-uploads/b3fb585e-93cf-4aa7-9204-0a1b477fcb06.png",
      },
      {
        id: 2,
        title: "Contemporary Coral",
        image: "/lovable-uploads/abb12cfd-a40d-4890-bfd6-76feb4764069.png",
      },
      {
        id: 3,
        title: "Abuja Nights",
        image: "/lovable-uploads/8bd685d2-cad8-4639-982a-cb5c7087443c.png",
      },
    ],
  },
  "marrakech-textiles": {
    id: "marrakech-textiles",
    name: "Marrakech Textiles",
    description:
      "Marrakech Textiles creates handwoven accessories that celebrate Morocco's rich textile heritage, offering contemporary interpretations of traditional patterns and techniques.",
    longDescription:
      "Established in 2015 by Moroccan designer Leila Bensouda, Marrakech Textiles has revitalized traditional Moroccan weaving techniques by creating contemporary accessories that appeal to global markets. The brand works with over fifty artisans across Morocco, preserving ancient craft traditions while providing sustainable livelihoods.\n\nThe brand specializes in handwoven scarves, shawls, and home textiles that feature intricate patterns inspired by Morocco's diverse cultural heritage. Each piece is handcrafted using traditional looms, with designs that range from classic Moroccan motifs to innovative contemporary interpretations.\n\nMarrakech Textiles places a strong emphasis on sustainable production, using natural fibers and dyes whenever possible. The brand has gained recognition for its ethical practices and for creating a bridge between traditional craftsmanship and contemporary design sensibilities.",
    location: "Marrakech, Morocco",
    priceRange: "MAD 300 - MAD 3,000",
    category: "Accessories",
    rating: 4.7,
    isVerified: false,
    image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
    collections: [
      {
        id: 1,
        title: "Atlas Mountain Collection",
        image: "/lovable-uploads/ee92bbfa-4f54-4567-b4ef-8aebd0bca695.png",
      },
      {
        id: 2,
        title: "Medina Series",
        image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
      },
      {
        id: 3,
        title: "Desert Inspirations",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
    ],
  },
};
