import { Order, IOrder } from "../models/order.model.js";
import AppError from "../error/AppError.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";

export interface ListSellerOrdersQuery {
  page?: number;
  limit?: number;
  status?: string;
}

const scopeItemsToSeller = (order: IOrder, sellerId: string) => {
  const obj = order.toObject();
  obj.items = obj.items.filter(
    (item: any) => item.seller.toString() === sellerId,
  );
  return obj;
};

export const listSellerOrders = async (
  sellerId: string,
  query: ListSellerOrdersQuery,
) => {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, any> = { "items.seller": sellerId };
  if (query.status) filter.status = query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ]);

  const scoped = orders.map((order) => scopeItemsToSeller(order, sellerId));

  return buildPaginatedResponse(scoped, total, page, limit, "orders");
};

export const getSellerOrderById = async (sellerId: string, orderId: string) => {
  const order = await Order.findOne({
    _id: orderId,
    "items.seller": sellerId,
  });

  if (!order) throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");

  return scopeItemsToSeller(order, sellerId);
};
