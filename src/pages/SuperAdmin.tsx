import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, UserPlus } from "lucide-react";

export default function SuperAdmin() {
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      checkSuperAdminStatus();
    }
  }, [user]);

  const checkSuperAdminStatus = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!data) {
      navigate("/");
      toast({
        title: "Access denied",
        description: "You don't have super admin privileges",
        variant: "destructive",
      });
      return;
    }

    setIsSuperAdmin(true);
    fetchAdmins();
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role,
          profiles:user_id (email, full_name)
        `)
        .eq("role", "admin");

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast({
        title: "Error loading admins",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Add admin role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "admin",
          });

        if (roleError) throw roleError;

        toast({ title: "Admin added successfully!" });
        setEmail("");
        setPassword("");
        fetchAdmins();
      }
    } catch (error: any) {
      console.error("Error adding admin:", error);
      toast({
        title: "Failed to add admin",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) return;

    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) throw error;

      toast({ title: "Admin removed successfully" });
      fetchAdmins();
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "Failed to remove admin",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} isAdmin={true} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage administrators</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Add New Admin</CardTitle>
              <CardDescription>Create a new admin account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Adding..." : "Add Admin"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Admins ({admins.length})</CardTitle>
              <CardDescription>Manage existing administrators</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No admins found</div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div
                      key={admin.user_id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{admin.profiles?.email}</p>
                        {admin.profiles?.full_name && (
                          <p className="text-sm text-muted-foreground">{admin.profiles.full_name}</p>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveAdmin(admin.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
