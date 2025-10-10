import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { BookOpen, Upload, Download, Shield } from "lucide-react";
import heroImage from "@/assets/hero-image.png";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    setIsAdmin(!!data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} isAdmin={isAdmin} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Your College{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Study Hub
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Share and access previous year questions and notes. Built by students, for students.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/browse">
                  <Button size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    Browse Materials
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button size="lg" variant="outline">
                    Upload
                  </Button>
                </Link>
                {!user && (
                  <Link to="/auth">
                    <Button size="lg" variant="secondary">
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-3xl" />
              <img
                src={heroImage}
                alt="StudyHub - College study materials platform"
                className="relative rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow">
              <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg w-fit mb-4">
                <Upload className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload Materials</h3>
              <p className="text-muted-foreground">
                Share your PYQs and notes anonymously with the community. Help fellow students succeed.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow">
              <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg w-fit mb-4">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Admin Approval</h3>
              <p className="text-muted-foreground">
                All uploads are reviewed by admins to ensure quality and authenticity.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-shadow">
              <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-lg w-fit mb-4">
                <Download className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Access Anytime</h3>
              <p className="text-muted-foreground">
                Download materials whenever you need them. Study smarter, not harder.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Index;
