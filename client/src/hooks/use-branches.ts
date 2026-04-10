import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type Branch } from "@shared/schema";

export function useBranches() {
    return useQuery<Branch[]>({
        queryKey: [api.branches.list.path],
    });
}
