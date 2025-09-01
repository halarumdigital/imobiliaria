import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export interface ContactListContact {
  name: string;
  phone: string;
  valid: boolean;
  error?: string;
}

export interface ContactList {
  id: string;
  name: string;
  contacts: ContactListContact[];
  createdAt: Date;
}

export function useContactLists() {
  return useQuery<ContactList[]>({
    queryKey: ["/api/contact-lists"],
    queryFn: () => apiGet("/contact-lists"),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}