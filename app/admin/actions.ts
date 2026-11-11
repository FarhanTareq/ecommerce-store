"use server";

import { revalidatePath } from "next/cache";
import {
  requireAdminActor,
  requirePermission,
  assertCanEditOrderStatus,
  getRequestMeta,
  type Actor,
} from "@/lib/server/authorization";
import { recordAudit, type AuditAction } from "@/lib/server/audit";
import {
  createProduct,
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/lib/db/products";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "@/lib/db/categories";
import {
  createCoupon,
  deleteCoupon,
  getCouponById,
  updateCoupon,
} from "@/lib/db/coupons";
import {
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/lib/db/orders";
import { saveSettings } from "@/lib/db/settings";
import { deleteUploadedFiles } from "@/lib/uploadthing";
import {
  categoryInputSchema,
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


async function audit(
  actor: Actor,
  action: AuditAction,
  input: {
    targetType: string;
    targetId?: string;
    summary: string;
    metadata?: Record<string, unknown>;
  },
) {
  const meta = await getRequestMeta();
  await recordAudit({
    actorId: actor.userId,
    actorEmail: actor.email,
    action,
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary,
    metadata: input.metadata,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
}

function revalidateStore(slug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
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
    const actor = await requirePermission(id ? "products.edit" : "products.create");
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
    await audit(actor, id ? "product.updated" : "product.created", {
      targetType: "product",
      targetId: saved.id,
      summary: `${id ? "Updated" : "Created"} product ${saved.name}`,
    });
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
    const actor = await requirePermission("products.delete");
    const product = await deleteProduct(id);
    if (!product) return { ok: false, message: "Product not found" };
    await deleteUploadedFiles(product.images.map((image) => image.key));
    revalidateStore(product.slug);
    revalidatePath(`/shop/${product.category}`);
    await audit(actor, "product.deleted", {
      targetType: "product",
      targetId: id,
      summary: `Deleted product ${product.name}`,
    });
    return { ok: true, message: "Product deleted" };
  } catch (error) {
    return fail(error);
  }
}


export async function saveCategoryAction(
  raw: unknown,
  id?: string,
): Promise<ActionResult> {
  try {
    const actor = await requirePermission(id ? "categories.edit" : "categories.create");
    const parsed = categoryInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid category" };
    }
    const previous = id ? await getCategoryById(id) : null;
    const saved = id
      ? await updateCategory(id, parsed.data)
      : await createCategory(parsed.data);
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/sitemap.xml");
    if (previous && previous.slug !== saved.slug) {
      revalidatePath(`/shop/${previous.slug}`);
    }
    revalidatePath(`/shop/${saved.slug}`);
    await audit(actor, id ? "category.updated" : "category.created", {
      targetType: "category",
      targetId: saved.id,
      summary: `${id ? "Updated" : "Created"} category ${saved.name}`,
    });
    return {
      ok: true,
      message: id ? "Category updated" : "Category created",
      id: saved.id,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission("categories.delete");
    const removed = await deleteCategory(id);
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/shop/${removed.slug}`);
    await audit(actor, "category.deleted", {
      targetType: "category",
      targetId: id,
      summary: `Deleted category ${removed.name}`,
    });
    return { ok: true, message: "Category deleted" };
  } catch (error) {
    return fail(error);
  }
}

export async function saveCouponAction(
  raw: unknown,
  id?: string,
): Promise<ActionResult> {
  try {
    const actor = await requirePermission(id ? "coupons.edit" : "coupons.create");
    const parsed = couponInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid coupon" };
    }
    const saved = id
      ? await updateCoupon(id, parsed.data)
      : await createCoupon(parsed.data);
    revalidatePath("/admin/coupons");
    await audit(actor, id ? "coupon.updated" : "coupon.created", {
      targetType: "coupon",
      targetId: saved.id,
      summary: `${id ? "Updated" : "Created"} coupon ${saved.code}`,
    });
    return { ok: true, message: id ? "Coupon updated" : "Coupon created", id: saved.id };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  try {
    const actor = await requirePermission("coupons.delete");
    await deleteCoupon(id);
    revalidatePath("/admin/coupons");
    await audit(actor, "coupon.deleted", {
      targetType: "coupon",
      targetId: id,
      summary: `Deleted coupon ${id}`,
    });
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
    const actor = await requireAdminActor();
    const parsed = orderStatusSchema.safeParse(status);
    if (!parsed.success) return { ok: false, message: "Invalid order status" };
    const current = await getOrderById(id);
    if (!current) return { ok: false, message: "Order not found" };
    assertCanEditOrderStatus(actor, current.status);
    assertCanEditOrderStatus(actor, parsed.data as OrderStatus);
    await updateOrderStatus(id, parsed.data as OrderStatus, note);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/account");
    await audit(actor, "order.status_changed", {
      targetType: "order",
      targetId: id,
      summary: `Changed order ${current.orderNumber} from ${current.status} to ${parsed.data}`,
      metadata: { from: current.status, to: parsed.data, note },
    });
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
    const actor = await requireAdminActor();
    const current = await getOrderById(id);
    if (!current) return { ok: false, message: "Order not found" };
    assertCanEditOrderStatus(actor, current.status);
    await updatePaymentStatus(id, status);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    await audit(actor, "order.payment_changed", {
      targetType: "order",
      targetId: id,
      summary: `Set payment status for ${current.orderNumber} to ${status}`,
      metadata: { status },
    });
    return { ok: true, message: "Payment status updated" };
  } catch (error) {
    return fail(error);
  }
}

export async function saveSettingsAction(raw: unknown): Promise<ActionResult> {
  try {
    const actor = await requirePermission("settings.edit");
    const parsed = settingsInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid settings" };
    }
    await saveSettings(parsed.data);
    revalidatePath("/");
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/admin/settings");
    await audit(actor, "settings.updated", {
      targetType: "settings",
      targetId: "store",
      summary: "Updated store settings",
    });
    return { ok: true, message: "Store settings saved" };
  } catch (error) {
    return fail(error);
  }
}

export async function getCouponForEditAction(id: string) {
  await requirePermission("coupons.view");
  return getCouponById(id);
}
