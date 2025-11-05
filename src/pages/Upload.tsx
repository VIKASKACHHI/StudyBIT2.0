import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon } from "lucide-react";
import { z } from "zod";
import { Footer } from "@/components/Footer";

const uploadSchema = z.object({
  subject: z
    .string()
    .min(2, "Subject is required")
    .max(100, "Subject too long"),
  year: z.string().optional(),
  semester: z.string().optional(),
  materialType: z.enum(["pyq", "notes"]),
});

export default function Upload() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [course, setCourse] = useState("");
  const [branch, setBranch] = useState("");
  const [materialType, setMaterialType] = useState<"pyq" | "notes">("pyq");
  const [file, setFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [existingFilePath, setExistingFilePath] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
      const editIdParam = searchParams.get("edit");
      if (editIdParam) {
        setEditId(editIdParam);
        loadMaterialData(editIdParam);
      }
    }
  }, [user, searchParams]);

  const checkAdminStatus = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user?.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const loadMaterialData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        setSubject(data.subject);
        setYear(data.year || "");
        setSemester(data.semester || "");
        setCourse(data.course || "");
        setBranch(data.branch || "");
        setMaterialType(data.material_type);
        setExistingFilePath(data.file_path);
      }
    } catch (error: any) {
      console.error("Error loading material:", error);
      toast({
        title: "Error loading material",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file && !editId) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const validatedData = uploadSchema.parse({
        subject,
        year,
        semester,
        materialType,
      });

      setLoading(true);

      let filePath = existingFilePath;
      let fileName = file?.name;
      let fileSize = file?.size;

      // Upload new file if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        const userId = user?.id || "anonymous";
        filePath = `${userId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Delete old file if editing
        if (editId && existingFilePath) {
          await supabase.storage.from("materials").remove([existingFilePath]);
        }
      }

      const materialData = {
        subject: validatedData.subject,
        year: validatedData.year,
        semester: validatedData.semester,
        course: course || null,
        branch: branch || null,
        material_type: validatedData.materialType,
        ...(file && {
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
        }),
      };

      if (editId) {
        // Update existing material
        const { error: dbError } = await supabase
          .from("materials")
          .update(materialData)
          .eq("id", editId);

        if (dbError) throw dbError;

        toast({
          title: "Update successful!",
          description: "Material has been updated",
        });
        navigate("/admin");
      } else {
        // Create new material
        const { error: dbError } = await supabase.from("materials").insert({
          ...materialData,
          title: fileName.replace(/\.[^/.]+$/, ""),
          file_path: filePath,
          file_name: fileName,
          file_size: fileSize,
          uploaded_by: user?.id || null,
        });

        if (dbError) throw dbError;

        toast({
          title: "Upload successful!",
          description: "Your material is pending admin approval",
        });

        // Reset form
        setSubject("");
        setYear("");
        setSemester("");
        setCourse("");
        setBranch("");
        setMaterialType("pyq");
        setFile(null);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Upload error:", error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getBranchOptions = () => {
    if (course === "B.Tech") {
      return ["CSE", "ECE", "Mechanical", "Civil", "EEE", "IT"];
    } else if (course === "MCA") {
      return ["General"];
    } else if (course === "MBA") {
      return ["Finance", "Marketing", "HR", "Operations"];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-background flex flex-col min-h-screen">
      <main className="flex-grow">
        <Navbar user={user} isAdmin={isAdmin} />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {editId ? "Edit Material" : "Upload Material"}
                </CardTitle>
                <CardDescription>
                  {editId
                    ? "Update the material information and optionally replace the file."
                    : "Share your PYQs and notes anonymously with fellow students. All uploads require admin approval."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Computer Science"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type *</Label>
                      <Select
                        value={materialType}
                        onValueChange={(value: "pyq" | "notes") =>
                          setMaterialType(value)
                        }
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pyq">PYQ</SelectItem>
                          <SelectItem value="notes">Notes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        placeholder="2023"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Select
                        value={course}
                        onValueChange={(value) => {
                          setCourse(value);
                          setBranch("");
                        }}
                      >
                        <SelectTrigger id="course">
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="B.Tech">B.Tech</SelectItem>
                          <SelectItem value="MCA">MCA</SelectItem>
                          <SelectItem value="MBA">MBA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Select
                        value={branch}
                        onValueChange={setBranch}
                        disabled={!course}
                      >
                        <SelectTrigger id="branch">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {getBranchOptions().map((branchOption) => (
                            <SelectItem key={branchOption} value={branchOption}>
                              {branchOption}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select value={semester} onValueChange={setSemester}>
                        <SelectTrigger id="semester">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                            <SelectItem key={sem} value={sem.toString()}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">
                      File{" "}
                      {editId
                        ? "(Optional - leave empty to keep existing file)"
                        : "* (PDF, DOC, DOCX)"}
                    </Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <Input
                        id="file"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="max-w-xs mx-auto"
                        required={!editId}
                      />
                      {file && (
                        <p className="mt-4 text-sm text-muted-foreground">
                          Selected: {file.name} (
                          {(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                      {editId && !file && existingFilePath && (
                        <p className="mt-4 text-sm text-muted-foreground">
                          Current file will be kept
                        </p>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading
                      ? editId
                        ? "Updating..."
                        : "Uploading..."
                      : editId
                      ? "Update Material"
                      : "Upload Material"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </main>
      <Footer />
    </div>
  );
}
