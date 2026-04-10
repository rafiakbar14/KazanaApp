import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";

interface SignaturePadProps {
    onSave: (dataUrl: string) => void;
    onClear?: () => void;
    defaultValue?: string;
    label?: string;
    readOnly?: boolean;
}

export function SignaturePad({ onSave, onClear, defaultValue, label, readOnly }: SignaturePadProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(!defaultValue);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Handle high DPI screens
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        ctx.lineCap = "round";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#000";

        if (defaultValue) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, rect.width, rect.height);
            };
            img.src = defaultValue;
        }
    }, [defaultValue]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly) return;
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        if (readOnly) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.beginPath();
            setIsEmpty(false);
            onSave(canvas.toDataURL());
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || readOnly) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ("touches" in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.moveTo(x, y);
    };

    const clear = () => {
        if (readOnly) return;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setIsEmpty(true);
                if (onClear) onClear();
                onSave("");
            }
        }
    };

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</label>}
            <div className="relative group">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseUp={stopDrawing}
                    onMouseMove={draw}
                    onTouchStart={startDrawing}
                    onTouchEnd={stopDrawing}
                    onTouchMove={draw}
                    className={`w-full h-40 bg-white border-2 ${readOnly ? 'border-border' : 'border-dashed border-primary/30'} rounded-xl cursor-crosshair touch-none transition-colors duration-200`}
                    style={{ width: '100%', height: '160px' }}
                />
                {!readOnly && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="outline" className="h-8 w-8 bg-white/80 backdrop-blur-sm" onClick={clear}>
                            <Eraser className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                {readOnly && !defaultValue && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40 text-sm italic">
                        Belum ada tanda tangan
                    </div>
                )}
            </div>
        </div>
    );
}
