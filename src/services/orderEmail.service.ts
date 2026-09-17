import { IOrder, OrderStatus } from "../models/order.model.js";
import { User } from "../models/user.model.js";
import * as emailService from "./email.service.js";

const STATUS_EMAIL_SUBJECTS: Partial<Record<OrderStatus, string>> = {
  confirmed: "Your order is confirmed",
  shipped: "Your order has shipped",
  delivered: "Your order was delivered",
  cancelled: "Your order was cancelled",
  failed: "Payment failed for your order",
};

function buildOrderSummary(order: IOrder): string {
  const lines = order.items
    .map((i) => `- ${i.name} x${i.quantity} — ${i.price.toFixed(2)}`)
    .join("\n");

  return `Order ${order.orderNumber}\n\n${lines}\n\nTotal: ${order.totalAmount.toFixed(2)}`;
}

async function getOrderRecipient(order: IOrder) {
  const user = await User.findById(order.user).select("email name");
  return user ?? null;
}

export async function sendOrderCreatedEmail(order: IOrder): Promise<void> {
  try {
    const user = await getOrderRecipient(order);
    if (!user) return;

    await emailService.sendEmail({
      to: user.email,
      subject: `We received your order ${order.orderNumber}`,
      html: `Hi ${user.name},\n\nWe've received your order and it's awaiting payment.\n\n${buildOrderSummary(order)}`,
    });
  } catch (err) {
    console.error(`Failed to send order-created email for ${order.orderNumber}:`, err);
  }
}

export async function sendOrderStatusEmail(order: IOrder): Promise<void> {
  try {
    const subject = STATUS_EMAIL_SUBJECTS[order.status];
    if (!subject) return; // no email for this status (e.g. "processing")

    const user = await getOrderRecipient(order);
    if (!user) return;

    await emailService.sendEmail({
      to: user.email,
      subject: `${subject} — ${order.orderNumber}`,
      html: `Hi ${user.name},\n\nYour order status is now: ${order.status}.\n\n${buildOrderSummary(order)}`,
    });
  } catch (err) {
    console.error(`Failed to send status email for ${order.orderNumber}:`, err);
  }
}