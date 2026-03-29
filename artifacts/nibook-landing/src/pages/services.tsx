import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Clock, DollarSign, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

const initialServices = [
  { id: 1, name: "Hair Braiding", price: "2,500", duration: 120, active: true, color: "from-pink-500 to-rose-500" },
  { id: 2, name: "Beard Trim & Shape", price: "800", duration: 30, active: true, color: "from-blue-500 to-cyan-500" },
  { id: 3, name: "Locs Retwist", price: "3,500", duration: 180, active: false, color: "from-amber-500 to-orange-500" },
];

export default function ServicesPage() {
  const [services, setServices] = useState(initialServices);

  const toggleService = (id: number) => {
    setServices(services.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground mt-1">Manage your offerings and pricing.</p>
        </div>
        <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
          <Plus className="w-5 h-5" />
          Add Service
        </Button>
      </div>

      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Free Plan: 2 of 3 services active</p>
            <Progress value={66} className="h-2 mt-2" />
          </div>
          <Button variant="outline" size="sm" className="shrink-0 bg-background">Upgrade Plan</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className={`overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${!service.active ? 'opacity-70 grayscale-[0.3]' : ''}`}>
              <div className={`h-32 bg-gradient-to-br ${service.color} flex items-center justify-center relative`}>
                <ImageIcon className="w-10 h-10 text-white/50" />
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm border-none">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit Service</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-lg line-clamp-1">{service.name}</h3>
                  <Badge variant={service.active ? "default" : "secondary"} className={service.active ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : ""}>
                    {service.active ? "Active" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-accent" />
                    <span className="font-medium text-foreground">KES {service.price}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{service.duration} min</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t p-4 bg-muted/20 flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Show on booking page</span>
                <Switch 
                  checked={service.active} 
                  onCheckedChange={() => toggleService(service.id)} 
                />
              </CardFooter>
            </Card>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full min-h-[300px] border-2 border-dashed border-border/60 bg-transparent flex flex-col items-center justify-center text-center p-6 hover:bg-muted/30 transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg">Add New Service</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">Create a new offering for your clients to book.</p>
          </Card>
        </motion.div>
      </div>

      <div className="mt-12 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-primary/20">
        <div>
          <h3 className="font-bold text-xl mb-2">Unlock Unlimited Services</h3>
          <p className="text-muted-foreground max-w-xl">
            Upgrade to Pro to add unlimited services, custom durations, buffer times, and service categories.
          </p>
        </div>
        <div className="text-center md:text-right shrink-0">
          <p className="font-bold text-2xl mb-2">KES 1,500<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <Button size="lg" className="w-full md:w-auto shadow-lg hover:shadow-xl transition-all">Upgrade to Pro</Button>
        </div>
      </div>
    </div>
  );
}
