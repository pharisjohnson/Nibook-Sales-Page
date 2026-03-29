import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal, Clock, DollarSign, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

type Service = {
  id: number;
  name: string;
  price: string;
  duration: number;
  active: boolean;
  color: string;
};

const gradients = [
  "from-pink-500 to-rose-500",
  "from-blue-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-indigo-500",
];

const initialServices: Service[] = [
  { id: 1, name: "Hair Braiding", price: "2,500", duration: 120, active: true, color: gradients[0] },
  { id: 2, name: "Beard Trim & Shape", price: "800", duration: 30, active: true, color: gradients[1] },
  { id: 3, name: "Locs Retwist", price: "3,500", duration: 180, active: false, color: gradients[2] },
];

const MAX_FREE_SERVICES = 3;

export default function ServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "60" });
  const [formError, setFormError] = useState("");

  const activeCount = services.filter(s => s.active).length;

  const openAdd = () => {
    if (services.length >= MAX_FREE_SERVICES) {
      toast({ title: "Service limit reached", description: "Upgrade to Pro to add unlimited services.", variant: "destructive" });
      return;
    }
    setEditingService(null);
    setForm({ name: "", price: "", duration: "60" });
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({ name: service.name, price: service.price.replace(",", ""), duration: String(service.duration) });
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { setFormError("Service name is required."); return; }
    if (!form.price.trim() || isNaN(Number(form.price))) { setFormError("Please enter a valid price."); return; }
    setFormError("");

    const priceFormatted = Number(form.price).toLocaleString();

    if (editingService) {
      setServices(services.map(s =>
        s.id === editingService.id
          ? { ...s, name: form.name, price: priceFormatted, duration: Number(form.duration) }
          : s
      ));
      toast({ title: "Service updated", description: `"${form.name}" has been updated.` });
    } else {
      const newService: Service = {
        id: Date.now(),
        name: form.name,
        price: priceFormatted,
        duration: Number(form.duration),
        active: true,
        color: gradients[services.length % gradients.length],
      };
      setServices([...services, newService]);
      toast({ title: "Service added", description: `"${form.name}" is now live on your booking page.` });
    }
    setDialogOpen(false);
  };

  const deleteService = (id: number) => {
    const svc = services.find(s => s.id === id);
    setServices(services.filter(s => s.id !== id));
    toast({ title: "Service deleted", description: `"${svc?.name}" has been removed.` });
  };

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
        <Button className="gap-2 shadow-md hover:shadow-lg transition-all" onClick={openAdd}>
          <Plus className="w-5 h-5" />
          Add Service
        </Button>
      </div>

      <Card className="bg-muted/50 border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium">Free Plan: {services.length} of {MAX_FREE_SERVICES} services used</p>
            <Progress value={(services.length / MAX_FREE_SERVICES) * 100} className="h-2 mt-2" />
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
            transition={{ delay: idx * 0.07 }}
          >
            <Card className={`overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${!service.active ? "opacity-70 grayscale-[0.3]" : ""}`}>
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
                      <DropdownMenuItem onClick={() => openEdit(service)}>Edit Service</DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteService(service.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-lg line-clamp-1">{service.name}</h3>
                  <Badge
                    variant={service.active ? "default" : "secondary"}
                    className={service.active ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20" : ""}
                  >
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
                <Switch checked={service.active} onCheckedChange={() => toggleService(service.id)} />
              </CardFooter>
            </Card>
          </motion.div>
        ))}

        {services.length < MAX_FREE_SERVICES && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: services.length * 0.07 }}
          >
            <Card
              onClick={openAdd}
              className="h-full min-h-[300px] border-2 border-dashed border-border/60 bg-transparent flex flex-col items-center justify-center text-center p-6 hover:bg-muted/30 transition-colors cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg">Add New Service</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">Create a new offering for your clients to book.</p>
            </Card>
          </motion.div>
        )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Update your service details below." : "Add a new service that clients can book on your public page."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="svc-name">Service name <span className="text-destructive">*</span></Label>
              <Input
                id="svc-name"
                placeholder="e.g. Hair Braiding, Massage, Coaching Call"
                value={form.name}
                onChange={e => { setForm({ ...form, name: e.target.value }); setFormError(""); }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="svc-price">Price (KES) <span className="text-destructive">*</span></Label>
                <Input
                  id="svc-price"
                  type="number"
                  min="0"
                  placeholder="e.g. 2500"
                  value={form.price}
                  onChange={e => { setForm({ ...form, price: e.target.value }); setFormError(""); }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="svc-duration">Duration</Label>
                <Select value={form.duration} onValueChange={v => setForm({ ...form, duration: v })}>
                  <SelectTrigger id="svc-duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingService ? "Save Changes" : "Add Service"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
