import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  X, Play, Pause, RotateCcw, RotateCw, ChevronDown,
  Music, Type, Mic, Link2, Captions, Sparkles, SlidersHorizontal,
  Plus, Download
} from "lucide-react";

interface CaptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  words?: { word: string; start: number; end: number }[];
}

interface VideoClip {
  id: string;
  url: string;
  duration: number;
  thumbnailUrl?: string;
}

interface VideoEditorProps {
  videoUrl?: string;
  clips?: VideoClip[];
  captions?: CaptionSegment[];
  voiceoverUrl?: string;
  isProcessing?: boolean;
  processingProgress?: number;
  projectName?: string;
  onClose?: () => void;
  onExport?: () => void;
  onAddClip?: () => void;
}

export function VideoEditor({
  videoUrl,
  clips = [],
  captions = [],
  voiceoverUrl,
  isProcessing = false,
  processingProgress = 0,
  projectName = "New project",
  onClose,
  onExport,
  onAddClip,
}: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeCaption, setActiveCaption] = useState<CaptionSegment | null>(null);
  const [highlightedWord, setHighlightedWord] = useState<string>("");

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      const caption = captions.find(c => time >= c.startTime && time <= c.endTime);
      setActiveCaption(caption || null);
      
      if (caption?.words) {
        const word = caption.words.find(w => time >= w.start && time <= w.end);
        setHighlightedWord(word?.word || "");
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const timelineMarkers = [];
  for (let i = 0; i <= Math.ceil(duration); i++) {
    timelineMarkers.push(i);
  }

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-white/60 hover:text-white p-2"
          data-testid="button-close-processing"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{processingProgress.toFixed(1)}%</h1>
          <p className="text-white/60 text-sm max-w-xs mx-auto">
            Please don't close the app or lock your screen.
            You can choose where to share your video next.
          </p>
        </div>
        
        <div className="relative w-64">
          <div 
            className="absolute inset-0 rounded-[2.5rem] p-1"
            style={{
              background: "linear-gradient(180deg, #FF6B6B 0%, #FF8E53 25%, #F093FB 50%, #7C3AED 75%, #4F46E5 100%)",
            }}
          >
            <div className="w-full h-full bg-black rounded-[2.25rem]" />
          </div>
          
          <div className="relative z-10 p-3">
            <div className="bg-gray-900 rounded-[2rem] overflow-hidden aspect-[9/16]">
              {videoUrl ? (
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Sparkles className="w-12 h-12 text-purple-400 animate-pulse" />
                </div>
              )}
              
              {activeCaption && (
                <div className="absolute bottom-8 left-0 right-0 text-center px-4">
                  <span className="bg-black/70 text-white px-3 py-1 rounded text-sm">
                    {activeCaption.words ? (
                      activeCaption.words.map((w, i) => (
                        <span 
                          key={i}
                          className={cn(
                            "transition-colors",
                            w.word === highlightedWord ? "text-yellow-400" : "text-white"
                          )}
                        >
                          {w.word}{" "}
                        </span>
                      ))
                    ) : (
                      activeCaption.text
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white p-1"
            data-testid="button-close-editor"
          >
            <X className="w-5 h-5" />
          </button>
          <button className="flex items-center gap-1 text-white text-sm font-medium">
            {projectName}
            <ChevronDown className="w-4 h-4 text-white/60" />
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm">2K</span>
          <Button 
            size="sm" 
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={onExport}
            data-testid="button-export"
          >
            Export
          </Button>
        </div>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-lg overflow-hidden">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-cover"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              data-testid="video-preview"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-white/40 text-sm">No video loaded</p>
            </div>
          )}
          
          {activeCaption && (
            <div className="absolute bottom-8 left-0 right-0 text-center px-4">
              <span className="bg-black/70 text-white px-3 py-1.5 rounded text-base">
                {activeCaption.words ? (
                  activeCaption.words.map((w, i) => (
                    <span 
                      key={i}
                      className={cn(
                        "transition-colors",
                        w.word === highlightedWord ? "text-yellow-400 font-semibold" : "text-white"
                      )}
                    >
                      {w.word}{" "}
                    </span>
                  ))
                ) : (
                  activeCaption.text
                )}
              </span>
            </div>
          )}
          
          <button 
            className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/60"
            data-testid="button-expand-preview"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="px-4 py-2">
        <div className="flex items-center justify-center gap-4 mb-2">
          <button 
            onClick={handlePlayPause}
            className="text-white p-2"
            data-testid="button-play-pause"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <div className="text-white text-sm font-medium">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/40 ml-1">/ {formatTime(duration)}</span>
          </div>
          
          <button className="text-white/60 p-2">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button className="text-white/60 p-2">
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative mb-2">
          <div className="flex justify-between text-white/40 text-xs px-1 mb-1">
            {timelineMarkers.slice(0, 10).map((sec) => (
              <span key={sec}>{sec}s</span>
            ))}
          </div>
          
          <div className="relative h-1 bg-white/20 rounded-full">
            <div 
              className="absolute left-0 top-0 h-full bg-white rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
        
        {captions.length > 0 && (
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {captions.map((caption) => (
              <div
                key={caption.id}
                className={cn(
                  "flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap",
                  activeCaption?.id === caption.id
                    ? "bg-purple-600 text-white"
                    : "bg-pink-600/80 text-white/90"
                )}
                style={{
                  width: `${((caption.endTime - caption.startTime) / duration) * 100}%`,
                  minWidth: "80px",
                }}
              >
                {caption.text.slice(0, 20)}...
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
          {clips.map((clip, i) => (
            <div
              key={clip.id}
              className="flex-shrink-0 w-16 h-16 rounded overflow-hidden relative"
            >
              {clip.thumbnailUrl ? (
                <img 
                  src={clip.thumbnailUrl} 
                  alt={`Clip ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={clip.url}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              {i === 0 && (
                <div className="absolute bottom-1 left-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">1</span>
                </div>
              )}
            </div>
          ))}
          
          <button 
            onClick={onAddClip}
            className="flex-shrink-0 w-16 h-16 rounded bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            data-testid="button-add-clip"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
      
      <nav className="flex items-center justify-around px-2 py-3 border-t border-white/10 bg-black">
        <ToolbarButton icon={Music} label="Audio" />
        <ToolbarButton icon={Type} label="Text" />
        <ToolbarButton icon={Mic} label="Voice" />
        <ToolbarButton icon={Link2} label="Links" />
        <ToolbarButton icon={Captions} label="Captions" active />
        <ToolbarButton icon={Sparkles} label="Filters" />
        <ToolbarButton icon={SlidersHorizontal} label="Adjust" />
      </nav>
    </div>
  );
}

function ToolbarButton({ 
  icon: Icon, 
  label, 
  active = false,
  onClick 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-2 py-1 rounded transition-colors",
        active ? "text-white" : "text-white/50 hover:text-white/80"
      )}
      data-testid={`button-toolbar-${label.toLowerCase()}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export function ProcessingOverlay({
  progress,
  videoUrl,
  caption,
  onClose,
}: {
  progress: number;
  videoUrl?: string;
  caption?: string;
  onClose?: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50">
      <button 
        onClick={onClose}
        className="absolute top-4 left-4 text-white/60 hover:text-white p-2"
        data-testid="button-close-processing"
      >
        <X className="w-6 h-6" />
      </button>
      
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white mb-3">{progress.toFixed(1)}%</h1>
        <p className="text-white/60 text-sm max-w-xs mx-auto leading-relaxed">
          Please don't close the app or lock your screen.
          You can choose where to share your video next.
        </p>
      </div>
      
      <div className="relative w-72">
        <div 
          className="absolute inset-0 rounded-[3rem] p-1.5"
          style={{
            background: "linear-gradient(180deg, #FF6B6B 0%, #FF8E53 20%, #F093FB 50%, #A855F7 75%, #7C3AED 100%)",
          }}
        >
          <div className="w-full h-full bg-black rounded-[2.5rem]" />
        </div>
        
        <div className="relative z-10 p-4">
          <div className="bg-gray-900 rounded-[2.25rem] overflow-hidden aspect-[9/16]">
            {videoUrl ? (
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
                <Sparkles className="w-16 h-16 text-purple-400 animate-pulse" />
              </div>
            )}
            
            {caption && (
              <div className="absolute bottom-12 left-0 right-0 text-center px-4">
                <span className="bg-black/80 text-white px-4 py-1.5 rounded-md text-sm font-medium">
                  {caption}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
