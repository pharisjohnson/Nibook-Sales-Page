import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, Star, Clock, Scissors, Sparkles, Dumbbell,
  Heart, Camera, ChevronRight, SlidersHorizontal, X, ArrowLeft,
} from "lucide-react";

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "hair", label: "Hair & Beauty", icon: Scissors },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "wellness", label: "Wellness & Spa", icon: Heart },
  { id: "photography", label: "Photography", icon: Camera },
];

const businesses = [
  {
    id: 1, slug: "aminas-beauty-studio", name: "Amina's Beauty Studio",
    category: "hair", categoryLabel: "Hair & Beauty",
    location: "Westlands, Nairobi", distance: "1.2 km",
    rating: 4.8, reviewCount: 127, priceFrom: 800, priceTo: 3500,
    tags: ["Braiding", "Locs", "Beard Trim"],
    sponsored: true, available: true,
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: 2, slug: "kings-barbershop", name: "King's Barbershop",
    category: "hair", categoryLabel: "Hair & Beauty",
    location: "CBD, Nairobi", distance: "2.5 km",
    rating: 4.6, reviewCount: 89, priceFrom: 500, priceTo: 1500,
    tags: ["Haircut", "Shave", "Fade"],
    sponsored: false, available: true,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: 3, slug: "zen-wellness-spa", name: "Zen Wellness Spa",
    category: "wellness", categoryLabel: "Wellness & Spa",
    location: "Kilimani, Nairobi", distance: "3.1 km",
    rating: 4.9, reviewCount: 203, priceFrom: 2000, priceTo: 8000,
    tags: ["Massage", "Facial", "Body Wrap"],
    sponsored: true, available: true,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: 4, slug: "fit-nairobi", name: "FitNairobi Studio",
    category: "fitness", categoryLabel: "Fitness",
    location: "Lavington, Nairobi", distance: "4.0 km",
    rating: 4.7, reviewCount: 156, priceFrom: 1200, priceTo: 3000,
    tags: ["Personal Training", "Yoga", "HIIT"],
    sponsored: false, available: false,
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: 5, slug: "frames-by-fiona", name: "Frames by Fiona",
    category: "photography", categoryLabel: "Photography",
    location: "Karen, Nairobi", distance: "8.2 km",
    rating: 4.9, reviewCount: 74, priceFrom: 5000, priceTo: 25000,
    tags: ["Portraits", "Events", "Studio"],
    sponsored: true, available: true,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: 6, slug: "glow-up-beauty", name: "Glow Up Beauty Bar",
    category: "hair", categoryLabel: "Hair & Beauty",
    location: "Parklands, Nairobi", distance: "2.8 km",
    rating: 4.5, reviewCount: 61, priceFrom: 1000, priceTo: 5000,
    tags: ["Nails", "Waxing", "Makeup"],
    sponsored: false, available: true,
    gradient: "from-amber-500 to-orange-500",
  },
];

const sortOptions = ["Best Match", "Highest Rated", "Nearest", "Lowest Price", "Most Reviewed"];

export default function DirectoryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("Best Match");
  const [showFilters, setShowFilters] = useState(false);
  const [maxPrice, setMaxPrice] = useState(30000);

  const filtered = useMemo(() => {
    let list = [...businesses];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (activeCategory !== "all") list = list.filter(b => b.category === activeCategory);
    list = list.filter(b => b.priceFrom <= maxPrice);

    if (sortBy === "Highest Rated") list.sort((a, b) => b.rating - a.rating);
    else if (sortBy === "Nearest") list.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    else if (sortBy === "Lowest Price") list.sort((a, b) => a.priceFrom - b.priceFrom);
    else if (sortBy === "Most Reviewed") list.sort((a, b) => b.reviewCount - a.reviewCount);
    else list.sort((a, b) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0) || b.rating - a.rating);

    return list;
  }, [search, activeCategory, sortBy, maxPrice]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-primary to-blue-700 pt-10 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to Nibook
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Find service providers near you</h1>
          <p className="text-white/70 text-sm mb-6">Book verified professionals in Nairobi and beyond</p>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <Input
              className="pl-10 h-12 rounded-xl bg-white border-0 shadow-lg text-foreground placeholder:text-muted-foreground"
              placeholder="Search by name, service, or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6">
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {categories.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all shrink-0 ${
                activeCategory === id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-foreground border-border hover:border-primary/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* Sort + filter row */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> businesses found
          </p>
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {sortOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-2 transition-colors ${showFilters ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/40"}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />Filters
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 p-4 bg-white border border-border rounded-2xl shadow-sm"
          >
            <div className="space-y-3">
              <p className="text-sm font-semibold">Max price from</p>
              <input
                type="range" min={500} max={30000} step={500} value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>KES 500</span>
                <span className="font-semibold text-foreground">Up to KES {maxPrice.toLocaleString()}</span>
                <span>KES 30,000</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Business cards */}
        <div className="space-y-4 pb-12">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No businesses found</p>
              <p className="text-sm mt-1">Try a different search or category</p>
            </div>
          ) : filtered.map((biz, i) => (
            <motion.div
              key={biz.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all group"
            >
              <Link href={`/book/${biz.slug}`}>
                <div className="flex gap-4 p-4 cursor-pointer">
                  {/* Avatar */}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${biz.gradient} flex items-center justify-center shrink-0`}>
                    <Scissors className="w-7 h-7 text-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{biz.name}</p>
                        {biz.sponsored && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200">Sponsored</Badge>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{biz.location}</span>
                      <span className="text-border">·</span>
                      <span>{biz.distance}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-semibold">{biz.rating}</span>
                        <span className="text-muted-foreground">({biz.reviewCount})</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span className={biz.available ? "text-green-600 font-medium" : ""}>
                          {biz.available ? "Available today" : "Fully booked"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-1.5 flex-wrap">
                        {biz.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{t}</span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        from KES {biz.priceFrom.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
