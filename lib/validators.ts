import { z } from "zod";

export const imageSchema = z.object({
  key: z.string().trim().default(""),
  url: z.string().trim().url("Image URL is invalid"),
  alt: z.string().trim().max(160).default(""),
});

export const sizeSchema = z.object({
  size: z.string().trim().min(1, "Size label is required").max(40),
  stock: z.coerce.number().int().min(0).max(100000),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(140)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),
  category: z.string().trim().min(1, "Category is required"),
  description: z.string().trim().min(10, "Description is required").max(5000),
  brand: z.string().trim().max(80).default("Sporsify"),
  price: z.coerce.number().int().min(1, "Price must be greater than zero"),
  discountPercent: z.coerce.number().int().min(0).max(95).default(0),
  images: z.array(imageSchema).max(8).default([]),
  sizes: z.array(sizeSchema).min(1, "Add at least one size").max(20),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  featured: z.boolean().default(false),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  seoTitle: z.string().trim().max(70).default(""),
  seoDescription: z.string().trim().max(160).default(""),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Category name is required").max(60),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(300).default(""),
  image: z.union([z.string().trim().url("Image URL is invalid"), z.literal("")]).default(""),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  active: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Code is required")
      .max(30)
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphen or underscore"),
    type: z.enum(["percent", "fixed"]),
    value: z.coerce.number().int().min(1, "Value must be greater than zero"),
    minSubtotal: z.coerce.number().int().min(0).default(0),
    maxDiscount: z.coerce.number().int().min(0).default(0),
    startsAt: z.string().trim().default(""),
    expiresAt: z.string().trim().default(""),
    usageLimit: z.coerce.number().int().min(0).default(0),
    perPhoneLimit: z.coerce.number().int().min(0).default(0),
    active: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.type === "percent" && value.value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage discount cannot exceed 100",
      });
    }
    if (value.startsAt && value.expiresAt) {
      if (new Date(value.startsAt) >= new Date(value.expiresAt)) {
        ctx.addIssue({
          code: "custom",
          path: ["expiresAt"],
          message: "Expiry must be after the start date",
        });
      }
    }
  });

export type CouponInput = z.infer<typeof couponInputSchema>;

export const settingsInputSchema = z.object({
  insideDhakaFee: z.coerce.number().int().min(0).max(100000),
  outsideDhakaFee: z.coerce.number().int().min(0).max(100000),
  freeShippingThreshold: z.coerce.number().int().min(0).max(1000000),
  bkashNumber: z.string().trim().max(30).default(""),
  nagadNumber: z.string().trim().max(30).default(""),
  contactPhone: z.string().trim().max(30).default(""),
  contactEmail: z.string().trim().max(120).default(""),
  address: z.string().trim().max(300).default(""),
  facebookUrl: z.string().trim().max(200).default(""),
  instagramUrl: z.string().trim().max(200).default(""),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().trim().min(1).max(40),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const orderInputSchema = z
  .object({
    customer: z.object({
      name: z.string().trim().min(2, "Name is required").max(100),
      phone: z
        .string()
        .trim()
        .regex(/^(\+?88)?01[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number"),
      email: z.union([z.email(), z.literal("")]).default(""),
      address: z.string().trim().min(5, "Address is required").max(400),
      area: z.string().trim().min(1, "Area is required").max(120),
      district: z.string().trim().min(1, "District is required").max(120),
      notes: z.string().trim().max(500).default(""),
    }),
    items: z.array(cartItemSchema).min(1, "Your cart is empty").max(50),
    couponCode: z.string().trim().max(30).default(""),
    payment: z.object({
      method: z.enum(["cod", "bkash", "nagad"]),
      transactionId: z.string().trim().max(60).default(""),
      senderNumber: z.string().trim().max(30).default(""),
    }),
  })
  .superRefine((value, ctx) => {
    if (value.payment.method !== "cod" && !value.payment.transactionId) {
      ctx.addIssue({
        code: "custom",
        path: ["payment", "transactionId"],
        message: "Transaction ID is required for mobile payments",
      });
    }
  });

export type OrderInput = z.infer<typeof orderInputSchema>;

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required").max(30),
  items: z.array(cartItemSchema).min(1, "Your cart is empty").max(50),
  district: z.string().trim().max(120).default("Dhaka"),
});

export const orderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const paymentVerifySchema = z.object({
  status: z.enum(["verified", "failed"]),
});
