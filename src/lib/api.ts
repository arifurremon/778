import { getCsrfToken } from "next-auth/react";

export const api = {
  async get<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    const csrfToken = await getCsrfToken();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { "x-csrf-token": csrfToken }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  async patch<T>(url: string, body?: unknown): Promise<T> {
    const csrfToken = await getCsrfToken();
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { "x-csrf-token": csrfToken }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },

  async del<T>(url: string): Promise<T> {
    const csrfToken = await getCsrfToken();
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { "x-csrf-token": csrfToken }),
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || data.message || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  },
};
