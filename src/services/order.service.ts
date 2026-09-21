import mongoose, { Types } from "mongoose";
import {
  Order,
  IOrderItem,
  IOrder,
  OrderStatus,
} from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Cart, ICartItem } from "../models/cart.model.js";
import AppError from "../error/AppError.js";
import { generateOrderNumber } from "../utils/helpers.js";
import {
  parsePagination,
  buildPaginatedResponse,
} from "../utils/pagination.js";
import { UserAuthContext } from "../types/common.types.js";
import { canTransition, PAYMENT_ONLY_STATUSES } from "../utils/orderStatus.js";
import * as orderEmailService from "./orderEmail.service.js";
import * as promoService from "./promo.service.js";
import { calculateBreakdown } from "./checkout.service.js";
import * as notificationService from "./notification.service.js";

interface CreateOrderInput {
  userId: Types.ObjectId;
  cartId: Types.ObjectId;
  shippingAddress: IOrder["shippingAddress"];
  promoCode?: string;
}

export async function createOrder({
  userId,
  cartId,
  shippingAddress,
  promoCode,
}: CreateOrderInput): Promise<IOrder> {
  const cart = await Cart.findOne({
    _id: cartId,
    user: userId,
  });

  if (!cart) {
    throw new AppError(404, "CART_NOT_FOUND", "Cart not found");
  }

  if (!cart.items.length) {
    throw new AppError(
      400,
      "EMPTY_CART",
      "Cannot create an order from an empty cart",
    );
  }

  const breakdown = await calculateBreakdown(cart.items, promoCode);

  const items: IOrderItem[] = [];

  for (const cartItem of cart.items) {
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

  const orderNumber = generateOrderNumber();

  const order = await Order.create({
    user: userId,
    orderNumber,
    items,
    totalAmount: breakdown.total,
    shippingAddress,
    status: "pending",
  });

  await Cart.findOneAndUpdate(
    {
      _id: cartId,
      user: userId,
    },
    {
      items: [],
    },
  );

  if (breakdown.promoId) {
    await promoService.incrementPromoUsage(breakdown.promoId);
  }

  void orderEmailService.sendOrderCreatedEmail(order);

  void notificationService.notifyUser({
    userId: order.user.toString(),
    type: "order_created",
    title: "Order placed",
    content: `Your order ${order.orderNumber} has been received and is awaiting payment.`,
  });

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

  void notificationService.notifyUser({
    userId: order.user.toString(),
    type: "order_status_changed",
    title: `Order ${order.orderNumber} update`,
    content: `Your order status is now: ${order.status}.`,
  });
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

export async function decrementOrderStock(
  order: IOrder,
  session?: mongoose.ClientSession,
) {
  for (const item of order.items) {
    const result = await Product.updateOne(
      {
        _id: item.product,
        stock: { $gte: item.quantity },
      },
      {
        $inc: {
          stock: -item.quantity,
        },
      },
      { session },
    );

    if (result.modifiedCount !== 1) {
      throw new AppError(
        409,
        "INSUFFICIENT_STOCK",
        `Not enough stock for "${item.name}"`,
      );
    }
  }
}
