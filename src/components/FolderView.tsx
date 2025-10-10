import { useState } from "react";
import { MaterialCard } from "./MaterialCard";
import { ChevronRight, ChevronDown, Folder } from "lucide-react";

interface Material {
  id: string;
  title: string;
  description?: string;
  subject: string;
  year?: string;
  semester?: string;
  material_type: "pyq" | "notes";
  file_name: string;
  file_path: string;
  profiles?: { email: string };
  created_at: string;
  course?: string;
  branch?: string;
}

interface FolderViewProps {
  materials: Material[];
}

export const FolderView = ({ materials }: FolderViewProps) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Organize materials into folder structure
  const folderStructure = materials.reduce((acc, material) => {
    const course = material.course || "Uncategorized";
    const branch = material.branch || "General";
    const semester = material.semester ? `Sem ${material.semester}` : "Other";
    
    const path = `${course}/${branch}/${semester}`;
    
    if (!acc[path]) {
      acc[path] = [];
    }
    acc[path].push(material);
    return acc;
  }, {} as Record<string, Material[]>);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // Group folders by course and branch
  const courseGroups = Object.keys(folderStructure).reduce((acc, path) => {
    const [course, branch] = path.split("/");
    const key = `${course}/${branch}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(path);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="space-y-6">
      {Object.entries(courseGroups).map(([courseKey, paths]) => {
        const [course, branch] = courseKey.split("/");
        const isExpanded = expandedFolders.has(courseKey);
        
        return (
          <div key={courseKey} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleFolder(courseKey)}
              className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left font-semibold"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
              <Folder className="h-5 w-5 text-primary" />
              <span>{course} / {branch}</span>
              <span className="ml-auto text-sm text-muted-foreground">
                ({paths.reduce((sum, p) => sum + folderStructure[p].length, 0)} materials)
              </span>
            </button>
            
            {isExpanded && (
              <div className="p-4 bg-accent/20 space-y-4">
                {paths.sort().map((path) => {
                  const semester = path.split("/")[2];
                  const isSemExpanded = expandedFolders.has(path);
                  
                  return (
                    <div key={path} className="border rounded-lg overflow-hidden bg-background">
                      <button
                        onClick={() => toggleFolder(path)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
                      >
                        {isSemExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <Folder className="h-4 w-4 text-accent" />
                        <span className="font-medium">{semester}</span>
                        <span className="ml-auto text-sm text-muted-foreground">
                          ({folderStructure[path].length} files)
                        </span>
                      </button>
                      
                      {isSemExpanded && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {folderStructure[path].map((material) => (
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
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
