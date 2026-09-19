import { Types } from "mongoose";
import {
  Order,
  IOrderItem,
  IOrder,
  OrderStatus,
} from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { ICartItem } from "../models/cart.model.js";
import AppError from "../error/AppError.js";
import { generateOrderNumber } from "../utils/helpers.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";
import { UserAuthContext } from "../types/common.types.js";
import { canTransition, PAYMENT_ONLY_STATUSES } from "../utils/orderStatus.js";
import * as orderEmailService from "./orderEmail.service.js";

interface CreateOrderInput {
  userId: Types.ObjectId;
  cartItems: ICartItem[];
  shippingAddress: IOrder["shippingAddress"];
}

export async function createOrder({
  userId,
  cartItems,
  shippingAddress,
}: CreateOrderInput): Promise<IOrder> {
  if (!cartItems.length) {
    throw new AppError(
      400,
      "EMPTY_CART",
      "Cannot create an order from an empty cart",
    );
  }

  const items: IOrderItem[] = [];

  for (const cartItem of cartItems) {
    const product = await Product.findById(cartItem.product);

    if (!product) {
      throw new AppError(
        404,
        "PRODUCT_NOT_FOUND",
        `Product ${cartItem.product} no longer exists`,
      );
    }

    if (!product.isActive) {
      throw new AppError(
        409,
        "PRODUCT_UNAVAILABLE",
        `Product "${product.name}" is no longer available`,
      );
    }

    if (product.stock < cartItem.quantity) {
      throw new AppError(
        409,
        "INSUFFICIENT_STOCK",
        `Not enough stock for "${product.name}" (requested ${cartItem.quantity}, available ${product.stock})`,
      );
    }

    items.push({
      product: product._id as Types.ObjectId,
      seller: product.seller as Types.ObjectId,
      name: product.name,
      price: product.price,
      quantity: cartItem.quantity,
    });
  }

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const orderNumber = generateOrderNumber();

  const order = await Order.create({
    user: userId,
    orderNumber,
    items,
    totalAmount,
    shippingAddress,
    status: "pending",
  });

  void orderEmailService.sendOrderCreatedEmail(order);

  return order;
}

export async function getOrderHistory(
  userId: Types.ObjectId,
  query: { page?: number; limit?: number },
) {
  const { page, limit, skip } = parsePagination(query);

  const [orders, total] = await Promise.all([
    Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments({ user: userId }),
  ]);

  return buildPaginatedResponse(orders, total, page, limit, "orders");
}

export async function getOrderById(user: UserAuthContext, orderId: string) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (user.role !== "admin" && order.user.toString() !== user.id) {
    throw new AppError(
      403,
      "FORBIDDEN",
      "Forbidden. You can only view your own orders",
    );
  }

  return order;
}

interface ListAllOrdersQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  user?: string;
}

export async function listAllOrders(query: ListAllOrdersQuery) {
  const { page, limit, skip } = parsePagination(query);

  const filter: Record<string, any> = {};

  if (query.status) filter.status = query.status;
  if (query.user) filter.user = query.user;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  return buildPaginatedResponse(orders, total, page, limit, "orders");
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
) {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  if (PAYMENT_ONLY_STATUSES.includes(newStatus)) {
    throw new AppError(
      403,
      "PAYMENT_CONTROLLED_STATUS",
      `Status "${newStatus}" is set by the payment flow and cannot be set manually`,
    );
  }

  if (!canTransition(order.status, newStatus)) {
    throw new AppError(
      409,
      "INVALID_STATUS_TRANSITION",
      `Cannot change order status from "${order.status}" to "${newStatus}"`,
    );
  }

  order.status = newStatus;
  await order.save();

  void orderEmailService.sendOrderStatusEmail(order);

  return order;
}

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

  const filter: Record<string, any> = {
    "items.seller": sellerId,
  };

  if (query.status) {
    filter.status = query.status;
  }

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

  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return scopeItemsToSeller(order, sellerId);
};
