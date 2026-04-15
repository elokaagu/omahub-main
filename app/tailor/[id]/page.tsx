"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getTailorWithBrand } from "@/lib/services/tailorService";
import { Tailor, Brand } from "@/lib/supabase";
import Link from "next/link";
import { LazyImage } from "@/components/ui/lazy-image";
import ContactDesignerModal from "@/components/ContactDesignerModal";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  MapPin,
  Star,
  CheckCircle,
} from "lucide-react";

type TailorWithBrand = Tailor & {
  brand: Brand;
};

// Smart focal point detection for fashion/tailor images
const getImageFocalPoint = (imageUrl: string, title: string) => {
  // For fashion and tailor images, we typically want to focus on the upper portion
  // where faces, necklines, and key design elements are usually located
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes("bridal") || lowerTitle.includes("wedding")) {
    return "object-top"; // Focus on top for bridal shots to capture face/neckline
  }

  if (lowerTitle.includes("evening") || lowerTitle.includes("gown")) {
    return "object-center"; // Center for full gown shots
  }

  // Default to top-center for most fashion photography to avoid cutting off faces
  return "object-top";
};

const FALLBACK_TAILOR_IMAGE = "/placeholder-service.jpg";

const formatConsultationFee = (
  consultationFee: number | null | undefined,
  currencyCode: string | null | undefined
) => {
  if (consultationFee == null) return null;
  const amount = Number(consultationFee);
  if (!Number.isFinite(amount)) return String(consultationFee);

  const normalizedCurrency =
    typeof currencyCode === "string" && currencyCode.trim().length > 0
      ? currencyCode.trim().toUpperCase()
      : "USD";

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${normalizedCurrency} ${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
  }
};

export default function TailorPage() {
  const params = useParams();
  const [tailor, setTailor] = useState<TailorWithBrand | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    async function fetchTailor() {
      if (!params.id || typeof params.id !== "string") {
        setError("Invalid tailor ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getTailorWithBrand(params.id);
        if (data) {
          setTailor(data);
        } else {
          setError("Tailor not found");
        }
      } catch (err) {
        console.error("Error fetching tailor:", err);
        setError("Failed to load tailor information");
      } finally {
        setLoading(false);
      }
    }

    fetchTailor();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="animate-pulse">
            <div className="h-8 bg-oma-cocoa/10 rounded-lg mb-8 w-32"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="h-96 bg-oma-cocoa/10 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-oma-cocoa/10 rounded-lg"></div>
                <div className="h-4 bg-oma-cocoa/10 rounded-lg w-3/4"></div>
                <div className="h-4 bg-oma-cocoa/10 rounded-lg w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tailor) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-3xl font-canela text-oma-cocoa mb-4">
              {error || "Tailor not found"}
            </h1>
            <Link
              href="/tailors"
              className="inline-flex items-center gap-2 text-oma-plum hover:text-oma-plum/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Tailors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = tailor.brand.name || tailor.title || "Tailor";
  const imageFocalClass = getImageFocalPoint(
    tailor.image || FALLBACK_TAILOR_IMAGE,
    displayName
  );
  const consultationFeeLabel = formatConsultationFee(
    tailor.consultation_fee,
    tailor.brand.currency
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-oma-beige/30 to-white">
      <div className="max-w-7xl mx-auto px-6 py-24">
        {/* Back Button */}
        <Link
          href="/tailors"
          className="inline-flex items-center gap-2 text-oma-plum hover:text-oma-plum/80 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tailors
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Tailor Image */}
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <LazyImage
              src={tailor.image || FALLBACK_TAILOR_IMAGE}
              alt={displayName}
              fill
              className={`object-cover ${imageFocalClass}`}
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={true}
              aspectRatio="4/3"
              quality={85}
            />
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-canela text-black mb-2">
                {displayName}
              </h1>
              <div className="flex items-center gap-2 text-oma-cocoa/70 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{tailor.brand.location}</span>
                {tailor.brand.is_verified && (
                  <div className="flex items-center gap-1 bg-oma-gold/20 text-black text-sm px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {tailor.description && (
              <div>
                <p className="text-oma-cocoa leading-relaxed">
                  {tailor.description}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="space-y-4">
              {tailor.price_range && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-oma-cocoa/60" />
                  <div>
                    <span className="text-sm text-oma-cocoa/60">
                      Price Range
                    </span>
                    <p className="text-black font-medium">
                      {tailor.price_range}
                    </p>
                  </div>
                </div>
              )}

              {tailor.lead_time && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-oma-cocoa/60" />
                  <div>
                    <span className="text-sm text-oma-cocoa/60">Lead Time</span>
                    <p className="text-black font-medium">{tailor.lead_time}</p>
                  </div>
                </div>
              )}

              {consultationFeeLabel && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-oma-cocoa/60" />
                  <div>
                    <span className="text-sm text-oma-cocoa/60">
                      Consultation Fee
                    </span>
                    <p className="text-black font-medium">{consultationFeeLabel}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Brand Info */}
            <div className="border-t border-oma-cocoa/20 pt-6">
              <h3 className="text-lg font-medium text-black mb-3">
                About {tailor.brand.name}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-oma-gold fill-current" />
                  <span className="text-sm text-oma-cocoa/70">
                    {tailor.brand.rating}/5 rating
                  </span>
                </div>
                <p className="text-sm text-oma-cocoa/70">
                  Category: {tailor.brand.category}
                </p>
                {tailor.brand.founded_year && (
                  <p className="text-sm text-oma-cocoa/70">
                    Founded: {tailor.brand.founded_year}
                  </p>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link
                href={`/brand/${tailor.brand.id}`}
                className="bg-oma-plum text-white px-6 py-3 rounded-lg hover:bg-oma-plum/90 transition-colors text-center"
              >
                View Brand Profile
              </Link>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="border border-oma-plum text-oma-plum px-6 py-3 rounded-lg hover:bg-oma-plum/10 transition-colors"
              >
                Contact Tailor
              </button>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        <ContactDesignerModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          brandName={tailor.brand.name}
          brandId={tailor.brand.id}
        />
      </div>
    </div>
  );
}
