import * as React from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  initialIndex: number;
  title: string;
  productId: number;
  onDelete?: (idx: number) => void;
}

export function PhotoLightbox({
  open,
  onOpenChange,
  photos,
  initialIndex,
  title,
  productId,
  onDelete
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);

  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    }
  }, [open, initialIndex]);

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setScale(s => Math.min(s * 1.5, 5));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(s => {
      const newScale = Math.max(s / 1.5, 1);
      if (newScale === 1) setTranslate({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  const goTo = useCallback((idx: number) => {
    setCurrentIndex(idx);
    resetZoom();
  }, [resetZoom]);

  const goPrev = useCallback(() => {
    if (photos.length > 1) goTo((currentIndex - 1 + photos.length) % photos.length);
  }, [currentIndex, photos.length, goTo]);

  const goNext = useCallback(() => {
    if (photos.length > 1) goTo((currentIndex + 1) % photos.length);
  }, [currentIndex, photos.length, goTo]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => {
      const newScale = Math.min(Math.max(s * delta, 1), 5);
      if (newScale === 1) setTranslate({ x: 0, y: 0 });
      return newScale;
    });
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  }, [scale, resetZoom]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (scale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [scale, translate]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || scale <= 1) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setTranslate({
      x: translateStart.current.x + dx,
      y: translateStart.current.y + dy,
    });
  }, [isDragging, scale]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDist.current = Math.hypot(dx, dy);
      pinchStartScale.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        handleDoubleClick();
      }
      lastTap.current = now;
    }
  }, [scale, handleDoubleClick]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const newScale = Math.min(Math.max(pinchStartScale.current * (dist / pinchStartDist.current), 1), 5);
      setScale(newScale);
      if (newScale === 1) setTranslate({ x: 0, y: 0 });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goPrev, goNext, onOpenChange, zoomIn, zoomOut, resetZoom]);

  if (photos.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-3 pb-1 flex-shrink-0 flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm">Foto Opname - {title} ({currentIndex + 1}/{photos.length})</DialogTitle>
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 rounded-xl px-3"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(currentIndex);
              }}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Hapus
            </Button>
          )}
        </DialogHeader>
        <div className="relative flex flex-col flex-1 min-h-0">
          <div
            ref={containerRef}
            className="relative w-full flex-1 min-h-0 bg-black/5 dark:bg-black/20 overflow-hidden select-none"
            style={{ touchAction: scale > 1 ? "none" : "pan-y" }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            data-testid={`lightbox-container-${productId}`}
          >
            <img
              src={photos[currentIndex]}
              alt={`Foto ${title} ${currentIndex + 1}`}
              className="w-full h-full object-contain transition-transform duration-150"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in",
              }}
              draggable={false}
              data-testid={`img-preview-${productId}`}
            />

            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goPrev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  data-testid={`button-lightbox-prev-${productId}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goNext(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  data-testid={`button-lightbox-next-${productId}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute bottom-3 right-3 flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                data-testid={`button-zoom-out-${productId}`}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-white bg-black/50 rounded-full px-2 py-1 min-w-[3rem] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                data-testid={`button-zoom-in-${productId}`}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {scale > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                  className="w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  data-testid={`button-zoom-reset-${productId}`}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {photos.length > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 flex-wrap">
              {photos.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={cn(
                    "w-12 h-12 rounded-md overflow-hidden border-2 cursor-pointer flex-shrink-0",
                    idx === currentIndex ? "border-primary" : "border-border/50"
                  )}
                  data-testid={`button-lightbox-thumb-${idx}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
