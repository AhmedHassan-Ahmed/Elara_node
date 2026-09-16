import { Request, Response } from "express";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import AppError from "../error/AppError.js";
import { sendSuccess } from "../utils/response.js";

const SHIPPING_FLAT = 50;
const TAX_RATE = 0.14;
const PRODUCT_FIELDS = "name price images stock isActive";



const getOrCreateCart = async (userId: string) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

const buildCartResponse = (cart: any) => {
  let subtotal = 0;

  const items = cart.items
    .filter((item: any) => item.product) 
    .map((item: any) => {
      const lineTotal = item.product.price * item.quantity;
      subtotal += lineTotal;
      return {
        product: item.product,
        quantity: item.quantity,
        lineTotal: +lineTotal.toFixed(2),
      };
    });

  const shipping = items.length > 0 ? SHIPPING_FLAT : 0;
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  return {
    cartId: cart._id,
    items,
    itemsCount: items.length,
    subtotal: +subtotal.toFixed(2),
    shipping,
    tax,
    total,
  };
};


export const getCart = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const cart = await getOrCreateCart(userId);
  await cart.populate("items.product", PRODUCT_FIELDS);

  sendSuccess(res, 200, "Cart retrieved successfully", {
    cart: buildCartResponse(cart),
  });
};


export const addItemToCart = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.id;
  const { productId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  if (!product.isActive) {
    throw new AppError(
      422,
      "PRODUCT_INACTIVE",
      "Product is not available for purchase",
    );
  }

  if (product.stock < quantity) {
    throw new AppError(
      422,
      "INSUFFICIENT_STOCK",
      `Only ${product.stock} item(s) available in stock`,
    );
  }

  const cart = await getOrCreateCart(userId);

  const existingItem = cart.items.find(
    (item) => item.product.toString() === productId,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;
    if (newQuantity > product.stock) {
      throw new AppError(
        422,
        "INSUFFICIENT_STOCK",
        `Only ${product.stock} item(s) available. You already have ${existingItem.quantity} in your cart.`,
      );
    }
    existingItem.quantity = newQuantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  await cart.populate("items.product", PRODUCT_FIELDS);

  sendSuccess(res, 200, "Item added to cart successfully", {
    cart: buildCartResponse(cart),
  });
};


export const updateCartItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.id;
  const { productId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError(404, "CART_NOT_FOUND", "Cart not found");
  }

  const item = cart.items.find((i) => i.product.toString() === productId);
  if (!item) {
    throw new AppError(404, "ITEM_NOT_FOUND", "Item not found in cart");
  }

  if (quantity === 0) {
    cart.items = cart.items.filter(
      (i) => i.product.toString() !== productId,
    );
    await cart.save();
    await cart.populate("items.product", PRODUCT_FIELDS);

    sendSuccess(res, 200, "Item removed from cart", {
      cart: buildCartResponse(cart),
    });
    return;
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  if (!product.isActive) {
    throw new AppError(
      422,
      "PRODUCT_INACTIVE",
      "Product is not available for purchase",
    );
  }
  if (quantity > product.stock) {
    throw new AppError(
      422,
      "INSUFFICIENT_STOCK",
      `Only ${product.stock} item(s) available in stock`,
    );
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate("items.product", PRODUCT_FIELDS);

  sendSuccess(res, 200, "Cart item updated successfully", {
    cart: buildCartResponse(cart),
  });
};


export const removeCartItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.id;
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError(404, "CART_NOT_FOUND", "Cart not found");
  }

  const beforeCount = cart.items.length;
  cart.items = cart.items.filter((i) => i.product.toString() !== productId);

  if (cart.items.length === beforeCount) {
    throw new AppError(404, "ITEM_NOT_FOUND", "Item not found in cart");
  }

  await cart.save();
  await cart.populate("items.product", PRODUCT_FIELDS);

  sendSuccess(res, 200, "Item removed from cart successfully", {
    cart: buildCartResponse(cart),
  });
};


export const clearCart = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user!.id;

  await Cart.findOneAndUpdate(
    { user: userId },
    { items: [] },
    { upsert: true, new: true },
  );

  sendSuccess(res, 200, "Cart cleared successfully");
};