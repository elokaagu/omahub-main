"use client";

import {
  FadeIn,
  SlideUp,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/animations";

// Interface for brand display
interface BrandDisplay {
  id: string;
  name: string;
  image: string;
  category: string;
  location: string;
  isVerified: boolean;
}

export default function DirectoryClient() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "All Categories"
  );
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [showFilters, setShowFilters] = useState(false);
  const [displayedBrands, setDisplayedBrands] = useState<BrandDisplay[]>([]);
  const [allBrands, setAllBrands] = useState<BrandDisplay[]>([]);
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch brands from the database
  useEffect(() => {
    async function fetchBrands() {
      try {
        setLoading(true);
        const brandsData = await getAllBrands();
        console.log("Fetched brands for directory:", brandsData.length);

        // Convert to display format
        const brandDisplayData = brandsData.map((brand) => ({
          id: brand.id,
          name: brand.name,
          image: brand.image,
          category: brand.category,
          location: brand.location.split(",")[0], // Take just the city name
          isVerified: brand.is_verified,
        }));

        setAllBrands(brandDisplayData);
        setDisplayedBrands(brandDisplayData);
      } catch (error) {
        console.error("Error fetching brands for directory:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrands();
  }, []);

  // Filter brands based on search, category, and location
  useEffect(() => {
    let filtered = [...allBrands];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(
        (brand) => brand.category === selectedCategory
      );
    }

    // Apply location filter
    if (selectedLocation !== "All Locations") {
      filtered = filtered.filter(
        (brand) => brand.location === selectedLocation
      );
    }

    setDisplayedBrands(filtered);
  }, [searchTerm, selectedCategory, selectedLocation, allBrands]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All Categories");
    setSelectedLocation("All Locations");
    setDisplayedBrands(allBrands);
  };

  return (
    <>
      <div className="mt-8">
        <FadeIn>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-oma-cocoa" />
              <Input
                type="search"
                placeholder="Search designers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-oma-cocoa/20 focus:border-oma-plum/50"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsGridView(true)}
                className={cn(
                  "w-10 h-10",
                  isGridView ? "bg-oma-beige text-oma-plum" : "text-oma-cocoa"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsGridView(false)}
                className={cn(
                  "w-10 h-10",
                  !isGridView ? "bg-oma-beige text-oma-plum" : "text-oma-cocoa"
                )}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="md:w-auto w-full"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                className="md:w-auto w-full border-oma-plum text-oma-plum hover:bg-oma-plum hover:text-white"
                onClick={resetFilters}
              >
                Show All Designers
              </Button>
            </div>
          </div>
        </FadeIn>

        {showFilters && (
          <SlideUp>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-lg bg-oma-beige/50 border border-oma-gold/10">
              <div>
                <Label className="text-oma-cocoa">Category</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md border-oma-gold/20 focus:border-oma-plum"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-oma-cocoa">Location</Label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md border-oma-gold/20 focus:border-oma-plum"
                >
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SlideUp>
        )}
      </div>

      <Separator className="my-8 bg-oma-gold/10" />

      {/* Results Section */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-oma-plum border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "grid gap-6",
              isGridView
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            )}
          >
            <StaggerContainer>
              {displayedBrands.map((brand) => (
                <StaggerItem key={brand.id}>
                  <BrandCard
                    key={brand.id}
                    {...brand}
                    isPortrait={!isGridView}
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>

          {displayedBrands.length === 0 && (
            <FadeIn>
              <div className="text-center py-12 bg-oma-beige/30 rounded-lg p-8">
                <p className="text-oma-cocoa text-lg">
                  No designers found matching your criteria.
                </p>
                <Button
                  onClick={resetFilters}
                  className="mt-4 bg-oma-plum hover:bg-oma-plum/90"
                >
                  Reset Filters
                </Button>
              </div>
            </FadeIn>
          )}
        </>
      )}
    </>
  );
}
