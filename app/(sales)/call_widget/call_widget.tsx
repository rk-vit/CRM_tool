'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Phone,
  X,
  Minimize2,
  Maximize2,
  Volume2,
  Mic,
  MicOff,
} from 'lucide-react';

interface FloatingCallWidgetProps {
  contactName: string;
  onClose: () => void;
}

export function FloatingCallWidget({
  contactName,
  onClose,
}: FloatingCallWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: window.innerWidth - 380, y: 100 });
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const dragRef = useRef<{ startX: number; startY: number; startPos: typeof position } | null>(null);

  // Timer for call duration
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPos: { ...position },
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    setPosition({
      x: dragRef.current.startPos.x + deltaX,
      y: dragRef.current.startPos.y + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 40,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <button
          onClick={() => setIsMinimized(false)}
          onMouseDown={handleMouseDown}
          className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-grab active:cursor-grabbing"
        >
          <Phone className="w-5 h-5" />
          <span className="text-sm font-medium">{formatDuration(callDuration)}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 40,
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Card className="w-80 border border-border shadow-2xl rounded-lg overflow-hidden bg-card">
        {/* Header - Draggable */}
        <div
          onMouseDown={handleMouseDown}
          className="bg-gradient-to-r from-accent to-accent/90 text-accent-foreground px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing"
        >
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">In Call</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">{contactName}</h3>
          </div>

          {/* Call Duration */}
          <div className="bg-secondary p-4 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Duration</p>
            <p className="text-3xl font-bold text-foreground font-mono">
              {formatDuration(callDuration)}
            </p>
          </div>

          {/* Controls */}
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant="outline"
              size="sm"
              className={`border-border hover:bg-secondary ${
                isMuted ? 'bg-red-50 border-red-200' : ''
              }`}
            >
              {isMuted ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-border hover:bg-secondary"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>

          {/* End Call Button */}
          <Button
            onClick={onClose}
            className="w-full bg-red-500 hover:bg-red-600 text-white"
            disabled
          >
            Please End Call in Your Mobile
          </Button>

          {/* Notes Section */}
          <div className="border-t border-border pt-4">
            <label className="text-xs font-medium text-foreground block mb-2">
              Call Notes
            </label>
            <textarea
              placeholder="Add notes about this call..."
              className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              rows={3}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
