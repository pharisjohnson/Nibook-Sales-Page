import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { insforge } from "@/lib/insforge";
import { UserPlus, MoreHorizontal, Mail, Clock, Crown, Shield, Users, AlertCircle, Loader2 } from "lucide-react";

type Role = "Owner" | "Admin" | "Staff";
interface Member {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  joinedDate: string;
  status: "active" | "pending";
}

type Invite = { id: number; email: string; role: Role; sentAt: string };

const roleConfig: Record<Role, { color: string; icon: React.ElementType }> = {
  Owner: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Crown },
  Admin: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Shield },
  Staff: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: Users },
};

export default function TeamPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Staff");
  const [inviteError, setInviteError] = useState("");

  const totalSeats = 3;
  const usedSeats = members.length;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      insforge.database.from("team_members").select("*").eq("owner_id", user.id),
      insforge.database.from("team_invites").select("*").eq("owner_id", user.id).eq("status", "pending"),
    ]).then(([membersRes, invitesRes]) => {
      const membersData = (membersRes.data || []).map((m: any) => ({
        id: m.id,
        name: m.name || m.email.split("@")[0],
        email: m.email,
        role: m.role as Role,
        avatar: `https://i.pravatar.cc/150?u=${m.email}`,
        joinedDate: new Date(m.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        status: "active" as const,
      }));
      const invitesData = (invitesRes.data || []).map((i: any) => ({
        id: i.id,
        email: i.email,
        role: i.role as Role,
        sentAt: new Date(i.created_at).toLocaleDateString(),
      }));
      setMembers(membersData);
      setInvites(invitesData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const handleInvite = () => {
    if (!inviteEmail.trim()) { setInviteError("Email is required."); return; }
    if (!/\S+@\S+\.\S+/.test(inviteEmail)) { setInviteError("Please enter a valid email."); return; }
    if (usedSeats >= totalSeats) { setInviteError("Seat limit reached. Upgrade to Pro to add more."); return; }
    insforge.database.from("team_invites").insert({
      email: inviteEmail,
      role: inviteRole,
      owner_id: user?.id,
      status: "pending",
    }).then(() => {
      setInvites([...invites, { id: Date.now(), email: inviteEmail, role: inviteRole, sentAt: "just now" }]);
      setInviteEmail("");
      setInviteRole("Staff");
      setInviteError("");
      setInviteOpen(false);
    });
  };

  const changeRole = (id: number, role: Role) => {
    setMembers(members.map(m => m.id === id ? { ...m, role } : m));
    insforge.database.from("team_members").update({ role }).eq("id", id);
  };

  const removeMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id));
    insforge.database.from("team_members").delete().eq("id", id);
  };

  const cancelInvite = (id: number) => {
    setInvites(invites.filter(i => i.id !== id));
    insforge.database.from("team_invites").delete().eq("id", id);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">Manage your team members and their roles.</p>
        </div>
        <Button className="gap-2 shadow-md" onClick={() => { setInviteError(""); setInviteOpen(true); }}>
          <UserPlus className="w-4 h-4" />
          Invite Member
        </Button>
      </div>

      <Card className="bg-muted/40 border-dashed">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Team seats used</p>
              <span className="text-sm font-bold">{usedSeats} / {totalSeats}</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${(usedSeats / totalSeats) * 100}%` }}
              />
            </div>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 bg-background">Upgrade for more seats</Button>
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h2 className="text-lg font-semibold">Active Members</h2>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : members.length > 0 ? (
          <Card className="shadow-sm overflow-hidden">
            <div className="divide-y">
              {members.map((member) => {
                const RoleIcon = roleConfig[member.role].icon;
                return (
                  <div key={member.id} className="p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {member.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{member.name}</p>
                        <Badge variant="outline" className={`text-xs ${roleConfig[member.role].color}`}>
                          <RoleIcon className="w-3 h-3 mr-1" />
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Joined {member.joinedDate}</p>
                    </div>
                  {member.role !== "Owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => changeRole(member.id, "Admin")}>Make Admin</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => changeRole(member.id, "Staff")}>Make Staff</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => removeMember(member.id)}
                        >
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardContent className="p-10 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No team members yet. Invite someone to get started!</p>
          </CardContent>
        </Card>
      )}
      </motion.div>

      {invites.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h2 className="text-lg font-semibold">Pending Invitations</h2>
          <Card className="shadow-sm overflow-hidden">
            <div className="divide-y">
              {invites.map((invite) => (
                <div key={invite.id} className="p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="h-11 w-11 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{invite.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Sent {invite.sentAt}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-8">Resend</Button>
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-destructive hover:text-destructive" onClick={() => cancelInvite(invite.id)}>Cancel</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Role permissions</p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Owner</strong> — Full access. <strong>Admin</strong> — Manage bookings, services, and team. <strong>Staff</strong> — View and manage bookings only.
            </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>They'll receive an email to join your workspace.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={e => { setInviteEmail(e.target.value); setInviteError(""); }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin — Full management access</SelectItem>
                  <SelectItem value="Staff">Staff — Bookings only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteError && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {inviteError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
