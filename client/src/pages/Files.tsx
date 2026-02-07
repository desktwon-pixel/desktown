import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  FolderOpen, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Download,
  Upload,
  Search,
  Grid,
  List,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLanguage, translations } from "@/lib/i18n";

interface FileItem {
  id: number;
  name: string;
  type: "folder" | "document" | "image" | "video" | "audio";
  size?: string;
  modifiedAt: string;
  path: string;
}

const mockFiles: FileItem[] = [
  { id: 1, name: "Documents", type: "folder", modifiedAt: "2024-01-15", path: "/documents" },
  { id: 2, name: "Images", type: "folder", modifiedAt: "2024-01-14", path: "/images" },
  { id: 3, name: "Videos", type: "folder", modifiedAt: "2024-01-13", path: "/videos" },
  { id: 4, name: "Project Report.pdf", type: "document", size: "2.4 MB", modifiedAt: "2024-01-15", path: "/documents/report.pdf" },
  { id: 5, name: "Team Photo.jpg", type: "image", size: "1.2 MB", modifiedAt: "2024-01-14", path: "/images/team.jpg" },
  { id: 6, name: "Presentation.mp4", type: "video", size: "45.6 MB", modifiedAt: "2024-01-13", path: "/videos/presentation.mp4" },
  { id: 7, name: "Meeting Notes.docx", type: "document", size: "156 KB", modifiedAt: "2024-01-12", path: "/documents/notes.docx" },
  { id: 8, name: "Audio Recording.mp3", type: "audio", size: "8.3 MB", modifiedAt: "2024-01-11", path: "/audio/recording.mp3" },
];

function getFileIcon(type: string) {
  switch (type) {
    case "folder":
      return <FolderOpen className="h-8 w-8 text-amber-500" />;
    case "document":
      return <FileText className="h-8 w-8 text-blue-500" />;
    case "image":
      return <Image className="h-8 w-8 text-green-500" />;
    case "video":
      return <Video className="h-8 w-8 text-purple-500" />;
    case "audio":
      return <Music className="h-8 w-8 text-pink-500" />;
    default:
      return <FileText className="h-8 w-8 text-gray-500" />;
  }
}

export default function Files() {
  const { language } = useLanguage();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredFiles = mockFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const folders = filteredFiles.filter(f => f.type === "folder");
  const files = filteredFiles.filter(f => f.type !== "folder");

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="bg-white dark:bg-card shadow-sm border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <FolderOpen className="h-6 w-6 text-primary" />
                {language === 'ar' ? 'مدير الملفات' : 'File Manager'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" data-testid="button-upload-file">
                  <Upload className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'رفع ملف' : 'Upload'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'ar' ? 'بحث في الملفات...' : 'Search files...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-files"
                />
              </div>
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button 
                  variant={viewMode === "grid" ? "default" : "ghost"} 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setViewMode("grid")}
                  data-testid="button-view-grid"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "ghost"} 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setViewMode("list")}
                  data-testid="button-view-list"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {folders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {language === 'ar' ? 'المجلدات' : 'Folders'}
                </h3>
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  : "space-y-2"
                }>
                  {folders.map((folder) => (
                    <div 
                      key={folder.id}
                      className={`${viewMode === "grid" 
                        ? "flex flex-col items-center p-4 rounded-lg border bg-card hover-elevate cursor-pointer"
                        : "flex items-center gap-4 p-3 rounded-lg border bg-card hover-elevate cursor-pointer"
                      }`}
                      data-testid={`folder-${folder.id}`}
                    >
                      {getFileIcon(folder.type)}
                      <span className={`${viewMode === "grid" ? "mt-2 text-center" : ""} text-sm font-medium truncate max-w-full`}>
                        {folder.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  {language === 'ar' ? 'الملفات' : 'Files'}
                </h3>
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  : "space-y-2"
                }>
                  {files.map((file) => (
                    <div 
                      key={file.id}
                      className={`${viewMode === "grid" 
                        ? "flex flex-col items-center p-4 rounded-lg border bg-card hover-elevate cursor-pointer group"
                        : "flex items-center justify-between p-3 rounded-lg border bg-card hover-elevate cursor-pointer group"
                      }`}
                      data-testid={`file-${file.id}`}
                    >
                      <div className={`${viewMode === "list" ? "flex items-center gap-4" : "flex flex-col items-center"}`}>
                        {getFileIcon(file.type)}
                        <div className={viewMode === "grid" ? "mt-2 text-center" : ""}>
                          <span className="text-sm font-medium truncate max-w-full block">
                            {file.name}
                          </span>
                          {file.size && (
                            <span className="text-xs text-muted-foreground">
                              {file.size}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity ${viewMode === "grid" ? "mt-2" : ""}`}
                        data-testid={`button-download-${file.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد ملفات' : 'No files found'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
