import { Button } from "@/components/ui/button";
import Link from "next/link";
import ClientBrandProfile from "@/app/brand/[id]/ClientBrandProfile";

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
  "kente-collective": {
    name: "Kente Collective",
    description:
      "Kente Collective brings Ghana's iconic kente cloth into the contemporary accessories space. Their handcrafted bags, shoes, and jewelry pieces showcase the vibrant patterns and colors of traditional kente while introducing modern functionality and design.",
    longDescription:
      "Kente Collective was established in 2018 by a group of Ghanaian designers committed to showcasing the versatility and contemporary appeal of kente cloth. Working with master weavers in the Ashanti region, they've created a range of accessories that honor traditional craftsmanship while meeting the demands of the modern fashion landscape.\n\nEach piece in their collection tells a story through pattern and color, with designs inspired by traditional kente motifs that carry symbolic meanings. The brand is particularly known for their statement handbags and bold jewelry pieces that have become favorites among fashion-forward individuals looking to make a cultural statement.\n\nBeyond aesthetics, Kente Collective is dedicated to ethical production practices and fair compensation for the artisans who create their pieces. They've established a training program that helps preserve traditional weaving techniques by passing them on to younger generations.",
    location: "Accra, Ghana",
    priceRange: "GH₵200 - GH₵1,500",
    category: "Accessories",
    rating: 4.7,
    reviews: [
      {
        author: "Ama Serwaa",
        comment:
          "I am in love with my Kente Collective bag! The colors are so vibrant, and the craftsmanship is impeccable. It's a true statement piece.",
        rating: 5,
        date: "2024-03-01",
      },
      {
        author: "Kwame Nkrumah",
        comment:
          "The Kente Collective jewelry is unique and beautifully made. I appreciate the brand's commitment to ethical production and supporting local artisans.",
        rating: 4,
        date: "2024-02-15",
      },
      {
        author: "Abena Yeboah",
        comment:
          "I bought a Kente Collective scarf as a gift, and it was a huge hit! The recipient loved the vibrant colors and the story behind the design.",
        rating: 5,
        date: "2024-01-20",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Heritage Collection",
        image: "/lovable-uploads/840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
      },
      {
        id: 2,
        title: "Modern Fusion",
        image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
      },
      {
        id: 3,
        title: "Seasonal Styles",
        image: "/lovable-uploads/fd9289e6-2522-48c1-9fe4-42842504e746.png",
      },
    ],
  },
  "zora-atelier": {
    name: "Zora Atelier",
    description:
      "Zora Atelier is redefining African bridal wear with its blend of traditional elements and contemporary bridal aesthetics. Based in Nairobi, the brand creates bespoke wedding gowns that honor East African design elements while embracing modern silhouettes.",
    longDescription:
      "Zora Atelier was founded in 2017 by bridal designer Amara Zora, whose vision was to create wedding attire that speaks to the modern African bride who wants to honor her heritage while expressing her unique personal style. The atelier specializes in custom bridal gowns that incorporate traditional textiles, beadwork, and embroidery techniques from across East Africa.\n\nEach Zora Atelier creation begins with an extensive consultation process, where the bride's personal style, cultural background, and wedding vision are carefully considered. From there, the skilled team of pattern makers, seamstresses, and embellishment specialists work to create a one-of-a-kind gown that tells the bride's story.\n\nThe brand has gained recognition for its innovative approach to bridal design, particularly for introducing modern interpretations of traditional wedding attire from different East African cultures. Their designs have been featured in several international bridal publications and are sought after by discerning brides throughout the continent and diaspora.",
    location: "Nairobi, Kenya",
    priceRange: "KSh 75,000 - KSh 500,000",
    category: "Bridal",
    rating: 5.0,
    reviews: [
      {
        author: "Imani Wanjiku",
        comment:
          "Zora Atelier created the most breathtaking wedding gown I could have ever imagined. The attention to detail and the incorporation of traditional Kenyan elements were simply stunning.",
        rating: 5,
        date: "2024-03-10",
      },
      {
        author: "Akinyi Odongo",
        comment:
          "I was so impressed with the professionalism and creativity of Zora Atelier. They truly listened to my vision and brought it to life in the most beautiful way.",
        rating: 5,
        date: "2024-02-20",
      },
      {
        author: "Fatima Hassan",
        comment:
          "Zora Atelier is a true gem in the world of bridal design. Their gowns are works of art, and their customer service is exceptional. I highly recommend them to any bride looking for a unique and unforgettable gown.",
        rating: 5,
        date: "2024-01-05",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Bridal Collection",
        image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
      },
      {
        id: 2,
        title: "Evening Wear",
        image: "/lovable-uploads/fd9289e6-2522-48c1-9fe4-42842504e746.png",
      },
      {
        id: 3,
        title: "Traditional Fusion",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
    ],
  },
  "beads-by-nneka": {
    name: "Beads by Nneka",
    description:
      "Beads by Nneka creates exquisite handcrafted jewelry that combines traditional Nigerian beadwork with contemporary design sensibilities. Each piece tells a story of cultural heritage through intricate patterns and vibrant colors.",
    longDescription:
      "Founded in 2019 by master beader Nneka Okonkwo, Beads by Nneka has quickly become one of West Africa's most sought-after jewelry brands. Drawing inspiration from centuries-old Nigerian beading traditions, particularly those of the Igbo people, each piece is meticulously handcrafted using both traditional and contemporary techniques.\n\nThe brand specializes in statement necklaces, earrings, and ceremonial pieces that blend ancestral patterns with modern aesthetics. Working with local artisans, Nneka has established a workshop that not only produces beautiful jewelry but also serves as a training center for young artists interested in preserving traditional beading techniques.\n\nBeads by Nneka sources its materials ethically, using both vintage and contemporary beads, including recycled glass beads from Ghana and authentic coral beads from Nigerian markets. The brand has gained international recognition for its commitment to sustainability and cultural preservation while creating wearable art pieces.",
    location: "Enugu, Nigeria",
    priceRange: "₦5,000 - ₦250,000",
    category: "Jewelry",
    rating: 4.9,
    reviews: [
      {
        author: "Chioma Eze",
        comment:
          "The craftsmanship of my ceremonial necklace is absolutely outstanding. Nneka's attention to detail and use of traditional patterns made it the perfect piece for my wedding.",
        rating: 5,
        date: "2024-03-12",
      },
      {
        author: "Olayinka Ademola",
        comment:
          "These pieces are wearable art! The combination of traditional beading techniques with modern design is simply brilliant.",
        rating: 5,
        date: "2024-02-25",
      },
      {
        author: "Ada Okafor",
        comment:
          "Beautiful pieces that carry cultural significance. The quality is exceptional, though the waiting time for custom pieces can be long.",
        rating: 4,
        date: "2024-01-15",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Royal Collection",
        image: "/lovable-uploads/840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
      },
      {
        id: 2,
        title: "Modern Heritage",
        image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
      },
      {
        id: 3,
        title: "Bridal Series",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
    ],
  },
  "cairo-couture": {
    name: "Cairo Couture",
    description:
      "Cairo Couture specializes in luxury evening wear and formal attire that combines Egyptian craftsmanship with contemporary haute couture. Their designs feature intricate embroidery, beadwork, and traditional motifs reimagined for the modern woman.",
    longDescription:
      "Established in 2016 by designer Nour El-Sayed, Cairo Couture has revolutionized the Egyptian fashion scene by bringing traditional craftsmanship into the contemporary luxury market. The atelier combines centuries-old Egyptian embroidery techniques with modern silhouettes and innovative materials.\n\nEach piece is created in their Cairo atelier, where master craftsmen and women work alongside contemporary fashion designers to create garments that honor Egyptian heritage while pushing the boundaries of modern design. The brand is particularly known for its evening wear featuring intricate tarkiba embroidery and beadwork inspired by ancient Egyptian motifs.\n\nCairo Couture has gained international recognition for its unique approach to luxury fashion, having dressed celebrities and dignitaries for major events worldwide. The brand maintains a strong commitment to preserving Egyptian craftsmanship by operating an apprenticeship program for young artisans.",
    location: "Cairo, Egypt",
    priceRange: "EGP 5,000 - EGP 50,000",
    category: "Haute Couture",
    rating: 4.8,
    reviews: [
      {
        author: "Yasmine Fahmy",
        comment:
          "My Cairo Couture evening gown was absolutely stunning. The embroidery work was exquisite, and the fit was perfect.",
        rating: 5,
        date: "2024-03-08",
      },
      {
        author: "Laila Hassan",
        comment:
          "The attention to detail and quality of craftsmanship is unmatched. Worth every penny for special occasions.",
        rating: 5,
        date: "2024-02-18",
      },
      {
        author: "Dina Zaki",
        comment:
          "Beautiful designs and excellent service, though the waiting time can be quite long for custom pieces.",
        rating: 4,
        date: "2024-01-25",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Evening Elegance",
        image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
      },
      {
        id: 2,
        title: "Modern Pharaoh",
        image: "/lovable-uploads/fd9289e6-2522-48c1-9fe4-42842504e746.png",
      },
      {
        id: 3,
        title: "Nile Nights",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
    ],
  },
  afrochic: {
    name: "AfroChic",
    description:
      "AfroChic is a contemporary ready to wear brand that celebrates African prints and textiles through modern, minimalist design. Their collections feature clean lines and sophisticated silhouettes that make traditional African fabrics accessible for everyday wear.",
    longDescription:
      "Founded in 2020 by Kenyan designer Maya Wanjira, AfroChic has quickly established itself as a leading voice in contemporary African fashion. The brand's philosophy centers on making African prints and textiles accessible for the modern professional woman, creating pieces that seamlessly blend into both corporate and casual wardrobes.\n\nAfroChic sources its fabrics from various African countries, working directly with textile manufacturers to create unique prints that combine traditional motifs with contemporary color palettes. The brand is known for its minimalist approach to design, letting the fabrics take center stage while maintaining clean, professional silhouettes.\n\nSustainability is a core value for AfroChic, with the brand implementing various initiatives to reduce waste and support local textile communities. They operate on a made-to-order model for many pieces, reducing excess inventory while ensuring perfect fits for their customers.",
    location: "Nairobi, Kenya",
    priceRange: "KSh 2,500 - KSh 25,000",
    category: "Ready to Wear",
    rating: 4.7,
    reviews: [
      {
        author: "Linda Ochieng",
        comment:
          "AfroChic's designs are perfect for the office. I love how they make African prints work-appropriate without losing their vibrancy.",
        rating: 5,
        date: "2024-03-05",
      },
      {
        author: "Sarah Kimani",
        comment:
          "Great quality and beautiful designs. The minimalist approach makes the pieces very versatile.",
        rating: 4,
        date: "2024-02-20",
      },
      {
        author: "Joy Mwangi",
        comment:
          "The made-to-order service ensures a perfect fit every time. Worth the wait!",
        rating: 5,
        date: "2024-01-30",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Office Edit",
        image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
      },
      {
        id: 2,
        title: "Weekend Casual",
        image: "/lovable-uploads/840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
      },
      {
        id: 3,
        title: "Evening Collection",
        image: "/lovable-uploads/fd9289e6-2522-48c1-9fe4-42842504e746.png",
      },
    ],
  },
  "mbali-studio": {
    name: "Mbali Studio",
    description:
      "Mbali Studio creates contemporary furniture and home accessories that blend South African craftsmanship with modern design principles. Each piece showcases traditional materials and techniques while maintaining a sleek, contemporary aesthetic.",
    longDescription:
      "Established in 2018 by designer Thabo Mbali, Mbali Studio has become a pioneer in contemporary African furniture design. The studio works with local artisans across South Africa to create pieces that honor traditional craftsmanship while meeting the demands of modern interior design.\n\nThe studio specializes in handcrafted furniture and decorative objects that incorporate indigenous woods, handwoven textiles, and traditional beadwork into contemporary forms. Each piece is designed to tell a story of South African heritage while functioning as a practical, modern piece of furniture or decor.\n\nMbali Studio is committed to sustainable practices, using responsibly sourced materials and supporting local craftspeople through fair trade partnerships. The studio also runs workshops to train young designers and artisans in both traditional techniques and contemporary design principles.",
    location: "Cape Town, South Africa",
    priceRange: "R2,000 - R50,000",
    category: "Home & Decor",
    rating: 4.9,
    reviews: [
      {
        author: "James van der Merwe",
        comment:
          "The craftsmanship of my Mbali Studio dining table is exceptional. It's a true piece of functional art.",
        rating: 5,
        date: "2024-03-10",
      },
      {
        author: "Nomvula Dlamini",
        comment:
          "Beautiful pieces that perfectly blend traditional elements with modern design. Worth every rand!",
        rating: 5,
        date: "2024-02-15",
      },
      {
        author: "Sophie Bennett",
        comment:
          "The attention to detail and quality of materials is outstanding. Their customer service is excellent too.",
        rating: 4,
        date: "2024-01-20",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Living Room Collection",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
      {
        id: 2,
        title: "Dining & Entertainment",
        image: "/lovable-uploads/53ab4ec9-fd54-4aa8-a292-70669af33185.png",
      },
      {
        id: 3,
        title: "Decorative Accents",
        image: "/lovable-uploads/fd9289e6-2522-48c1-9fe4-42842504e746.png",
      },
    ],
  },
  "marrakech-textiles": {
    name: "Marrakech Textiles",
    description:
      "Marrakech Textiles specializes in handwoven textiles and home furnishings that celebrate Morocco's rich weaving heritage. Their products combine traditional Berber weaving techniques with contemporary designs and color palettes.",
    longDescription:
      "Founded in 2017 by textile artist Amira Benali, Marrakech Textiles works with master weavers from various regions of Morocco to create unique textiles that honor traditional craftsmanship while appealing to contemporary tastes. The company specializes in handwoven rugs, throws, cushions, and upholstery fabrics, each piece telling a story of Morocco's diverse textile heritage.\n\nThe brand works directly with artisan cooperatives throughout Morocco, ensuring fair compensation and preserving traditional weaving techniques. Their designs incorporate ancient Berber patterns and symbols, reimagined through modern color combinations and innovative applications.\n\nMarrakech Textiles has gained international recognition for its commitment to sustainability and ethical production. They use natural dyes and locally sourced materials wherever possible, and their workshop in Marrakech serves as both a production facility and a learning center for young artisans.",
    location: "Marrakech, Morocco",
    priceRange: "MAD 500 - MAD 20,000",
    category: "Home Textiles",
    rating: 4.8,
    reviews: [
      {
        author: "Fatima El Fassi",
        comment:
          "The quality of their rugs is exceptional. The colors and patterns are even more beautiful in person.",
        rating: 5,
        date: "2024-03-15",
      },
      {
        author: "Rachel Cohen",
        comment:
          "I ordered custom cushions for my home, and they exceeded my expectations. The craftsmanship is outstanding.",
        rating: 5,
        date: "2024-02-28",
      },
      {
        author: "Karim Ziani",
        comment:
          "Beautiful products that truly represent Moroccan craftsmanship. Delivery took longer than expected but worth the wait.",
        rating: 4,
        date: "2024-01-25",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Atlas Collection",
        image: "/lovable-uploads/840e541a-b4c1-4e59-94af-89c8345e4d2d.png",
      },
      {
        id: 2,
        title: "Sahara Series",
        image: "/lovable-uploads/023ba098-0109-4738-9baf-1321bc3d2fe1.png",
      },
      {
        id: 3,
        title: "Medina Modern",
        image: "/lovable-uploads/eca14925-7de8-4100-af5d-b158ff70e951.png",
      },
    ],
  },
  "dakar-denim": {
    name: "Dakar Denim",
    description:
      "Dakar Denim revolutionizes African denim wear by combining traditional Senegalese textile patterns with contemporary denim craftsmanship. Their pieces feature unique washing techniques and hand-embroidered details that celebrate West African artistry.",
    longDescription:
      "Founded in 2019 by master tailor Moussa Sall, Dakar Denim has established itself as Africa's premier sustainable denim brand. The company combines traditional Senegalese textile patterns and motifs with modern denim craftsmanship, creating unique pieces that bridge cultural heritage with contemporary fashion.\n\nEach piece is crafted in their Dakar atelier, where local artisans use both traditional hand-embroidery techniques and modern denim manufacturing processes. The brand is particularly known for their innovative washing techniques that incorporate natural indigo dye, a practice deeply rooted in West African textile tradition.\n\nDakar Denim is committed to sustainability, using organic cotton sourced from local farmers and implementing water-saving production techniques. The brand also operates a training program for young tailors, focusing on both traditional embroidery techniques and modern denim construction methods.",
    location: "Dakar, Senegal",
    priceRange: "XOF 15,000 - XOF 150,000",
    category: "Ready to Wear",
    rating: 4.7,
    reviews: [
      {
        author: "Omar Diallo",
        comment:
          "The quality of their denim is exceptional, and the traditional embroidery details make each piece unique.",
        rating: 5,
        date: "2024-03-15",
      },
      {
        author: "Aisha Faye",
        comment:
          "Love how they blend traditional patterns with modern denim styles. Perfect fit too!",
        rating: 4,
        date: "2024-02-28",
      },
      {
        author: "Jean-Paul Seck",
        comment:
          "Great sustainable practices and beautiful craftsmanship. Shipping could be faster though.",
        rating: 4,
        date: "2024-02-10",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Heritage Collection",
        image: "/lovable-uploads/dakar-denim-heritage.png",
      },
      {
        id: 2,
        title: "Modern Basics",
        image: "/lovable-uploads/dakar-denim-basics.png",
      },
      {
        id: 3,
        title: "Artisan Series",
        image: "/lovable-uploads/dakar-denim-artisan.png",
      },
    ],
  },
  "addis-leather": {
    name: "Addis Leather",
    description:
      "Addis Leather crafts premium leather accessories and footwear using traditional Ethiopian leather-working techniques. Their products showcase the exceptional quality of Ethiopian leather while incorporating contemporary design elements.",
    longDescription:
      "Established in 2020 by leather artisan Bethlehem Tilahun, Addis Leather has quickly gained recognition for its exceptional craftsmanship and commitment to preserving Ethiopia's leather-working heritage. The brand works exclusively with premium Ethiopian leather, known globally for its unique grain and durability.\n\nTheir workshop in Addis Ababa employs master craftspeople who combine centuries-old techniques with modern design sensibilities. Each piece is handcrafted using traditional tools and methods, ensuring the highest quality and attention to detail.\n\nAddis Leather is dedicated to sustainable practices, working directly with local tanneries that use environmentally friendly processing methods. The brand also supports local communities through their apprenticeship program, training the next generation of leather artisans.",
    location: "Addis Ababa, Ethiopia",
    priceRange: "ETB 1,500 - ETB 15,000",
    category: "Accessories",
    rating: 4.8,
    reviews: [
      {
        author: "Kidist Mekonnen",
        comment:
          "The quality of their leather goods is outstanding. My bag has aged beautifully.",
        rating: 5,
        date: "2024-03-12",
      },
      {
        author: "Michael Desta",
        comment:
          "Excellent craftsmanship and attention to detail. Worth every birr!",
        rating: 5,
        date: "2024-02-25",
      },
      {
        author: "Sarah Thompson",
        comment:
          "Beautiful products that tell a story. Love supporting traditional craftsmanship.",
        rating: 4,
        date: "2024-02-05",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Classic Collection",
        image: "/lovable-uploads/addis-leather-classic.png",
      },
      {
        id: 2,
        title: "Modern Heritage",
        image: "/lovable-uploads/addis-leather-heritage.png",
      },
      {
        id: 3,
        title: "Travel Essentials",
        image: "/lovable-uploads/addis-leather-travel.png",
      },
    ],
  },
  "kampala-prints": {
    name: "Kampala Prints",
    description:
      "Kampala Prints specializes in contemporary womenswear featuring digitally designed African prints. Their collections combine traditional Ugandan motifs with modern digital printing techniques, creating unique and vibrant pieces for the modern woman.",
    longDescription:
      "Founded in 2021 by digital artist and fashion designer Grace Nakimera, Kampala Prints represents the future of African textile design. The brand uniquely combines traditional Ugandan and East African motifs with cutting-edge digital design and printing techniques.\n\nTheir studio in Kampala houses both traditional textile artists and digital designers, creating a unique fusion of old and new. Each print is digitally designed in-house, incorporating elements from Uganda's rich cultural heritage while pushing the boundaries of modern textile design.\n\nKampala Prints is committed to sustainable fashion, using eco-friendly digital printing processes and recycled fabrics where possible. The brand also collaborates with local artists and cultural institutions to preserve and document traditional patterns and their meanings.",
    location: "Kampala, Uganda",
    priceRange: "UGX 100,000 - UGX 800,000",
    category: "Ready to Wear",
    rating: 4.9,
    reviews: [
      {
        author: "Patricia Namubiru",
        comment:
          "Their prints are absolutely stunning and the quality is exceptional.",
        rating: 5,
        date: "2024-03-18",
      },
      {
        author: "Jane Akello",
        comment:
          "Love how they blend traditional patterns with modern styles. Always get compliments!",
        rating: 5,
        date: "2024-03-01",
      },
      {
        author: "Rebecca White",
        comment:
          "Innovative designs and great quality. Sizing runs slightly small though.",
        rating: 4,
        date: "2024-02-15",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Digital Heritage",
        image: "/lovable-uploads/kampala-prints-heritage.png",
      },
      {
        id: 2,
        title: "Modern Fusion",
        image: "/lovable-uploads/kampala-prints-fusion.png",
      },
      {
        id: 3,
        title: "Resort Collection",
        image: "/lovable-uploads/kampala-prints-resort.png",
      },
    ],
  },
  "casablanca-couture": {
    name: "Casablanca Couture",
    description:
      "Casablanca Couture creates luxurious evening wear and formal attire that blends Moroccan craftsmanship with modern haute couture. Their designs showcase intricate beadwork and embroidery inspired by traditional Moroccan motifs.",
    longDescription:
      "Established in 2018 by designer Leila Bennani, Casablanca Couture has become synonymous with luxury evening wear that celebrates Morocco's rich textile heritage. The atelier combines traditional Moroccan craftsmanship with contemporary haute couture techniques to create stunning pieces for special occasions.\n\nEach garment is created in their Casablanca workshop, where master artisans specializing in traditional techniques work alongside contemporary fashion designers. The brand is particularly renowned for its intricate beadwork and embroidery, which draws inspiration from traditional Moroccan architecture and textiles.\n\nCasablanca Couture maintains strong ties to local artisan communities, ensuring the preservation of traditional craft techniques while innovating in the luxury fashion space. The brand operates an intensive training program for young artisans, focusing on both traditional embroidery techniques and modern couture construction.",
    location: "Casablanca, Morocco",
    priceRange: "MAD 5,000 - MAD 50,000",
    category: "Haute Couture",
    rating: 4.8,
    reviews: [
      {
        author: "Samira El Alami",
        comment:
          "The craftsmanship is absolutely stunning. My wedding dress was a dream come true.",
        rating: 5,
        date: "2024-03-20",
      },
      {
        author: "Fatima Zahra",
        comment:
          "Exceptional attention to detail and beautiful incorporation of traditional elements.",
        rating: 5,
        date: "2024-03-05",
      },
      {
        author: "Maria Rodriguez",
        comment:
          "Beautiful designs but the waiting time for custom pieces can be quite long.",
        rating: 4,
        date: "2024-02-20",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Evening Elegance",
        image: "/lovable-uploads/casablanca-evening.png",
      },
      {
        id: 2,
        title: "Bridal Dreams",
        image: "/lovable-uploads/casablanca-bridal.png",
      },
      {
        id: 3,
        title: "Modern Moroccan",
        image: "/lovable-uploads/casablanca-modern.png",
      },
    ],
  },
  "kigali-knits": {
    name: "Kigali Knits",
    description:
      "Kigali Knits produces contemporary knitwear that combines traditional Rwandan patterns with modern silhouettes. Their pieces showcase the exceptional skill of local artisans while creating sustainable employment opportunities for women in Rwanda.",
    longDescription:
      "Founded in 2019 by social entrepreneur Marie-Claire Uwamahoro, Kigali Knits has established itself as a pioneer in sustainable African knitwear. The brand works with a cooperative of women artisans, combining traditional Rwandan patterns and techniques with contemporary design sensibilities.\n\nTheir workshop in Kigali employs over 50 women artisans, many of whom have learned their craft through the brand's training program. Each piece is hand-knitted using locally sourced wool and organic cotton, incorporating traditional patterns that tell stories of Rwandan culture.\n\nKigali Knits is deeply committed to social impact, providing stable employment and skills development for women in rural communities. The brand also works with local sheep farmers to develop sustainable wool production practices, creating a complete farm-to-fashion supply chain within Rwanda.",
    location: "Kigali, Rwanda",
    priceRange: "RWF 30,000 - RWF 250,000",
    category: "Ready to Wear",
    rating: 4.9,
    reviews: [
      {
        author: "Claudine Mukamana",
        comment:
          "Beautiful knitwear that's both warm and stylish. Love supporting local artisans.",
        rating: 5,
        date: "2024-03-16",
      },
      {
        author: "Alice Mutesi",
        comment:
          "The quality of their knits is exceptional. Each piece feels special and unique.",
        rating: 5,
        date: "2024-02-28",
      },
      {
        author: "Emma Brown",
        comment:
          "Gorgeous designs and amazing quality. Shipping internationally takes time though.",
        rating: 4,
        date: "2024-02-12",
      },
    ],
    isVerified: true,
    collections: [
      {
        id: 1,
        title: "Winter Warmth",
        image: "/lovable-uploads/kigali-knits-winter.png",
      },
      {
        id: 2,
        title: "Summer Knits",
        image: "/lovable-uploads/kigali-knits-summer.png",
      },
      {
        id: 3,
        title: "Heritage Collection",
        image: "/lovable-uploads/kigali-knits-heritage.png",
      },
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(brandsData).map((id) => ({
    id,
  }));
}

interface Props {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function BrandProfile({ params }: Props) {
  const brandData = brandsData[params.id as keyof typeof brandsData];

  if (!brandData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Brand Not Found</h1>
          <Button asChild>
            <Link href="/directory">Return to Directory</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <ClientBrandProfile brandData={brandData} />;
}
