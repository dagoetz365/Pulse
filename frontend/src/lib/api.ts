/**
 * Pre-configured Axios HTTP client for the Pulse API.
 *
 * Base URL is set to `/api/v1` which is proxied to the FastAPI backend by
 * Vite's dev server (see `vite.config.ts`).
 *
 * A response interceptor normalises API error responses into plain
 * `Error` objects with human-readable messages. It handles both:
 * - String `detail` fields (e.g. "Patient not found")
 * - Array `detail` fields from Pydantic validation errors (joined with commas)
 */

import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const detail = error.response?.data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((e: { msg: string }) => e.msg).join(", ")
          : "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);
