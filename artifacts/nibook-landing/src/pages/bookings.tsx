import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, MoreHorizontal, Plus, Calendar as CalendarIcon, Filter } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const allBookings = [
  { id: "B1001", client: "Maria N.", service: "Hair Braiding", date: "Oct 24, 2023", time: "10:00 AM", amount: "2,500", payment: "M-Pesa", status: "Confirmed" },
  { id: "B1002", client: "James O.", service: "Beard Trim", date: "Oct 24, 2023", time: "02:30 PM", amount: "800", payment: "In Person", status: "Confirmed" },
  { id: "B1003", client: "Grace M.", service: "Locs Retwist", date: "Oct 25, 2023", time: "09:00 AM", amount: "3,500", payment: "Bank Transfer", status: "Pending" },
  { id: "B1004", client: "David K.", service: "Haircut", date: "Oct 22, 2023", time: "11:00 AM", amount: "1,000", payment: "M-Pesa", status: "Completed" },
  { id: "B1005", client: "Fatuma A.", service: "Hair Braiding", date: "Oct 21, 2023", time: "01:00 PM", amount: "2,500", payment: "In Person", status: "Completed" },
  { id: "B1006", client: "Peter M.", service: "Beard Trim", date: "Oct 20, 2023", time: "04:00 PM", amount: "800", payment: "M-Pesa", status: "Cancelled" },
  { id: "B1007", client: "Lucy W.", service: "Locs Retwist", date: "Oct 19, 2023", time: "10:30 AM", amount: "3,500", payment: "M-Pesa", status: "Completed" },
  { id: "B1008", client: "Aisha B.", service: "Hair Braiding", date: "Oct 26, 2023", time: "03:00 PM", amount: "2,500", payment: "-", status: "Pending" },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Confirmed": return <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 shadow-none">Confirmed</Badge>;
    case "Completed": return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 shadow-none">Completed</Badge>;
    case "Cancelled": return <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200 shadow-none">Cancelled</Badge>;
    case "Pending": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200 shadow-none">Pending</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredBookings = allBookings.filter(b => {
    const matchesSearch = b.client.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          b.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "upcoming") return matchesSearch && (b.status === "Confirmed" || b.status === "Pending");
    if (activeTab === "completed") return matchesSearch && b.status === "Completed";
    if (activeTab === "cancelled") return matchesSearch && b.status === "Cancelled";
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage your appointments and schedule.</p>
        </div>
        <Button className="gap-2 shadow-md">
          <Plus className="w-5 h-5" />
          Add Booking
        </Button>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex bg-muted/50 p-1">
              <TabsTrigger value="all" className="data-[state=active]:shadow-sm">All</TabsTrigger>
              <TabsTrigger value="upcoming" className="data-[state=active]:shadow-sm">Upcoming</TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:shadow-sm">Completed</TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:shadow-sm">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search client, service..."
                className="pl-9 bg-muted/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 bg-muted/30">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking, idx) => (
                  <TableRow key={booking.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">{booking.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                            {booking.client.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{booking.client}</span>
                      </div>
                    </TableCell>
                    <TableCell>{booking.service}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{booking.date}</span>
                        <span className="text-xs text-muted-foreground">{booking.time}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">KES {booking.amount}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{booking.payment}</TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Message Client</DropdownMenuItem>
                          {(booking.status === "Pending" || booking.status === "Confirmed") && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Reschedule</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">Cancel Booking</DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CalendarIcon className="h-10 w-10 mb-3 opacity-20" />
                      <p>No bookings found matching your filters.</p>
                      <Button variant="link" onClick={() => {setSearchTerm(""); setActiveTab("all");}} className="mt-2">
                        Clear all filters
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="p-4 border-t bg-muted/10 text-sm text-muted-foreground flex items-center justify-between">
          <p>Showing {Math.min(filteredBookings.length, 1)}-{filteredBookings.length} of {allBookings.length} bookings</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
