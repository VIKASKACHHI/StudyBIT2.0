import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Calendar, User as UserIcon, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaterialCardProps {
  id: string;
  title: string;
  description?: string;
  subject: string;
  year?: string;
  semester?: string;
  materialType: "pyq" | "notes";
  fileName: string;
  filePath: string;
  uploadedBy: string;
  createdAt: string;
  status?: "pending" | "approved" | "rejected";
  showActions?: boolean;
  showEdit?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export const MaterialCard = ({
  id,
  title,
  description,
  subject,
  year,
  semester,
  materialType,
  fileName,
  filePath,
  uploadedBy,
  createdAt,
  status,
  showActions = false,
  showEdit = false,
  onApprove,
  onReject,
  onDelete,
  onEdit,
}: MaterialCardProps) => {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("materials")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Download started" });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="hover:shadow-[var(--shadow-hover)] transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="line-clamp-2">{description}</CardDescription>
          </div>
          <Badge variant={materialType === "pyq" ? "default" : "secondary"}>
            {materialType === "pyq" ? "PYQ" : "Notes"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span className="font-medium">{subject}</span>
            {year && <span>• Year: {year}</span>}
            {semester && <span>• Sem: {semester}</span>}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserIcon className="h-4 w-4" />
            <span className="truncate">{uploadedBy}</span>
          </div>
          {status && (
            <Badge
              variant={
                status === "approved"
                  ? "default"
                  : status === "rejected"
                  ? "destructive"
                  : "secondary"
              }
            >
              {status}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {showActions ? (
          <div className="flex gap-2 w-full">
            <Button onClick={handleDownload} className="flex-1" variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onApprove?.(id)}
              className="flex-1"
              variant="default"
              size="sm"
            >
              Approve
            </Button>
            <Button
              onClick={() => onReject?.(id)}
              className="flex-1"
              variant="destructive"
              size="sm"
            >
              Reject
            </Button>
          </div>
        ) : showEdit ? (
          <div className="flex gap-2 w-full">
            <Button onClick={handleDownload} className="flex-1" variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onEdit?.(id)}
              className="flex-1"
              variant="default"
              size="sm"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onDelete?.(id)}
              className="flex-1"
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button onClick={handleDownload} className="w-full" variant="default">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
