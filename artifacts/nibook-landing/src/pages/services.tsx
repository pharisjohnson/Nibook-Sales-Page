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
import { Separator } from "@/components/ui/separator";
import {
  Plus, MoreHorizontal, Clock, DollarSign, Image as ImageIcon,
  AlertCircle, Upload, X, ChevronLeft, ChevronRight, ListChecks, Trash2,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const MAX_IMAGES = 2;

type FieldType = "text" | "number" | "checkbox" | "select";
type IntakeField = { id: number; label: string; type: FieldType; required: boolean; options: string };

type Service = {
  id: string;
  name: string;
  price: string;
  duration: number;
  active: boolean;
  color: string;
  images: string[];
  intakeFields: IntakeField[];
};

const gradients = [
  "from-pink-500 to-rose-500",
  "from-blue-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-sky-500 to-indigo-500",
];

const MAX_FREE_SERVICES = 10;

/* ── Scrollable image banner on the service card ── */
function ServiceImageBanner({ service }: { service: Service }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = (idx: number) => {
    setActiveIdx(idx);
    scrollRef.current?.children[idx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  if (service.images.length === 0) {
    return (
      <div className={`h-36 bg-gradient-to-br ${service.color} flex items-center justify-center relative`}>
        <ImageIcon className="w-10 h-10 text-white/40" />
      </div>
    );
  }

  return (
    <div className="relative h-36 group">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="h-full flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: "none" }}
        onScroll={e => {
          const el = e.currentTarget;
          const idx = Math.round(el.scrollLeft / el.clientWidth);
          setActiveIdx(idx);
        }}
      >
        {service.images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${service.name} photo ${i + 1}`}
            className="h-full w-full object-cover shrink-0 snap-start"
          />
        ))}
      </div>

      {/* Dots */}
      {service.images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {service.images.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`rounded-full transition-all ${
                activeIdx === i ? "w-4 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}

      {/* Prev / Next arrows */}
      {service.images.length > 1 && (
        <>
          <button
            onClick={() => scrollTo(Math.max(0, activeIdx - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollTo(Math.min(service.images.length - 1, activeIdx + 1))}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/30 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Image count badge */}
      {service.images.length > 1 && (
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/40 text-white text-xs backdrop-blur-sm">
          {activeIdx + 1} / {service.images.length}
        </div>
      )}
    </div>
  );
}

/* ── Image upload area inside the dialog ── */
function ImageUploadArea({
  images,
  onChange,
}: {
  images: string[];
  onChange: (imgs: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) { reject("Not an image"); return; }
      const reader = new FileReader();
      reader.onload = e => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const addFiles = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) return;
      const toProcess = Array.from(files).slice(0, remaining);
      const results = await Promise.all(toProcess.map(readFile).map(p => p.catch(() => null)));
      const valid = results.filter(Boolean) as string[];
      if (valid.length) onChange([...images, ...valid]);
    },
    [images, onChange]
  );

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  const canAdd = images.length < MAX_IMAGES;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Photos <span className="text-muted-foreground font-normal text-xs">(up to {MAX_IMAGES})</span></Label>
        <span className="text-xs text-muted-foreground">{images.length} / {MAX_IMAGES} added</span>
      </div>

      {/* Previews */}
      {images.length > 0 && (
        <div className="flex gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-24 h-20 rounded-lg overflow-hidden border border-border group shrink-0">
              <img src={img} alt={`preview ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1 rounded">
                Photo {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAdd && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          className={`flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : "border-border/70 hover:border-primary/50 hover:bg-muted/40"
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-4 h-4 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Click or drag image here</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPG, PNG, WEBP — {MAX_IMAGES - images.length} slot{MAX_IMAGES - images.length !== 1 ? "s" : ""} remaining
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => addFiles(e.target.files)}
          />
        </div>
      )}

      {!canAdd && (
        <p className="text-xs text-muted-foreground text-center py-1">
          Maximum {MAX_IMAGES} photos reached. Remove one to replace it.
        </p>
      )}
    </div>
  );
}

/* ── Intake fields editor ── */
const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text answer" },
  { value: "number", label: "Number" },
  { value: "checkbox", label: "Yes / No checkbox" },
  { value: "select", label: "Multiple choice" },
];

function IntakeFieldsEditor({ fields, onChange }: { fields: IntakeField[]; onChange: (f: IntakeField[]) => void }) {
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<FieldType>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState("");
  const [addError, setAddError] = useState("");

  const addField = () => {
    if (!newLabel.trim()) { setAddError("Question text is required."); return; }
    if (newType === "select" && !newOptions.trim()) { setAddError("Add at least one option (comma-separated)."); return; }
    setAddError("");
    onChange([...fields, { id: Date.now(), label: newLabel.trim(), type: newType, required: newRequired, options: newOptions.trim() }]);
    setNewLabel("");
    setNewType("text");
    setNewRequired(false);
    setNewOptions("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ListChecks className="w-4 h-4 text-primary" />
        <Label className="text-sm font-medium">Client intake questions</Label>
        <span className="text-xs text-muted-foreground ml-auto">{fields.length} question{fields.length !== 1 ? "s" : ""}</span>
      </div>

      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2 p-2.5 bg-muted/40 rounded-lg border border-border/50">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{f.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {FIELD_TYPES.find(t => t.value === f.type)?.label}
                  {f.type === "select" && f.options && ` · ${f.options}`}
                  {f.required && <span className="ml-1.5 text-red-500">Required</span>}
                </p>
              </div>
              <button onClick={() => onChange(fields.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive transition-colors mt-0.5">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-muted/30 rounded-xl border border-border/50 space-y-2.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Add a question</p>
        <Input placeholder="e.g. What's your hair length?" value={newLabel} onChange={e => { setNewLabel(e.target.value); setAddError(""); }} className="h-8 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <Select value={newType} onValueChange={v => setNewType(v as FieldType)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-2 bg-background border rounded-md h-8">
            <Switch checked={newRequired} onCheckedChange={setNewRequired} className="scale-75" />
            <span className="text-xs text-muted-foreground">Required</span>
          </div>
        </div>
        {newType === "select" && (
          <Input placeholder="Options: Short, Medium, Long" value={newOptions} onChange={e => setNewOptions(e.target.value)} className="h-8 text-xs" />
        )}
        {addError && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{addError}</p>}
        <Button size="sm" onClick={addField} className="w-full h-8 text-xs gap-1.5"><Plus className="w-3.5 h-3.5" />Add Question</Button>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function ServicesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "60" });
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formIntakeFields, setFormIntakeFields] = useState<IntakeField[]>([]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoadingServices(true);
    supabase
      .from("services")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setServices(data.map((s: any, i: number) => ({
            id: s.id,
            name: s.name,
            price: Number(s.price ?? 0).toLocaleString(),
            duration: s.duration_minutes ?? 60,
            active: s.is_active ?? true,
            color: gradients[i % gradients.length],
            images: s.image_url ? [s.image_url] : [],
            intakeFields: [],
          })));
        }
        setLoadingServices(false);
      });
  }, [user]);

  const openAdd = () => {
    if (services.length >= MAX_FREE_SERVICES) {
      toast({ title: "Service limit reached", description: "You can add up to 10 services in the beta.", variant: "destructive" });
      return;
    }
    setEditingService(null);
    setForm({ name: "", price: "", duration: "60" });
    setFormImages([]);
    setFormIntakeFields([]);
    setFormError("");
    setDialogOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setForm({ name: service.name, price: service.price.replace(/,/g, ""), duration: String(service.duration) });
    setFormImages(service.images);
    setFormIntakeFields(service.intakeFields);
    setFormError("");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Service name is required."); return; }
    if (!form.price.trim() || isNaN(Number(form.price))) { setFormError("Please enter a valid price."); return; }
    if (!user) return;
    setFormError("");
    const priceNum = Number(form.price);
    const priceFormatted = priceNum.toLocaleString();

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update({
          name: form.name.trim(),
          price: priceNum,
          duration_minutes: Number(form.duration),
          image_url: formImages[0] ?? null,
        })
        .eq("id", editingService.id);
      if (error) { setFormError("Failed to update service."); return; }
      setServices(services.map(s =>
        s.id === editingService.id
          ? { ...s, name: form.name, price: priceFormatted, duration: Number(form.duration), images: formImages, intakeFields: formIntakeFields }
          : s
      ));
      toast({ title: "Service updated", description: `"${form.name}" has been updated.` });
    } else {
      const { data, error } = await supabase
        .from("services")
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          price: priceNum,
          duration_minutes: Number(form.duration),
          image_url: formImages[0] ?? null,
          is_active: true,
        })
        .select()
        .single();
      if (error) { setFormError("Failed to add service."); return; }
      const newService: Service = {
        id: data.id,
        name: form.name,
        price: priceFormatted,
        duration: Number(form.duration),
        active: true,
        color: gradients[services.length % gradients.length],
        images: formImages,
        intakeFields: formIntakeFields,
      };
      setServices([...services, newService]);
      toast({ title: "Service added", description: `"${form.name}" is now live on your booking page.` });
    }
    setDialogOpen(false);
  };

  const deleteService = async (id: string) => {
    const svc = services.find(s => s.id === id);
    await supabase.from("services").delete().eq("id", id);
    setServices(services.filter(s => s.id !== id));
    toast({ title: "Service deleted", description: `"${svc?.name}" has been removed.` });
  };

  const toggleService = async (id: string) => {
    const svc = services.find(s => s.id === id);
    if (!svc) return;
    const newActive = !svc.active;
    await supabase.from("services").update({ is_active: newActive }).eq("id", id);
    setServices(services.map(s => s.id === id ? { ...s, active: newActive } : s));
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
            <p className="text-sm font-medium">Beta — {services.length} of {MAX_FREE_SERVICES} services used</p>
            <Progress value={(services.length / MAX_FREE_SERVICES) * 100} className="h-2 mt-2" />
          </div>
          <Badge variant="outline" className="text-xs text-primary border-primary/30 shrink-0">Free during beta</Badge>
        </CardContent>
      </Card>

      {loadingServices ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading services…</div>
      ) : services.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">No services yet</p>
              <p className="text-muted-foreground text-sm mt-1">Add your first service to start accepting bookings.</p>
            </div>
            <Button className="gap-2" onClick={openAdd}>
              <Plus className="w-4 h-4" />
              Add Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
          >
            <Card className={`overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${!service.active ? "opacity-70 grayscale-[0.3]" : ""}`}>
              {/* Image banner — scrollable if photos exist */}
              <div className="relative">
                <ServiceImageBanner service={service} />
                {/* Actions menu overlay */}
                <div className="absolute top-3 right-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 bg-black/25 text-white hover:bg-black/45 backdrop-blur-sm border-none"
                      >
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

      {/* Add / Edit Service dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingService ? "Update your service details and photos." : "Add a new service with photos that clients will see when booking."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Image upload */}
            <ImageUploadArea images={formImages} onChange={setFormImages} />

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

            <Separator />

            {/* Intake fields */}
            <IntakeFieldsEditor fields={formIntakeFields} onChange={setFormIntakeFields} />
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
