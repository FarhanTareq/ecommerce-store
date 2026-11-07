"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/guard";
import {
  createProduct,
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/lib/db/products";
import {
  createCoupon,
  deleteCoupon,
  getCouponById,
  updateCoupon,
} from "@/lib/db/coupons";
import { updateOrderStatus, updatePaymentStatus } from "@/lib/db/orders";
import { saveSettings } from "@/lib/db/settings";
import { deleteUploadedFiles } from "@/lib/uploadthing";
import {
  couponInputSchema,
  orderStatusSchema,
  productInputSchema,
  settingsInputSchema,
} from "@/lib/validators";
import type { OrderStatus } from "@/lib/types";

export type ActionResult =
  | { ok: true; message: string; id?: string }
  | { ok: false; message: string };

function fail(error: unknown): ActionResult {
  return {
    ok: false,
    message: error instanceof Error ? error.message : "Something went wrong",
  };
}

function revalidateStore(slug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/product/${slug}`);
  }
}

export async function saveProductAction(
  raw: unknown,
  id?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = productInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid product" };
    }

    const previous = id ? await getProductById(id) : null;
    const saved = id
      ? await updateProduct(id, parsed.data)
      : await createProduct(parsed.data);

    if (previous) {
      const previousKeys = new Set(previous.images.map((image) => image.key).filter(Boolean));
      const nextKeys = new Set(saved.images.map((image) => image.key).filter(Boolean));
      const removed = [...previousKeys].filter((key) => !nextKeys.has(key));
      if (removed.length) await deleteUploadedFiles(removed);
    }

    revalidateStore(saved.slug);
    revalidatePath(`/shop/${saved.category}`);
    return {
      ok: true,
      message: id ? "Product updated" : "Product created",
      id: saved.id,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const product = await deleteProduct(id);
    if (!product) return { ok: false, message: "Product not found" };
    await deleteUploadedFiles(product.images.map((image) => image.key));
    revalidateStore(product.slug);
    revalidatePath(`/shop/${product.category}`);
    return { ok: true, message: "Product deleted" };
  } catch (error) {
    return fail(error);
  }
}

export async function saveCouponAction(
  raw: unknown,
  id?: string,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = couponInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid coupon" };
    }
    const saved = id
      ? await updateCoupon(id, parsed.data)
      : await createCoupon(parsed.data);
    revalidatePath("/admin/coupons");
    return { ok: true, message: id ? "Coupon updated" : "Coupon created", id: saved.id };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteCoupon(id);
    revalidatePath("/admin/coupons");
    return { ok: true, message: "Coupon deleted" };
  } catch (error) {
    return fail(error);
  }
}

export async function setOrderStatusAction(
  id: string,
  status: string,
  note = "",
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = orderStatusSchema.safeParse(status);
    if (!parsed.success) return { ok: false, message: "Invalid order status" };
    await updateOrderStatus(id, parsed.data as OrderStatus, note);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/account");
    return { ok: true, message: "Order status updated" };
  } catch (error) {
    return fail(error);
  }
}

export async function setPaymentStatusAction(
  id: string,
  status: "verified" | "failed",
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updatePaymentStatus(id, status);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true, message: "Payment status updated" };
  } catch (error) {
    return fail(error);
  }
}

export async function saveSettingsAction(raw: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = settingsInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid settings" };
    }
    await saveSettings(parsed.data);
    revalidatePath("/");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/admin/settings");
    return { ok: true, message: "Store settings saved" };
  } catch (error) {
    return fail(error);
  }
}

export async function getCouponForEditAction(id: string) {
  await requireAdmin();
  return getCouponById(id);
}
