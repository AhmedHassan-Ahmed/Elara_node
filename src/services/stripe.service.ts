import { Types } from "mongoose";
import Stripe from "stripe";

import { getStripe } from "../config/stripe.js";
import { env } from "../config/env.js";
import AppError from "../error/AppError.js";
import { Order } from "../models/order.model.js";
import { Payment, PaymentStatus } from "../models/payment.model.js";
import { canTransition } from "../utils/orderStatus.js";
import * as notificationService from "./notification.service.js";
import * as orderEmailService from "./orderEmail.service.js";
import * as orderService from "./order.service.js";

const toStripeAmount = (amount: number) => {
  const value = Math.round(amount * 100);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new AppError(
      400,
      "INVALID_ORDER_AMOUNT",
      "Order amount cannot be processed by Stripe",
    );
  }
  return value;
};

const getOrderForUser = async (orderId: string, userId: string) => {
  if (!Types.ObjectId.isValid(orderId)) {
    throw new AppError(400, "INVALID_ORDER_ID", "Invalid order id");
  }

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new AppError(404, "ORDER_NOT_FOUND", "Order not found");
  }

  return order;
};

const frontendUrl = env.frontendUrl.replace(/\/$/, "");

const buildLineItems = (
  order: any,
  breakdown: {
    subtotal: number;
    shipping: number;
    tax: number;
    discount: number;
  },
): Stripe.Checkout.SessionCreateParams.LineItem[] => {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

  for (const item of order.items) {
    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: env.stripeCurrency,
        unit_amount: toStripeAmount(item.price),
        product_data: {
          name: item.name,
        },
      },
    });
  }

  if (breakdown.shipping > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: env.stripeCurrency,
        unit_amount: toStripeAmount(breakdown.shipping),
        product_data: {
          name: "Shipping",
        },
      },
    });
  }


  if (breakdown.tax > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency: env.stripeCurrency,
        unit_amount: toStripeAmount(breakdown.tax),
        product_data: {
          name: "Tax (14%)",
        },
      },
    });
  }

  if (breakdown.discount > 0 && lineItems.length > 0) {
    const discountCents = toStripeAmount(breakdown.discount);

    const first = lineItems[0];

    const unitAmount = first.price_data!.unit_amount!;
    const quantity = Number(first.quantity ?? 1);

    const productTotal = unitAmount * quantity;

    if (discountCents <= productTotal) {
      const newTotal = productTotal - discountCents;

      const newUnitAmount = Math.floor(newTotal / quantity);

      first.price_data!.unit_amount = newUnitAmount;

      const remainder = newTotal - newUnitAmount * quantity;

      if (remainder > 0 && lineItems.length > 1) {
        const second = lineItems[1];

        second.price_data!.unit_amount =
          second.price_data!.unit_amount! + remainder;
      }
    }
  }

  return lineItems;
};

export async function createCheckoutSession(orderId: string, userId: string) {
  const order = await getOrderForUser(orderId, userId);

  if (order.status !== "pending") {
    throw new AppError(
      409,
      "ORDER_NOT_PAYABLE",
      `Order cannot be paid while its status is "${order.status}"`,
    );
  }

  const stripe = getStripe();

  const existingPayment = await Payment.findOne({ order: order._id });
  if (existingPayment) {
    if (existingPayment.status === "succeeded") {
      throw new AppError(
        409,
        "ORDER_ALREADY_PAID",
        "This order has already been paid",
      );
    }

    if (existingPayment.status === "pending") {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(
          existingPayment.stripePaymentId,
        );

        if (existingSession.status === "open" && existingSession.url) {
          return {
            order,
            payment: existingPayment,
            checkoutSessionId: existingSession.id,
            checkoutUrl: existingSession.url,
          };
        }
      } catch {}
    }

    await Payment.deleteOne({ _id: existingPayment._id });
  }

  const subtotal = order.items.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0,
  );

  const shipping = subtotal > 0 ? 50 : 0;
  const tax = +(subtotal * 0.14).toFixed(2);
  const discount = +Math.max(
    0,
    subtotal + shipping + tax - order.totalAmount,
  ).toFixed(2);

  const lineItems = buildLineItems(order, {
    subtotal,
    shipping,
    tax,
    discount,
  });

  const expectedAmount = toStripeAmount(order.totalAmount);
  const calculatedAmount = lineItems.reduce(
    (sum, item) =>
      sum + (item.price_data?.unit_amount ?? 0) * Number(item.quantity ?? 0),
    0,
  );

  if (calculatedAmount !== expectedAmount) {
    throw new AppError(
      409,
      "ORDER_TOTAL_MISMATCH",
      `The order total (${expectedAmount / 100}) does not match its item totals (${calculatedAmount / 100})`,
    );
  }

  const payment = await Payment.create({
    order: order._id,
    amount: order.totalAmount,
    currency: env.stripeCurrency,
    status: "pending",
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,

    metadata: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      userId,
      paymentId: payment._id.toString(),
    },

    success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id}`,
    cancel_url: `${frontendUrl}/payment/cancelled?order_id=${order._id}`,

    client_reference_id: order._id.toString(),
  });

  if (!session.url) {
    await Payment.deleteOne({ _id: payment._id });

    throw new AppError(
      502,
      "STRIPE_CHECKOUT_URL_MISSING",
      "Stripe did not return a checkout URL",
    );
  }

  payment.stripePaymentId = session.id;
  await payment.save();

  return {
    order,
    payment,
    checkoutSessionId: session.id,
    checkoutUrl: session.url,
  };
}

export async function getPaymentForOrder(orderId: string, userId: string) {
  const order = await getOrderForUser(orderId, userId);
  const payment = await Payment.findOne({ order: order._id });

  if (!payment) {
    throw new AppError(
      404,
      "PAYMENT_NOT_FOUND",
      "No Stripe payment exists for this order",
    );
  }

  return payment;
}

const findOrderFromCheckoutSession = async (
  session: Stripe.Checkout.Session,
) => {
  const orderId = session.metadata?.orderId || session.client_reference_id;
  if (!orderId || !Types.ObjectId.isValid(orderId)) {
    throw new AppError(
      400,
      "STRIPE_ORDER_REFERENCE_MISSING",
      "Stripe session is missing a valid order reference",
    );
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError(
      404,
      "ORDER_NOT_FOUND",
      "Order referenced by Stripe session was not found",
    );
  }

  return order;
};

const syncPayment = async (
  session: Stripe.Checkout.Session,
  status: PaymentStatus,
) => {
  const order = await findOrderFromCheckoutSession(session);

  const expectedAmount = toStripeAmount(order.totalAmount);
  if (
    session.amount_total !== null &&
    session.amount_total !== expectedAmount
  ) {
    throw new AppError(
      400,
      "STRIPE_AMOUNT_MISMATCH",
      "Stripe payment amount does not match the order total",
    );
  }

  const currency = session.currency || env.stripeCurrency;
  if (currency.toLowerCase() !== env.stripeCurrency.toLowerCase()) {
    throw new AppError(
      400,
      "STRIPE_CURRENCY_MISMATCH",
      "Stripe payment currency does not match the store currency",
    );
  }

  const existingPayment = await Payment.findOne({
    $or: [{ stripePaymentId: session.id }, { order: order._id }],
  });

  if (existingPayment?.status === "succeeded" && status !== "succeeded") {
    order.paymentId = existingPayment._id as Types.ObjectId;
    if (order.isModified("paymentId")) {
      await order.save();
    }
    return { order, payment: existingPayment };
  }

  const payment = await Payment.findOneAndUpdate(
    {
      $or: [{ stripePaymentId: session.id }, { order: order._id }],
    },
    {
      $set: {
        stripePaymentId: session.id,
        order: order._id,
        amount: order.totalAmount,
        currency,
        status,
        ...(status === "succeeded" ? { paidAt: new Date() } : {}),
      },
    },
    {
      new: true,
      upsert: true,
    },
  );

  order.paymentId = payment._id as Types.ObjectId;

  if (
    status === "succeeded" &&
    order.status === "pending" &&
    canTransition(order.status, "confirmed")
  ) {
    const alreadyPaid = existingPayment?.status === "succeeded";

    if (!alreadyPaid) {
      await orderService.decrementOrderStock(order);
    }

    order.status = "confirmed";
    await order.save();

    void orderEmailService.sendOrderStatusEmail(order);

    void notificationService.notifyUser({
      userId: order.user.toString(),
      type: "order_status_changed",
      title: "Payment successful",
      content: `Your payment for order ${order.orderNumber} was successful. Your order is now confirmed.`,
    });
  } else if (
    status === "failed" &&
    order.status === "pending" &&
    canTransition(order.status, "failed")
  ) {
    order.status = "failed";
    await order.save();

    void orderEmailService.sendOrderStatusEmail(order);

    void notificationService.notifyUser({
      userId: order.user.toString(),
      type: "order_status_changed",
      title: "Payment failed",
      content: `Payment for order ${order.orderNumber} failed. Please try again.`,
    });
  } else if (
    status === "cancelled" &&
    order.status === "pending" &&
    canTransition(order.status, "cancelled")
  ) {
    order.status = "cancelled";
    await order.save();

    void orderEmailService.sendOrderStatusEmail(order);

    void notificationService.notifyUser({
      userId: order.user.toString(),
      type: "order_status_changed",
      title: "Payment cancelled",
      content: `Payment for order ${order.orderNumber} was cancelled. You can try again if you still want to place the order.`,
    });
  } else if (order.isModified("paymentId")) {
    await order.save();
  }

  return { order, payment };
};

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status === "paid") {
        return syncPayment(session, "succeeded");
      }
      return syncPayment(session, "pending");
    }

    case "checkout.session.async_payment_succeeded": {
      return syncPayment(
        event.data.object as Stripe.Checkout.Session,
        "succeeded",
      );
    }

    case "checkout.session.async_payment_failed": {
      return syncPayment(
        event.data.object as Stripe.Checkout.Session,
        "failed",
      );
    }

    case "checkout.session.expired": {
      return syncPayment(
        event.data.object as Stripe.Checkout.Session,
        "cancelled",
      );
    }

    default:
      return null;
  }
}
