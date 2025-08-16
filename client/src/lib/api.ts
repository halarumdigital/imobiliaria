import { queryClient } from "./queryClient";

const API_BASE = "/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("token");
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  return response;
}

export async function apiGet(endpoint: string) {
  const response = await apiRequest(endpoint);
  return response.json();
}

export async function apiPost(endpoint: string, data?: any) {
  const response = await apiRequest(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

export async function apiPut(endpoint: string, data?: any) {
  const response = await apiRequest(endpoint, {
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

export async function apiDelete(endpoint: string) {
  const response = await apiRequest(endpoint, {
    method: "DELETE",
  });
  return response.status === 204 ? null : response.json();
}
