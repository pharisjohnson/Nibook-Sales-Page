import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpRight, TrendingUp, Scissors, CalendarCheck, Clock, MessageSquare, Plus, ExternalLink, Calendar as CalendarIcon } from "lucide-react";

const recentBookings = [
  { id: 1, client: "Maria N.", service: "Hair Braiding", time: "Today 10:00 AM", status: "Confirmed" },
  { id: 2, client: "James O.", service: "Beard Trim", time: "Today 2:30 PM", status: "Confirmed" },
  { id: 3, client: "Grace M.", service: "Locs Retwist", time: "Tomorrow 9:00 AM", status: "Pending" },
];

export default function DashboardHome() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Good morning, Amina! ☀️</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Your next appointment is in 2 hours — <span className="font-medium text-foreground">Maria N. at 10:00 AM</span>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" />
            Booking Page
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Booking
          </Button>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">KES 34,200</h3>
            </div>
            <p className="text-xs font-medium mt-2 flex items-center gap-1" style={{ color: '#4CB963' }}>
              <ArrowUpRight className="w-3 h-3" /> +12% this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Bookings This Month</p>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">18</h3>
            </div>
            <p className="text-xs font-medium mt-2 flex items-center gap-1" style={{ color: '#4CB963' }}>
              <ArrowUpRight className="w-3 h-3" /> +4 from last month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">94%</h3>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-2">
              Very good
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Top Service</p>
              <div className="p-2 bg-primary/10 rounded-full text-primary">
                <Scissors className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-bold truncate">Hair Braiding</h3>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-2">
              8 bookings
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight">Upcoming Bookings</h2>
            <Button variant="link" className="px-0">View all</Button>
          </div>
          
          <Card className="shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium">Client</th>
                    <th className="px-6 py-4 font-medium">Service</th>
                    <th className="px-6 py-4 font-medium">Date & Time</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="bg-card hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {booking.client.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {booking.client}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{booking.service}</td>
                      <td className="px-6 py-4 font-medium">{booking.time}</td>
                      <td className="px-6 py-4">
                        <Badge 
                          variant="outline" 
                          className={
                            booking.status === 'Confirmed' 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          }
                        >
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 text-xs">View</Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10">Cancel</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {recentBookings.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No upcoming bookings found.</p>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight">Quick Actions</h2>
          
          <div className="grid gap-4">
            <Card className="group hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Scissors className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">Add Service</h3>
                  <p className="text-sm text-muted-foreground">Create a new offering</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold group-hover:text-accent transition-colors">View Analytics</h3>
                  <p className="text-sm text-muted-foreground">Check your performance</p>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:border-[#4CB963]/50 transition-colors cursor-pointer shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: 'rgba(76, 185, 99, 0.1)', color: '#4CB963' }}>
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold transition-colors" style={{ color: 'inherit' }}>WhatsApp Setup</h3>
                  <p className="text-sm text-muted-foreground">Connect for notifications</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="bg-primary text-primary-foreground shadow-md overflow-hidden relative">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-6 relative z-10">
              <h3 className="font-bold text-lg mb-2">Need a custom app?</h3>
              <p className="text-primary-foreground/80 text-sm mb-4">
                Upgrade to Pro to get your own branded client app on iOS and Android.
              </p>
              <Button variant="secondary" className="w-full bg-white text-primary hover:bg-white/90">
                Learn More
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
