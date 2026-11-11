import type { OrderStatus } from "./types";

export type PermissionAction = "view" | "create" | "edit" | "delete";

export type PermissionModule = {
  key: string;
  label: string;
  description: string;
  actions: PermissionAction[];
  ownerOnly?: boolean;
  orderStatus?: OrderStatus;
};

export const permissionModules: PermissionModule[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Admin dashboard overview.",
    actions: ["view"],
  },
  {
    key: "products",
    label: "Products",
    description: "Product catalog management.",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "categories",
    label: "Categories",
    description: "Sport and product category management.",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "orders",
    label: "Orders",
    description: "Access to all orders regardless of status.",
    actions: ["view", "edit"],
  },
  {
    key: "pending_orders",
    label: "Pending orders",
    description: "Orders waiting for action.",
    actions: ["view", "edit"],
    orderStatus: "pending",
  },
  {
    key: "confirmed_orders",
    label: "Confirm orders",
    description: "Orders that have been confirmed.",
    actions: ["view", "edit"],
    orderStatus: "confirmed",
  },
  {
    key: "packed_orders",
    label: "Packed orders",
    description: "Orders packed and ready to ship.",
    actions: ["view", "edit"],
    orderStatus: "packed",
  },
  {
    key: "shipped_orders",
    label: "Shipped orders",
    description: "Orders currently in transit.",
    actions: ["view", "edit"],
    orderStatus: "shipped",
  },
  {
    key: "delivered_orders",
    label: "Delivered orders",
    description: "Orders successfully delivered.",
    actions: ["view", "edit"],
    orderStatus: "delivered",
  },
  {
    key: "cancelled_orders",
    label: "Cancelled orders",
    description: "Orders that were cancelled.",
    actions: ["view", "edit"],
    orderStatus: "cancelled",
  },
  {
    key: "coupons",
    label: "Coupons",
    description: "Discount coupon management.",
    actions: ["view", "create", "edit", "delete"],
  },
  {
    key: "settings",
    label: "Store settings",
    description: "Shipping, payment numbers, and store details.",
    actions: ["view", "edit"],
  },
  {
    key: "revenue",
    label: "Revenue",
    description: "Revenue totals and trends.",
    actions: ["view"],
  },
  {
    key: "sell",
    label: "Sales & Reports",
    description: "Sales analytics, best sellers, and reports.",
    actions: ["view"],
  },
  {
    key: "account",
    label: "Admin account",
    description: "View own admin profile and request credential changes.",
    actions: ["view"],
  },
  {
    key: "admins",
    label: "Admin management",
    description: "Owner-only control of admin accounts and permissions.",
    actions: ["view", "create", "edit", "delete"],
    ownerOnly: true,
  },
  {
    key: "security",
    label: "Security controls",
    description: "Owner-only security, requests, and audit access.",
    actions: ["view", "edit"],
    ownerOnly: true,
  },
];

export const assignablePermissionModules = permissionModules.filter(
  (module) => !module.ownerOnly,
);

export type Permission =
  | `${string}.${PermissionAction}`
  | string;

export const allPermissions: string[] = permissionModules.flatMap((module) =>
  module.actions.map((action) => `${module.key}.${action}`),
);

export const assignablePermissions: string[] = assignablePermissionModules.flatMap(
  (module) => module.actions.map((action) => `${module.key}.${action}`),
);

const permissionSet = new Set(allPermissions);
const assignableSet = new Set(assignablePermissions);

export function isPermission(value: string): boolean {
  return permissionSet.has(value);
}

export function isAssignablePermission(value: string): boolean {
  return assignableSet.has(value);
}

export function sanitizePermissions(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value): value is string => typeof value === "string"))]
    .filter((value) => isAssignablePermission(value))
    .sort();
}

export function hasPermission(
  permissions: readonly string[] | null | undefined,
  permission: string,
): boolean {
  return Boolean(permissions?.includes(permission));
}

export function hasAnyPermission(
  permissions: readonly string[] | null | undefined,
  candidates: readonly string[],
): boolean {
  return Boolean(permissions?.some((permission) => candidates.includes(permission)));
}

export function moduleAction(
  permissions: readonly string[] | null | undefined,
  moduleKey: string,
  action: PermissionAction,
): boolean {
  return hasPermission(permissions, `${moduleKey}.${action}`);
}

export function canAccessModule(
  permissions: readonly string[] | null | undefined,
  moduleKey: string,
): boolean {
  return Boolean(
    permissions?.some((permission) => permission.startsWith(`${moduleKey}.`)),
  );
}

export const orderStatusModules: Record<OrderStatus, string> = {
  pending: "pending_orders",
  confirmed: "confirmed_orders",
  packed: "packed_orders",
  shipped: "shipped_orders",
  delivered: "delivered_orders",
  cancelled: "cancelled_orders",
};

export function canViewOrderStatus(
  permissions: readonly string[] | null | undefined,
  status: OrderStatus,
): boolean {
  if (hasPermission(permissions, "orders.view")) return true;
  return moduleAction(permissions, orderStatusModules[status], "view");
}

export function canEditOrderStatus(
  permissions: readonly string[] | null | undefined,
  status: OrderStatus,
): boolean {
  if (hasPermission(permissions, "orders.edit")) return true;
  return moduleAction(permissions, orderStatusModules[status], "edit");
}

export function allowedOrderStatuses(
  permissions: readonly string[] | null | undefined,
): OrderStatus[] {
  const statuses: OrderStatus[] = [
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
  ];
  return statuses.filter((status) => canViewOrderStatus(permissions, status));
}

export function canManageOrders(
  permissions: readonly string[] | null | undefined,
): boolean {
  return (
    hasPermission(permissions, "orders.view") ||
    allowedOrderStatuses(permissions).length > 0
  );
}

export function permissionLabel(permission: string): string {
  const [moduleKey, action] = permission.split(".");
  const catalogEntry = permissionModules.find((item) => item.key === moduleKey);
  if (!catalogEntry) return permission;
  const label = action ? action.charAt(0).toUpperCase() + action.slice(1) : "";
  return `${catalogEntry.label} — ${label}`;
}

export function permissionCount(permissions: readonly string[] | null | undefined): number {
  return permissions?.length ?? 0;
}

export function firstAllowedAdminPath(
  permissions: readonly string[] | null | undefined,
): string {
  if (moduleAction(permissions, "dashboard", "view")) return "/admin";
  if (moduleAction(permissions, "products", "view")) return "/admin/products";
  if (moduleAction(permissions, "categories", "view")) return "/admin/categories";
  if (canManageOrders(permissions)) return "/admin/orders";
  if (moduleAction(permissions, "coupons", "view")) return "/admin/coupons";
  if (moduleAction(permissions, "revenue", "view")) return "/admin/revenue";
  if (moduleAction(permissions, "sell", "view")) return "/admin/sell";
  if (moduleAction(permissions, "settings", "view")) return "/admin/settings";
  if (moduleAction(permissions, "account", "view")) return "/admin/account";
  return "/admin/forbidden";
}

export const permissionPresets: { key: string; label: string; permissions: string[] }[] = [
  {
    key: "view_only",
    label: "Catalog viewer",
    permissions: [
      "dashboard.view",
      "products.view",
      "categories.view",
      "orders.view",
      "coupons.view",
      "account.view",
    ],
  },
  {
    key: "order_manager",
    label: "Order manager",
    permissions: [
      "dashboard.view",
      "orders.view",
      "orders.edit",
      "pending_orders.view",
      "pending_orders.edit",
      "confirmed_orders.view",
      "confirmed_orders.edit",
      "packed_orders.view",
      "packed_orders.edit",
      "shipped_orders.view",
      "shipped_orders.edit",
      "delivered_orders.view",
      "delivered_orders.edit",
      "cancelled_orders.view",
      "cancelled_orders.edit",
      "account.view",
    ],
  },
  {
    key: "catalog_manager",
    label: "Catalog manager",
    permissions: [
      "dashboard.view",
      "products.view",
      "products.create",
      "products.edit",
      "products.delete",
      "categories.view",
      "categories.create",
      "categories.edit",
      "categories.delete",
      "coupons.view",
      "coupons.create",
      "coupons.edit",
      "coupons.delete",
      "account.view",
    ],
  },
];
