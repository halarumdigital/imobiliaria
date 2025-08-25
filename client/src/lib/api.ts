import { queryClient } from "./queryClient";

const API_BASE = "/api";

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("token");
  
  console.log(`🌐 [API] Making request to: ${API_BASE}${endpoint}`);
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  });

  console.log(`📊 [API] Response status: ${response.status}, ok: ${response.ok}`);

  // Verificar se há um novo token no header
  const newToken = response.headers.get('X-New-Token');
  if (newToken) {
    localStorage.setItem("token", newToken);
  }

  if (response.status === 401) {
    console.log("❌ [API] Unauthorized - redirecting to login");
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    console.log("❌ [API] Response not ok, processing error...");
    let errorMessage = `Request failed: ${response.status}`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        console.log("📋 [API] Error data:", errorData);
        errorMessage = errorData.error || errorMessage;
      } else {
        const errorText = await response.text();
        console.log("📋 [API] Error text:", errorText);
        errorMessage = errorText || errorMessage;
      }
    } catch (e) {
      // Se falhar ao ler o body, usa mensagem padrão
      errorMessage = `Request failed: ${response.status} ${response.statusText}`;
    }
    console.log("❌ [API] Throwing error:", errorMessage);
    throw new Error(errorMessage);
  }

  console.log("✅ [API] Request successful");
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
