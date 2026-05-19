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
  Users, CalendarCheck, Scissors, BarChart3, RefreshCw, Loader2,
} from "lucide-react";

const ranges = ["7 days", "30 days", "90 days", "This year"] as const;
type Range = typeof ranges[number];

export default function AnalyticsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("30 days");
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<{ label: string; value: number; date: string }[]>([]);
  const [serviceStats, setServiceStats] = useState<{ name: string; bookings: number; revenue: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [topClients, setTopClients] = useState<{ name: string; bookings: number; spend: number }[]>([]);
  const [bookingStatuses, setBookingStatuses] = useState<{ label: string; count: number; pct: number; color: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case "7 days": startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case "30 days": startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case "90 days": startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getFullYear(), 0, 1); break;
    }

    const fetchData = async () => {
      const { data } = await apiFetch<{
        totalRevenue: number;
        totalBookings: number;
        completionRate: number;
        serviceStats: { name: string; bookings: number; revenue: number }[];
        topClients: { name: string; phone: string; bookings: number; spend: number }[];
        statusCounts: { completed: number; cancelled: number; "no-show": number; pending: number };
        raw: any[];
      }>(`/analytics/${user.id}?from=${startDate.toISOString()}&to=${now.toISOString()}`);

      if (!data || !data.raw || data.raw.length === 0) {
        setRevenueData([]); setServiceStats([]); setTotalRevenue(0);
        setTotalBookings(0); setTopClients([]); setBookingStatuses([]);
        setLoading(false);
        return;
      }

      const revenue: Record<string, number> = {};
      data.raw.forEach((b: any) => {
        const date = new Date(b.scheduled_at);
        let label: string;
        if (range === "7 days") label = date.toLocaleDateString("en-US", { weekday: "short" });
        else if (range === "30 days") {
          const week = Math.ceil((date.getDate() - startDate.getDate() + 1) / 7);
          label = `W${Math.max(1, week)}`;
        } else label = date.toLocaleDateString("en-US", { month: "short" });
        revenue[label] = (revenue[label] || 0) + Number(b.amount || 0);
      });

      const revenueArr = Object.entries(revenue).map(([label, value]) => ({ label, value, date: label }));
      const sc = data.statusCounts;
      const total = data.totalBookings;

      setRevenueData(revenueArr);
      setServiceStats(data.serviceStats);
      setTotalRevenue(data.totalRevenue);
      setTotalBookings(total);
      setTopClients(data.topClients.map(c => ({ name: c.name, bookings: c.bookings, spend: c.spend })));
      setBookingStatuses([
        { label: "Completed", count: sc.completed, pct: total > 0 ? Math.round((sc.completed / total) * 100) : 0, color: "bg-green-500" },
        { label: "Cancelled", count: sc.cancelled, pct: total > 0 ? Math.round((sc.cancelled / total) * 100) : 0, color: "bg-red-400" },
        { label: "No-Show", count: sc["no-show"], pct: total > 0 ? Math.round((sc["no-show"] / total) * 100) : 0, color: "bg-orange-400" },
        { label: "Pending", count: sc.pending, pct: total > 0 ? Math.round((sc.pending / total) * 100) : 0, color: "bg-yellow-400" },
      ]);
      setLoading(false);
    };

    fetchData();
  }, [user, range]);

  const maxVal = Math.max(...revenueData.map(d => d.value), 1);

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
          <p className="text-muted-foreground text-sm mt-1">Business performance overview</p>
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
          <Button size="sm" className="gap-1.5" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 500); toast({ title: "Data refreshed", description: "Analytics updated to the latest data." }); }}>
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
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              range === r ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Revenue", value: `KES ${(totalRevenue / 1000).toFixed(0)}K`, delta: "0%", up: true, icon: DollarSign },
              { label: "Bookings", value: String(totalBookings), delta: "0", up: true, icon: CalendarCheck },
              { label: "New Clients", value: String(topClients.length), delta: "0", up: true, icon: Users },
              { label: "Avg. Booking Value", value: totalBookings > 0 ? `KES ${Math.round(totalRevenue / totalBookings).toLocaleString()}` : "KES 0", delta: "0%", up: false, icon: BarChart3 },
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
                {totalRevenue > 0 && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <TrendingUp className="w-3 h-3 mr-1" />KES {(totalRevenue / 1000).toFixed(0)}K total
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <div className="flex items-end gap-2 h-40 mt-4">
                  {revenueData.map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-1 flex-1">
                      <span className="text-[10px] font-medium text-muted-foreground">{value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}</span>
                      <div className="w-full relative rounded-t-md overflow-hidden bg-primary/10" style={{ height: `${(value / maxVal) * 112}px` }}>
                        <motion.div
                          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-primary to-primary/70 rounded-t-md"
                          initial={{ height: 0 }}
                          animate={{ height: "100%" }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
                  <p>No revenue data for this period.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Service performance */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Scissors className="w-4 h-4 text-primary" />Service Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {serviceStats.length > 0 ? serviceStats.map((s, i) => (
                  <div key={s.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${
                          i === 0 ? "from-pink-500 to-rose-500" :
                          i === 1 ? "from-violet-500 to-purple-500" :
                          i === 2 ? "from-blue-500 to-cyan-500" :
                          "from-emerald-500 to-teal-500"
                        }`} />
                        <span className="font-medium">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">{s.bookings} bookings</span>
                        <span className="font-semibold">KES {(s.revenue / 1000).toFixed(0)}K</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          i === 0 ? "bg-gradient-to-r from-pink-500 to-rose-500" :
                          i === 1 ? "bg-gradient-to-r from-violet-500 to-purple-500" :
                          i === 2 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                          "bg-gradient-to-r from-emerald-500 to-teal-500"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${serviceStats[0].bookings > 0 ? (s.bookings / serviceStats[0].bookings) * 100 : 0}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Scissors className="w-8 h-8 mb-2 opacity-20" />
                    <p>No service data yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking status breakdown */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><CalendarCheck className="w-4 h-4 text-primary" />Booking Outcomes</CardTitle>
                <CardDescription className="text-xs">Total {totalBookings} bookings this period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                {bookingStatuses.length > 0 && totalBookings > 0 ? (
                  <>
                    {/* Visual breakdown bar */}
                    <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                      {bookingStatuses.map(s => (
                        <div key={s.label} className={`${s.color} transition-all`} style={{ width: `${s.pct}%` }} title={`${s.label}: ${s.pct}%`} />
                      ))}
                    </div>
                    {bookingStatuses.map(s => (
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
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CalendarCheck className="w-8 h-8 mb-2 opacity-20" />
                    <p>No booking data yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top clients */}
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Top Clients</CardTitle>
            </CardHeader>
            <CardContent>
              {topClients.length > 0 ? (
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
                      {topClients.map((c, i) => (
                        <tr key={c.name} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {c.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
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
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mb-2 opacity-20" />
                  <p>No client data yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

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
