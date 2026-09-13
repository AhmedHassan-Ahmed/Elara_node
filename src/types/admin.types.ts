import { UserRole } from "../models/user.model.js";
import { PaginationQuery } from "../utils/pagination.js";

export interface ListUsersQuery extends PaginationQuery {
  role?: UserRole;
  search?: string;
  status?: "active" | "inactive";
}

export interface ListSellersQuery extends PaginationQuery {
  search?: string;
  status?: "active" | "inactive";
}

export interface UpdateUserStatusInput {
  isActive: boolean;
}

export interface UpdateSellerStatusInput {
  isActive: boolean;
}
