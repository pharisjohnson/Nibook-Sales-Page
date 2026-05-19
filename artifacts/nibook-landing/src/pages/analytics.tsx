import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Download, Share2, FileText, Calendar, DollarSign,
  Users, CalendarCheck, Scissors, BarChart3, RefreshCw,
} from "lucide-react";

const ranges = ["7 days", "30 days", "90 days", "This year"] as const;
type Range = typeof ranges[number];

const revenueData: Record<Range, { label: string; value: number }[]> = {
  "7 days": [
    { label: "Mon", value: 2400 }, { label: "Tue", value: 3800 }, { label: "Wed", value: 1800 },
    { label: "Thu", value: 5200 }, { label: "Fri", value: 4600 }, { label: "Sat", value: 7200 }, { label: "Sun", value: 3100 },
  ],
  "30 days": [
    { label: "W1", value: 14200 }, { label: "W2", value: 18400 }, { label: "W3", value: 12800 }, { label: "W4", value: 21600 },
  ],
  "90 days": [
    { label: "Jan", value: 32000 }, { label: "Feb", value: 41000 }, { label: "Mar", value: 38000 },
  ],
  "This year": [
    { label: "Jan", value: 32000 }, { label: "Feb", value: 41000 }, { label: "Mar", value: 38000 },
    { label: "Apr", value: 52000 }, { label: "May", value: 44000 }, { label: "Jun", value: 61000 },
    { label: "Jul", value: 58000 }, { label: "Aug", value: 72000 }, { label: "Sep", value: 67000 },
    { label: "Oct", value: 78000 }, { label: "Nov", value: 84000 }, { label: "Dec", value: 91000 },
  ],
};

const serviceStats = [
  { name: "Hair Braiding", bookings: 54, revenue: 135000, growth: 18, color: "from-pink-500 to-rose-500" },
  { name: "Locs Retwist", bookings: 31, revenue: 108500, growth: 12, color: "from-violet-500 to-purple-500" },
  { name: "Beard Trim", bookings: 48, revenue: 38400, growth: -3, color: "from-blue-500 to-cyan-500" },
  { name: "Haircut & Style", bookings: 22, revenue: 22000, growth: 7, color: "from-emerald-500 to-teal-500" },
  { name: "Deep Conditioning", bookings: 14, revenue: 21000, growth: 25, color: "from-amber-500 to-orange-500" },
];

const topClients = [
  { name: "Grace M.", bookings: 8, spend: 28000, initials: "GM" },
  { name: "Fatuma A.", bookings: 6, spend: 21000, initials: "FA" },
  { name: "Maria N.", bookings: 5, spend: 12500, initials: "MN" },
  { name: "Priya K.", bookings: 4, spend: 16000, initials: "PK" },
  { name: "James O.", bookings: 4, spend: 4800, initials: "JO" },
];

const bookingStatuses = [
  { label: "Completed", count: 142, pct: 78, color: "bg-green-500" },
  { label: "Cancelled", count: 18, pct: 10, color: "bg-red-400" },
  { label: "No-Show", count: 12, pct: 7, color: "bg-orange-400" },
  { label: "Pending", count: 10, pct: 5, color: "bg-yellow-400" },
];

export default function AnalyticsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("30 days");
  const [liveBookings, setLiveBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const from = new Date(now);
    if (range === "7 days") from.setDate(now.getDate() - 7);
    else if (range === "30 days") from.setDate(now.getDate() - 30);
    else if (range === "90 days") from.setDate(now.getDate() - 90);
    else from.setMonth(0, 1);
    apiFetch<{ raw: any[] }>(`/analytics/${user.id}?from=${from.toISOString()}`)
      .then(({ data }) => { if (data?.raw) setLiveBookings(data.raw); });
  }, [user, range]);

  const hasLiveData = liveBookings.length > 0;
  const data = hasLiveData
    ? (() => {
        const map: Record<string, number> = {};
        liveBookings.forEach((b: any) => {
          const d = new Date(b.scheduled_at);
          const key = range === "7 days"
            ? d.toLocaleDateString("en-US", { weekday: "short" })
            : range === "This year"
              ? d.toLocaleDateString("en-US", { month: "short" })
              : `W${Math.ceil(d.getDate() / 7)}`;
          map[key] = (map[key] ?? 0) + (b.status === "completed" ? Number(b.amount ?? 0) : 0);
        });
        return Object.entries(map).map(([label, value]) => ({ label, value }));
      })()
    : revenueData[range];

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const totalRevenue = hasLiveData
    ? liveBookings.filter((b: any) => b.status === "completed").reduce((s: number, b: any) => s + Number(b.amount ?? 0), 0)
    : data.reduce((s, d) => s + d.value, 0);
  const totalBookings = hasLiveData ? liveBookings.length : serviceStats.reduce((s, d) => s + d.bookings, 0);

  const SERVICE_COLORS = [
    "from-pink-500 to-rose-500", "from-violet-500 to-purple-500",
    "from-blue-500 to-cyan-500", "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500", "from-red-500 to-pink-500",
  ];
  const liveServiceStats = hasLiveData ? (() => {
    const map: Record<string, { name: string; bookings: number; revenue: number; growth: number }> = {};
    liveBookings.forEach((b: any) => {
      const name = b.services?.name ?? "Service";
      if (!map[name]) map[name] = { name, bookings: 0, revenue: 0, growth: 0 };
      map[name].bookings++;
      if (b.status === "completed") map[name].revenue += Number(b.amount ?? 0);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).map((s, i) => ({
      ...s,
      color: SERVICE_COLORS[i % SERVICE_COLORS.length],
    }));
  })() : serviceStats;

  const liveTopClients = hasLiveData ? (() => {
    const map: Record<string, { name: string; bookings: number; spend: number; initials: string }> = {};
    liveBookings.forEach((b: any) => {
      const key = b.client_name;
      if (!map[key]) map[key] = { name: b.client_name, bookings: 0, spend: 0, initials: b.client_name.split(" ").map((n: string) => n[0]).join("") };
      map[key].bookings++;
      if (b.status === "completed") map[key].spend += Number(b.amount ?? 0);
    });
    return Object.values(map).sort((a, b) => b.spend - a.spend).slice(0, 5);
  })() : topClients;

  const liveStatusCounts = hasLiveData ? (() => {
    const counts: Record<string, number> = { completed: 0, cancelled: 0, "no-show": 0, pending: 0 };
    liveBookings.forEach((b: any) => { if (b.status in counts) counts[b.status]++; });
    const total = liveBookings.length;
    return [
      { label: "Completed", count: counts.completed, pct: total ? Math.round(counts.completed / total * 100) : 0, color: "bg-green-500" },
      { label: "Cancelled", count: counts.cancelled, pct: total ? Math.round(counts.cancelled / total * 100) : 0, color: "bg-red-400" },
      { label: "No-Show", count: counts["no-show"], pct: total ? Math.round(counts["no-show"] / total * 100) : 0, color: "bg-orange-400" },
      { label: "Pending", count: counts.pending, pct: total ? Math.round(counts.pending / total * 100) : 0, color: "bg-yellow-400" },
    ];
  })() : bookingStatuses;

  const handleExport = (format: string) => {
    toast({ title: `Exporting as ${format}`, description: "Your report will be ready in a moment." });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Report link copied!", description: "Share this analytics report with your team." });
  };

  return (
    <motion.div className="max-w-5xl mx-auto space-y-8" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Business performance overview for Amina's Beauty Studio</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" />Share
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("PDF")}>
            <FileText className="w-3.5 h-3.5" />PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport("CSV")}>
            <Download className="w-3.5 h-3.5" />CSV
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => toast({ title: "Data refreshed", description: "Analytics updated to the latest data." })}>
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </Button>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl w-fit">
        {ranges.map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${range === r ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Revenue", value: `KES ${(totalRevenue / 1000).toFixed(0)}K`, delta: "+18%", up: true, icon: DollarSign },
          { label: "Bookings", value: String(totalBookings), delta: "+12", up: true, icon: CalendarCheck },
          { label: "New Clients", value: "23", delta: "+6", up: true, icon: Users },
          { label: "Avg. Booking Value", value: `KES ${Math.round(totalRevenue / totalBookings).toLocaleString()}`, delta: "-3%", up: false, icon: BarChart3 },
        ].map(({ label, value, delta, up, icon: Icon }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Icon className="w-3.5 h-3.5" /></div>
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className={`text-xs font-medium mt-1 flex items-center gap-1 ${up ? "text-green-600" : "text-red-500"}`}>
                {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {delta} vs previous period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Revenue — {range}</CardTitle>
            <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
              <TrendingUp className="w-3 h-3 mr-1" />KES {(totalRevenue / 1000).toFixed(0)}K total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40 mt-4">
            {data.map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-[10px] font-medium text-muted-foreground">{value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}</span>
                <div className="w-full relative rounded-t-md overflow-hidden bg-primary/10" style={{ height: `${(value / maxVal) * 112}px` }}>
                  <motion.div
                    className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-primary to-primary/70 rounded-t-md"
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{ duration: 0.5, delay: data.indexOf({ label, value }) * 0.05 }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service performance */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Scissors className="w-4 h-4 text-primary" />Service Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {liveServiceStats.map((s, i) => (
              <div key={s.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${s.color}`} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">{s.bookings} bookings</span>
                    <span className="font-semibold">KES {(s.revenue / 1000).toFixed(0)}K</span>
                    <span className={`flex items-center gap-0.5 font-medium ${s.growth >= 0 ? "text-green-600" : "text-red-500"}`}>
                      {s.growth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(s.growth)}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${s.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.bookings / (liveServiceStats[0]?.bookings || 1)) * 100}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Booking status breakdown */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary" />Booking Outcomes</CardTitle>
            <CardDescription className="text-xs">Total 182 bookings this period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {/* Visual breakdown bar */}
            <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
              {liveStatusCounts.map(s => (
                <div key={s.label} className={`${s.color} transition-all`} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.pct}%`} />
              ))}
            </div>
            {liveStatusCounts.map(s => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${s.color}`} />
                  <span>{s.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold">{s.count}</span>
                  <span className="text-muted-foreground">{s.pct}%</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Top clients */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Top Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground font-medium border-b">
                  <th className="text-left pb-3 pr-4">Client</th>
                  <th className="text-right pb-3 pr-4">Bookings</th>
                  <th className="text-right pb-3">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {liveTopClients.map((c, i) => (
                  <tr key={c.name} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {c.initials}
                        </div>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">Client #{i + 1}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right font-medium">{c.bookings}</td>
                    <td className="py-3 text-right font-semibold text-primary">KES {c.spend.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Export footer */}
      <div className="flex flex-wrap gap-3 pb-8">
        <Button variant="outline" className="gap-2" onClick={() => handleExport("PDF")}>
          <FileText className="w-4 h-4" />Download PDF Report
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => handleExport("CSV")}>
          <Download className="w-4 h-4" />Export CSV Data
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => handleExport("PNG")}>
          <BarChart3 className="w-4 h-4" />Export Charts as PNG
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleShare}>
          <Share2 className="w-4 h-4" />Share Report Link
        </Button>
      </div>
    </motion.div>
  );
}
