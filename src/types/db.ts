// Hand-written to mirror supabase/migrations. Regenerate with:
//   npx supabase gen types typescript --project-id xtugdlyhyulxpxxsbwko > src/types/db.generated.ts
// (the generated file also types joins via Relationships).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ContentStatus = 'draft' | 'published' | 'archived'
export type Gender = 'men' | 'women' | 'unisex' | 'kids'
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'spam'
export type CustomRequestStatus = 'new' | 'in_progress' | 'quoted' | 'completed' | 'declined'
export type SubscriberStatus = 'active' | 'unsubscribed'
export type BannerPlacement = 'home_hero' | 'home_mid' | 'category_top'
export type AdminRole = 'owner' | 'admin' | 'editor'

// ---------------------------------------------------------------- Row types
export interface Category {
  id: string; name: string; slug: string; description: string; image_url: string
  status: ContentStatus; sort_order: number; created_at: string; updated_at: string
}
export interface Brand {
  id: string; name: string; slug: string; logo_url: string; description: string
  status: ContentStatus; sort_order: number; created_at: string; updated_at: string
}
export interface Product {
  id: string; name: string; slug: string; description: string; short_description: string
  price: number; compare_at_price: number | null; brand_id: string; category_id: string
  gender: Gender; status: ContentStatus; sort_order: number; is_featured: boolean
  tags: string[]; created_at: string; updated_at: string
}
export interface ProductVariant {
  id: string; product_id: string; size: string; color: string; sku: string
  price_override: number | null; stock: number; status: ContentStatus; sort_order: number
  created_at: string; updated_at: string
}
export interface ProductImage {
  id: string; product_id: string; url: string; alt_text: string; sort_order: number
  created_at: string; updated_at: string
}
export interface Customer {
  id: string; email: string; full_name: string; phone: string; created_at: string; updated_at: string
}
export interface Address {
  id: string; customer_id: string; line1: string; line2: string; city: string; state: string
  postal_code: string; country: string; is_default: boolean; created_at: string; updated_at: string
}
export interface Order {
  id: string; customer_id: string; order_number: string; status: OrderStatus
  subtotal: number; shipping: number; total: number; currency: string
  shipping_address: Json; created_at: string; updated_at: string
}
export interface OrderItem {
  id: string; order_id: string; variant_id: string | null; product_name_snapshot: string
  variant_label_snapshot: string; qty: number; unit_price: number; line_total: number
  created_at: string; updated_at: string
}
export interface OrderStatusHistory {
  id: string; order_id: string; from_status: OrderStatus | null; to_status: OrderStatus
  note: string; changed_by: string | null; created_at: string; updated_at: string
}
export interface ContactRequest {
  id: string; name: string; email: string; subject: string; message: string
  status: ContactStatus; created_at: string; updated_at: string
}
export interface CustomRequest {
  id: string; customer_id: string | null; name: string; email: string; product_description: string
  size: string; budget_range: string; message: string; status: CustomRequestStatus
  created_at: string; updated_at: string
}
export interface NewsletterSubscriber {
  id: string; email: string; status: SubscriberStatus; created_at: string; updated_at: string
}
export interface Review {
  id: string; product_id: string; customer_id: string | null; reviewer_name: string; rating: number
  title: string; body: string; status: ContentStatus; sort_order: number
  created_at: string; updated_at: string
}
export interface BlogCategory {
  id: string; name: string; slug: string; status: ContentStatus; sort_order: number
  created_at: string; updated_at: string
}
export interface Blog {
  id: string; title: string; slug: string; excerpt: string; content_md: string
  cover_image_url: string; author_name: string; category_id: string | null
  status: ContentStatus; published_at: string | null; sort_order: number
  created_at: string; updated_at: string
}
export interface Page {
  id: string; title: string; slug: string; content_md: string; status: ContentStatus
  sort_order: number; created_at: string; updated_at: string
}
export interface Banner {
  id: string; title: string; subtitle: string; image_url: string; cta_text: string; cta_link: string
  placement: BannerPlacement; status: ContentStatus; sort_order: number
  starts_at: string; ends_at: string | null; created_at: string; updated_at: string
}
export interface Faq {
  id: string; question: string; answer: string; category: string; status: ContentStatus
  sort_order: number; created_at: string; updated_at: string
}
export interface SiteSetting {
  key: string; value: Json; description: string; created_at: string; updated_at: string
}
export interface AdminUser {
  id: string; email: string; role: AdminRole; created_at: string; updated_at: string
}
export interface AdminActivityLog {
  id: string; admin_id: string | null; table_name: string; record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'; diff: Json; created_at: string; updated_at: string
}

// ----------------------------------------------------------- Table builders
// Insert: columns with DB defaults become optional. Update: everything optional.
type TableDef<R, Optional extends keyof R = never> = {
  Row: R
  Insert: Omit<R, Optional> & Partial<Pick<R, Optional>>
  Update: Partial<R>
  Relationships: []
}
type Std = 'id' | 'created_at' | 'updated_at'
type Content = Std | 'status' | 'sort_order'

export interface Database {
  public: {
    Tables: {
      categories: TableDef<Category, Content | 'description' | 'image_url'>
      brands: TableDef<Brand, Content | 'description' | 'logo_url'>
      products: TableDef<Product, Content | 'description' | 'short_description' | 'compare_at_price' | 'gender' | 'is_featured' | 'tags'>
      product_variants: TableDef<ProductVariant, Content | 'color' | 'price_override' | 'stock'>
      product_images: TableDef<ProductImage, Std | 'alt_text' | 'sort_order'>
      customers: TableDef<Customer, 'created_at' | 'updated_at' | 'full_name' | 'phone'>
      addresses: TableDef<Address, Std | 'line2' | 'state' | 'is_default'>
      orders: TableDef<Order, Std | 'order_number' | 'status' | 'subtotal' | 'shipping' | 'total' | 'currency' | 'shipping_address'>
      order_items: TableDef<OrderItem, Std | 'variant_id' | 'variant_label_snapshot'>
      order_status_history: TableDef<OrderStatusHistory, Std | 'from_status' | 'note' | 'changed_by'>
      contact_requests: TableDef<ContactRequest, Std | 'status' | 'subject'>
      custom_requests: TableDef<CustomRequest, Std | 'status' | 'customer_id' | 'size' | 'budget_range' | 'message'>
      newsletter_subscribers: TableDef<NewsletterSubscriber, Std | 'status'>
      reviews: TableDef<Review, Content | 'customer_id' | 'reviewer_name' | 'title' | 'body'>
      blog_categories: TableDef<BlogCategory, Content>
      blogs: TableDef<Blog, Content | 'excerpt' | 'content_md' | 'cover_image_url' | 'author_name' | 'category_id' | 'published_at'>
      pages: TableDef<Page, Content | 'content_md'>
      banners: TableDef<Banner, Content | 'subtitle' | 'image_url' | 'cta_text' | 'cta_link' | 'starts_at' | 'ends_at'>
      faqs: TableDef<Faq, Content | 'category'>
      site_settings: TableDef<SiteSetting, 'created_at' | 'updated_at' | 'value' | 'description'>
      admin_users: TableDef<AdminUser, 'created_at' | 'updated_at' | 'role'>
      admin_activity_log: TableDef<AdminActivityLog, Std | 'record_id' | 'diff' | 'admin_id'>
    }
    Views: { [_ in never]: never }
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_owner: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Convenience helpers:  Tables<'products'>, TablesInsert<'products'>, TablesUpdate<'products'>
export type TableName = keyof Database['public']['Tables']
export type Tables<T extends TableName> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']
