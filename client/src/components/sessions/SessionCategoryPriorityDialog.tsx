import * as React from "react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCategoryPriorities, useSetCategoryPriorities } from "@/hooks/use-products";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCategoryItemProps {
  category: string;
  index: number;
  total: number;
}

function SortableCategoryItem({ category, index }: SortableCategoryItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-xl border text-sm font-medium transition-all bg-white/50 backdrop-blur-md",
        isDragging ? "shadow-2xl border-primary scale-[1.02] bg-white" : "border-border/50 hover:bg-white/80"
      )}
    >
      <div {...attributes} {...listeners} className="p-1.5 cursor-grab active:cursor-grabbing hover:bg-primary/10 rounded-lg transition-colors touch-none">
        <GripVertical className="w-4 h-4 text-primary/40" />
      </div>
      
      <span className="flex-1 select-none text-foreground/80">{category}</span>
      
      <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 text-[10px] h-5">
        #{index + 1}
      </Badge>
    </div>
  );
}

interface SessionCategoryPriorityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
}

export function SessionCategoryPriorityDialog({ open, onOpenChange, categories }: SessionCategoryPriorityDialogProps) {
  const { data: priorities, isLoading } = useCategoryPriorities();
  const setCategoryPriorities = useSetCategoryPriorities();
  const [orderedCategories, setOrderedCategories] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!open || categories.length === 0) return;
    if (priorities && priorities.length > 0) {
      const priorityMap = new Map(priorities.map((p: any) => [p.categoryName, p.sortOrder]));
      const sorted = [...categories].sort((a, b) => {
        const aPriority = priorityMap.get(a) ?? 999;
        const bPriority = priorityMap.get(b) ?? 999;
        return aPriority - bPriority;
      });
      setOrderedCategories(sorted);
    } else if (!isLoading) {
      setOrderedCategories([...categories]);
    }
  }, [open, categories, priorities, isLoading]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedCategories((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    const priorityData = orderedCategories.map((cat, i) => ({
      categoryName: cat,
      sortOrder: i,
    }));
    setCategoryPriorities.mutate(priorityData, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-foreground/80">Urutan Prioritas Kategori</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-xl border border-primary/10">
            Tahan dan seret ikon <GripVertical className="inline w-3 h-3 text-primary/40 mx-1" /> untuk mengubah urutan kategori saat melakukan perhitungan stok.
          </p>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : orderedCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada kategori ditemukan.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
                <SortableContext items={orderedCategories} strategy={verticalListSortingStrategy}>
                  {orderedCategories.map((cat, index) => (
                    <SortableCategoryItem 
                      key={cat} 
                      category={cat} 
                      index={index} 
                      total={orderedCategories.length} 
                    />
                  ))}
                </SortableContext>
              </div>
            </DndContext>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">Batal</Button>
          <Button onClick={handleSave} disabled={setCategoryPriorities.isPending} className="rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
            {setCategoryPriorities.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Simpan Urutan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
