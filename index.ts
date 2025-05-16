// /types/index.ts
export * from "./product";
export * from "./user";
export * from "./order";
export * from "./cart";

// Add other global or shared types here if necessary
export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

