export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'admin';
export type PaymentMethod = 'razorpay' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
export type DiscountType = 'percentage' | 'fixed';
export type BannerPosition = 'hero' | 'promo' | 'sidebar';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  cloudinary_public_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  cloudinary_public_id: string | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  product_code: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  original_price: number;
  selling_price: number;
  stock_quantity: number;
  weight?: string | null;
  included_components?: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithDetails extends Product {
  primary_image_url: string | null;
  primary_image_cloudinary_id: string | null;
  primary_image_alt: string | null;
  category_name: string | null;
  category_slug: string | null;
  brand_name: string | null;
  brand_slug: string | null;
  brand_logo_url: string | null;
  discount_percentage: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  cloudinary_public_id: string | null;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductSpecification {
  id: string;
  product_id: string;
  specification_name: string;
  specification_value: string;
  sort_order: number;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  cloudinary_public_id: string | null;
  mobile_image_url: string | null;
  mobile_cloudinary_public_id: string | null;
  button_text: string | null;
  button_link: string | null;
  position: BannerPosition;
  sort_order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementBar {
  id: string;
  message: string;
  link_text: string | null;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  district: string | null;
  state: string;
  pincode: string;
  landmark: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: ShippingAddress;
  subtotal: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  coupon_code: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  district?: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_code: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: ProductWithDetails;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: ProductWithDetails;
}

export interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Composite / UI Types
// ============================================================

export interface CartItemWithProduct extends CartItem {
  product: ProductWithDetails;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  status_history?: OrderStatusHistory[];
}

export interface ProductFullDetail extends Product {
  images: ProductImage[];
  specifications: ProductSpecification[];
  category: Category | null;
  brand: Brand | null;
  discount_percentage: number;
  primary_image_url: string | null;
}

export interface SiteSettings {
  store_name: string;
  store_tagline: string;
  store_phone: string;
  store_email: string;
  store_address: string;
  free_shipping_above: string;
  shipping_charge: string;
  cod_enabled: string;
  cod_min_order: string;
  cod_max_order: string;
  currency_symbol: string;
  currency_code: string;
  meta_title: string;
  meta_description: string;
  social_facebook: string;
  social_instagram: string;
  social_youtube: string;
  whatsapp_number: string;
  [key: string]: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
  sort?: 'price-low' | 'price-high' | 'newest' | 'popular';
  featured?: boolean;
  bestSeller?: boolean;
  isNew?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  lowStockProducts: number;
}
