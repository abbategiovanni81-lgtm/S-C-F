import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Folder, FolderOpen, Video, ChevronLeft, Search, AlertCircle, Check, HardDrive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  size?: string;
  modifiedTime?: string;
}

interface DriveFolder {
  id: string;
  name: string;
}

interface GoogleDriveBrowserProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVideoSelected: (videoUrl: string, fileName: string) => void;
}

function formatBytes(bytes: string | undefined): string {
  if (!bytes) return "";
  const b = parseInt(bytes, 10);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function GoogleDriveBrowser({ open, onOpenChange, onVideoSelected }: GoogleDriveBrowserProps) {
  const { toast } = useToast();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [videos, setVideos] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [folderStack, setFolderStack] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "My Drive" }]);

  const currentFolderId = folderStack[folderStack.length - 1].id;

  useEffect(() => {
    if (open) {
      checkConnection();
    }
  }, [open]);

  useEffect(() => {
    if (connected && open) {
      loadContents();
    }
  }, [connected, currentFolderId, open]);

  async function checkConnection() {
    try {
      const res = await fetch("/api/drive/status");
      const data = await res.json();
      setConnected(data.connected);
    } catch {
      setConnected(false);
    }
  }

  async function loadContents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFolderId) params.append("folderId", currentFolderId);
      if (searchQuery) params.append("search", searchQuery);

      const [foldersRes, videosRes] = await Promise.all([
        fetch(`/api/drive/folders?${new URLSearchParams({ parentId: currentFolderId || "" })}`),
        fetch(`/api/drive/videos?${params}`)
      ]);

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData.folders || []);
      }

      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData.videos || []);
      }
    } catch (error: any) {
      toast({ title: "Failed to load Drive contents", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectVideo(file: DriveFile) {
    setSelecting(file.id);
    try {
      const res = await fetch("/api/drive/select-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, fileName: file.name })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to select video");
      }

      const data = await res.json();
      onVideoSelected(data.videoUrl, data.fileName);
      onOpenChange(false);
      toast({ title: "Video selected", description: `${file.name} is ready to use` });
    } catch (error: any) {
      toast({ title: "Selection failed", description: error.message, variant: "destructive" });
    } finally {
      setSelecting(null);
    }
  }

  function navigateToFolder(folder: DriveFolder) {
    setFolderStack([...folderStack, { id: folder.id, name: folder.name }]);
    setSearchQuery("");
  }

  function navigateBack() {
    if (folderStack.length > 1) {
      setFolderStack(folderStack.slice(0, -1));
      setSearchQuery("");
    }
  }

  function handleSearch() {
    loadContents();
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            Select Video from Google Drive
          </DialogTitle>
          <DialogDescription>
            Browse your Google Drive and select a video to use for your Reel (max 100MB).
          </DialogDescription>
        </DialogHeader>

        {connected === null && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {connected === false && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-500" />
            <p className="text-muted-foreground mb-4">Google Drive is not connected yet.</p>
            <p className="text-sm text-muted-foreground">
              Please connect your Google Drive from the account settings or contact support.
            </p>
          </div>
        )}

        {connected === true && (
          <>
            <div className="flex items-center gap-2 pb-2 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={navigateBack}
                disabled={folderStack.length <= 1}
                data-testid="button-drive-back"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {folderStack.map((f, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {i > 0 && <span>/</span>}
                    <span className={i === folderStack.length - 1 ? "font-medium text-foreground" : ""}>
                      {f.name}
                    </span>
                  </span>
                ))}
              </div>
              <div className="flex-1" />
              <div className="flex gap-2">
                <Input
                  placeholder="Search videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-48"
                  data-testid="input-drive-search"
                />
                <Button size="sm" onClick={handleSearch} disabled={loading} data-testid="button-drive-search">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {!loading && folders.length === 0 && videos.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No folders or videos found here</p>
                </div>
              )}

              {!loading && (
                <div className="space-y-4 p-1">
                  {folders.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Folders</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => navigateToFolder(folder)}
                            className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30 hover:bg-muted transition-colors text-left"
                            data-testid={`button-folder-${folder.id}`}
                          >
                            <Folder className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <span className="text-sm truncate">{folder.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {videos.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Videos</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {videos.map((video) => (
                          <div
                            key={video.id}
                            className="relative group rounded-lg border overflow-hidden bg-muted/30"
                            data-testid={`card-video-${video.id}`}
                          >
                            <div className="aspect-video bg-black/10 flex items-center justify-center">
                              {video.thumbnailLink ? (
                                <img
                                  src={video.thumbnailLink}
                                  alt={video.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Video className="w-8 h-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="p-2">
                              <p className="text-sm font-medium truncate" title={video.name}>
                                {video.name}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {formatBytes(video.size)}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleSelectVideo(video)}
                                  disabled={selecting !== null}
                                  data-testid={`button-select-video-${video.id}`}
                                >
                                  {selecting === video.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  <span className="ml-1">Select</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
