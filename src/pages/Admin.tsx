import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { MaterialCard } from "@/components/MaterialCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingMaterials, setPendingMaterials] = useState<any[]>([]);
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!data) {
      navigate("/");
      toast({
        title: "Access denied",
        description: "You don't have admin privileges",
        variant: "destructive",
      });
      return;
    }

    setIsAdmin(true);
    fetchMaterials();
  };

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select(`
          *,
          profiles:uploaded_by (email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPendingMaterials(data?.filter((m) => m.status === "pending") || []);
      setAllMaterials(data || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast({
        title: "Error loading materials",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("materials")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Material approved!" });
      fetchMaterials();
    } catch (error) {
      console.error("Approval error:", error);
      toast({
        title: "Approval failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from("materials")
        .update({
          status: "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Material rejected" });
      fetchMaterials();
    } catch (error) {
      console.error("Rejection error:", error);
      toast({
        title: "Rejection failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const { error } = await supabase
        .from("materials")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Material deleted successfully" });
      fetchMaterials();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/upload?edit=${id}`);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage uploaded materials</p>
          </div>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingMaterials.length})
              </TabsTrigger>
              <TabsTrigger value="all">All Materials ({allMaterials.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : pendingMaterials.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No pending materials</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pendingMaterials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      id={material.id}
                      title={material.title}
                      description={material.description}
                      subject={material.subject}
                      year={material.year}
                      semester={material.semester}
                      materialType={material.material_type}
                      fileName={material.file_name}
                      filePath={material.file_path}
                      uploadedBy={material.profiles?.email || "Unknown"}
                      createdAt={material.created_at}
                      status={material.status}
                      showActions
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : allMaterials.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No materials found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allMaterials.map((material) => (
                    <MaterialCard
                      key={material.id}
                      id={material.id}
                      title={material.title}
                      description={material.description}
                      subject={material.subject}
                      year={material.year}
                      semester={material.semester}
                      materialType={material.material_type}
                      fileName={material.file_name}
                      filePath={material.file_path}
                      uploadedBy={material.profiles?.email || "Unknown"}
                      createdAt={material.created_at}
                      status={material.status}
                      showEdit
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
