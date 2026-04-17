import { useAuth } from "@clerk/react";

export function useApi() {
  const { getToken } = useAuth();
  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8001";

  const apiFetch = async (path: string, options: RequestInit = {}) => {
    const token = await getToken();
    // console.log("Clerk token:", token);
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  return { apiFetch };
}
