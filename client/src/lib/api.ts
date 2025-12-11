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

  // Verificar se há um novo token no header
  const newToken = response.headers.get('X-New-Token');
  if (newToken) {
    localStorage.setItem("token", newToken);
  }

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } else {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
    } catch (e) {
      // Se falhar ao ler o body, usa mensagem padrão
      errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
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
