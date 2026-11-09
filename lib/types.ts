export type ProductStatus = "active" | "draft" | "archived";

export type ProductSize = {
  size: string;
  stock: number;
};

export type ProductImage = {
  key: string;
  url: string;
  alt: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  brand: string;
  price: number;
  discountPercent: number;
  images: ProductImage[];
  sizes: ProductSize[];
  tags: string[];
  featured: boolean;
  status: ProductStatus;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  active: boolean;
};

export type CouponType = "percent" | "fixed";

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  maxDiscount: number;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  perPhoneLimit: number | null;
  active: boolean;
  createdAt: string;
};

export type CouponSummary = {
  code: string;
  type: CouponType;
  value: number;
  discount: number;
  description: string;
};

export type CartLine = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  brand: string;
  price: number;
  discountPercent: number;
  salePrice: number;
  size: string;
  quantity: number;
  stock: number;
  lineTotal: number;
};

export type CartItemInput = {
  productId: string;
  size: string;
  quantity: number;
};

export type PaymentMethod = "cod" | "bkash" | "nagad";
export type PaymentStatus =
  | "cod_pending"
  | "pending_verification"
  | "verified"
  | "failed";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  brand: string;
  size: string;
  unitPrice: number;
  discountPercent: number;
  salePrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderCustomer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  area: string;
  district: string;
  notes: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  publicToken: string;
  userId: string | null;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  productDiscount: number;
  couponCode: string;
  couponDiscount: number;
  shipping: number;
  total: number;
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId: string;
    senderNumber: string;
  };
  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    at: string;
    note: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export type Settings = {
  insideDhakaFee: number;
  outsideDhakaFee: number;
  freeShippingThreshold: number;
  bkashNumber: string;
  nagadNumber: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
};

export type CartTotals = {
  subtotal: number;
  productDiscount: number;
  couponDiscount: number;
  shipping: number;
  total: number;
  afterDiscount: number;
};
