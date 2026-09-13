export interface UserAuthContext {
  id: string;
  role: string;
  email?: string;
  name?: string;
}

export type StatusFilter = "active" | "inactive";
