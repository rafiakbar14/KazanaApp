import { useState, useEffect, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Branch } from "@shared/schema";

interface BranchContextType {
  selectedBranchId: number | null;
  setSelectedBranchId: (id: number | null) => void;
  selectedBranch: Branch | null;
  branches: Branch[];
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    const saved = localStorage.getItem("selectedBranchId");
    return saved ? parseInt(saved) : null;
  });

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ["/api/branches"],
  });

  useEffect(() => {
    if (selectedBranchId) {
      localStorage.setItem("selectedBranchId", selectedBranchId.toString());
    } else {
      localStorage.removeItem("selectedBranchId");
    }
  }, [selectedBranchId]);

  const selectedBranch = branches.find(b => b.id === selectedBranchId) || null;

  return (
    <BranchContext.Provider value={{ 
      selectedBranchId, 
      setSelectedBranchId, 
      selectedBranch, 
      branches, 
      isLoading 
    }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
}
