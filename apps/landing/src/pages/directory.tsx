import { useSeo } from "@/hooks/use-seo";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { publicBookingPath } from "@/lib/routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
  Search, MapPin, Star, Clock, Scissors, Sparkles, Dumbbell,
  Heart, Camera, SlidersHorizontal, X, ArrowLeft, LayoutList, LayoutGrid, ImageIcon, ChevronRight, Loader2,
} from "lucide-react";

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "Hair & Beauty", label: "Hair & Beauty", icon: Scissors },
  { id: "Fitness & Gym", label: "Fitness", icon: Dumbbell },
  { id: "Spa & Wellness", label: "Wellness & Spa", icon: Heart },
  { id: "Photography", label: "Photography", icon: Camera },
];

const GRADIENTS = [
  "from-pink-500 to-rose-500", "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600", "from-orange-500 to-red-500",
  "from-violet-500 to-purple-600", "from-amber-500 to-orange-500",
  "from-fuchsia-500 to-pink-600", "from-slate-600 to-gray-800",
];

type DirectoryBusiness = {
  id: string;
  slug: string;
  business_name: string;
  category: string | null;
  location: string | null;
  bio: string | null;
  logo_url: string | null;
  cover_url: string | null;
  avatar_url: string | null;
};


function bizGradient(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

/* ── List-view card ── */
function ListCard({ biz }: { biz: DirectoryBusiness }) {
  const gradient = bizGradient(biz.id);
  return (
    <Link href={publicBookingPath(biz.slug)}>
      <motion.div layout className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer">
        <div className="flex gap-4 p-4">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm overflow-hidden`}>
            {biz.logo_url
              ? <img src={biz.logo_url} className="w-full h-full object-cover" alt={biz.business_name} />
              : <Scissors className="w-7 h-7 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm group-hover:text-primary transition-colors">{biz.business_name}</p>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            </div>
            {biz.location && (
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 shrink-0" /><span>{biz.location}</span>
              </div>
            )}
            {biz.category && (
              <div className="flex gap-1.5 mt-2">
                <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{biz.category}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ── Grid-view card ── */
function GridCard({ biz }: { biz: DirectoryBusiness }) {
  const gradient = bizGradient(biz.id);
  return (
    <Link href={publicBookingPath(biz.slug)}>
      <motion.div layout className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5 transition-all group cursor-pointer flex flex-col">
        <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          {biz.cover_url
            ? <img src={biz.cover_url} alt={biz.business_name} className="w-full h-full object-cover absolute inset-0" />
            : <ImageIcon className="w-10 h-10 text-white/40" />}
        </div>
        <div className="p-3 flex flex-col gap-2 flex-1">
          <p className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">{biz.business_name}</p>
          {biz.location && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{biz.location}</span>
            </div>
          )}
          {biz.category && (
            <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground w-fit">{biz.category}</span>
          )}
        </div>
        <div className="px-3 pb-3 border-t border-border/50 pt-2">
          <Button size="sm" className="w-full h-7 text-xs rounded-lg">Book</Button>
        </div>
      </motion.div>
    </Link>
  );
}

const sortOptions = ["A–Z", "Z–A"];

export default function DirectoryPage() {
  useSeo({
    title: "Browse Service Businesses in Kenya",
    description: "Discover and book appointments with salons, spas, barbershops and service businesses near you. Find the best local professionals on Nibook.",
    url: "/directory",
  });
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("A–Z");
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(true);

  useEffect(() => {
    apiFetch<{ data: DirectoryBusiness[] }>("/directory").then(({ data }) => {
      setBusinesses(data?.data ?? []);
      setLoadingBiz(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let list = [...businesses];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.business_name.toLowerCase().includes(q) ||
        (b.location ?? "").toLowerCase().includes(q) ||
        (b.category ?? "").toLowerCase().includes(q)
      );
    }
    if (activeCategory !== "all") list = list.filter(b => b.category === activeCategory);
    if (sortBy === "Z–A") list.sort((a, b) => b.business_name.localeCompare(a.business_name));
    else list.sort((a, b) => a.business_name.localeCompare(b.business_name));
    return list;
  }, [search, activeCategory, sortBy, businesses]);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-primary to-blue-700 pt-10 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/">
            <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />Back to Nibook
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Find service providers near you</h1>
          <p className="text-white/70 text-sm mb-6">Book verified professionals in Nairobi and beyond</p>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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

      <div className="max-w-5xl mx-auto px-4 -mt-6">
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

        {/* Controls row */}
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
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
              className={`flex items-center gap-1.5 text-xs border rounded-lg px-3 py-2 transition-colors ${
                showFilters ? "bg-primary text-white border-primary" : "bg-white border-border hover:border-primary/40"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />Filters
            </button>

            {/* View toggle */}
            <div className="flex items-center bg-white border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setView("list")}
                title="List view"
                className={`p-2 transition-colors ${view === "list" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("grid")}
                title="Grid view"
                className={`p-2 transition-colors ${view === "grid" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loadingBiz ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No businesses found</p>
            <p className="text-sm mt-1">Try a different search or category</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {view === "list" ? (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 pb-12"
              >
                {filtered.map((biz, i) => (
                  <motion.div key={biz.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <ListCard biz={biz} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-12"
              >
                {filtered.map((biz, i) => (
                  <motion.div key={biz.slug} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <GridCard biz={biz} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
