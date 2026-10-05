// Single source of truth for the admin UI. To make a new table editable,
// add an entry here (and a row in the sidebar group). No other code needed.
//
// field types: text | textarea | number | select | checkbox | image | tags | datetime | json | ref
const STATUS = { name: 'status', type: 'select', options: ['draft', 'published', 'archived'], default: 'draft' }
const SORT = { name: 'sort_order', type: 'number', default: 0 }
const slugFrom = 'name'

// Sidebar. Items with a `to` are custom screens; plain strings are generic resources below.
export const groups = [
  { label: 'Catalog', items: ['products', 'categories', 'brands'] },
  { label: 'Sales', items: ['orders', 'payments', 'customers'] },
  { label: 'Engagement', items: ['reviews', 'contact_requests', 'custom_requests', 'newsletter_subscribers'] },
  { label: 'Website', items: [{ to: 'content', label: 'Site content' }, 'banners', 'faqs', 'pages', 'blogs', 'blog_categories', 'site_settings'] },
]

export const resources = {
  categories: {
    label: 'Categories', columns: ['name', 'slug', 'status', 'sort_order'], order: 'sort_order',
    fields: [
      { name: 'name', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, slugFrom },
      { name: 'description', type: 'textarea' }, { name: 'image_url', type: 'image', bucket: 'site-assets' }, STATUS, SORT,
    ],
  },
  brands: {
    label: 'Brands', columns: ['name', 'slug', 'status', 'sort_order'], order: 'sort_order',
    fields: [
      { name: 'name', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, slugFrom },
      { name: 'description', type: 'textarea' }, { name: 'logo_url', type: 'image', bucket: 'site-assets' }, STATUS, SORT,
    ],
  },
  products: {
    label: 'Products', columns: ['name', 'price', 'gender', 'is_featured', 'status'], order: 'sort_order',
    fields: [
      { name: 'name', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, slugFrom },
      { name: 'short_description', type: 'text' }, { name: 'description', type: 'textarea' },
      { name: 'price', type: 'number', step: '0.01', required: true }, { name: 'compare_at_price', type: 'number', step: '0.01', nullable: true },
      { name: 'brand_id', label: 'Brand', type: 'ref', table: 'brands', required: true },
      { name: 'category_id', label: 'Category', type: 'ref', table: 'categories', required: true },
      { name: 'gender', type: 'select', options: ['men', 'women', 'unisex', 'kids'], default: 'unisex' },
      { name: 'badge', type: 'text' }, { name: 'specs', type: 'kv', default: {} },
      { name: 'is_featured', type: 'checkbox', default: false }, { name: 'tags', type: 'tags', default: [] }, STATUS, SORT,
    ],
  },
  product_variants: {
    label: 'Variants', columns: ['sku', 'size', 'color', 'stock', 'status'], order: 'created_at',
    fields: [
      { name: 'product_id', label: 'Product', type: 'ref', table: 'products', required: true },
      { name: 'size', type: 'text', required: true }, { name: 'color', type: 'text' },
      { name: 'sku', type: 'text', required: true }, { name: 'price_override', type: 'number', step: '0.01', nullable: true },
      { name: 'stock', type: 'number', default: 0 }, STATUS, SORT,
    ],
  },
  product_images: {
    label: 'Product images', columns: ['url', 'alt_text', 'sort_order'], order: 'created_at',
    fields: [
      { name: 'product_id', label: 'Product', type: 'ref', table: 'products', required: true },
      { name: 'url', type: 'image', bucket: 'product-images', required: true }, { name: 'alt_text', type: 'text' }, SORT,
    ],
  },
  orders: {
    label: 'Orders', columns: ['order_number', 'status', 'total', 'currency', 'created_at'], order: 'created_at', desc: true, canCreate: false, canDelete: false,
    fields: [
      { name: 'order_number', type: 'text', readOnly: true },
      { name: 'status', type: 'select', options: ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'] },
      { name: 'subtotal', type: 'number', readOnly: true }, { name: 'shipping', type: 'number', readOnly: true },
      { name: 'total', type: 'number', readOnly: true }, { name: 'shipping_address', type: 'json', readOnly: true },
    ],
    related: [
      { table: 'order_items', fk: 'order_id', title: 'Items', columns: ['product_name_snapshot', 'variant_label_snapshot', 'qty', 'unit_price', 'line_total'] },
      { table: 'order_status_history', fk: 'order_id', title: 'Status history', columns: ['from_status', 'to_status', 'created_at'] },
    ],
  },
  payments: {
    label: 'M-Pesa payments', columns: ['phone', 'amount', 'currency', 'status', 'mpesa_receipt', 'created_at'], order: 'created_at', desc: true, canCreate: false, canDelete: false, readOnly: true,
    fields: [
      { name: 'phone', type: 'text', readOnly: true }, { name: 'amount', type: 'number', readOnly: true }, { name: 'currency', type: 'text', readOnly: true },
      { name: 'status', type: 'text', readOnly: true }, { name: 'mpesa_receipt', type: 'text', readOnly: true }, { name: 'result_desc', type: 'text', readOnly: true },
      { name: 'checkout_request_id', type: 'text', readOnly: true }, { name: 'raw_callback', type: 'json', readOnly: true },
    ],
  },
  customers: {
    label: 'Customers', columns: ['full_name', 'email', 'phone', 'created_at'], order: 'created_at', desc: true, canCreate: false, canDelete: false,
    fields: [{ name: 'full_name', type: 'text' }, { name: 'email', type: 'text', readOnly: true }, { name: 'phone', type: 'text' }],
  },
  reviews: {
    label: 'Reviews', columns: ['rating', 'title', 'reviewer_name', 'status'], order: 'created_at', desc: true,
    fields: [
      { name: 'product_id', label: 'Product', type: 'ref', table: 'products', required: true },
      { name: 'reviewer_name', type: 'text' }, { name: 'rating', type: 'number', required: true }, { name: 'title', type: 'text' },
      { name: 'body', type: 'textarea' }, STATUS, SORT,
    ],
  },
  contact_requests: {
    label: 'Contact requests', columns: ['name', 'email', 'subject', 'status', 'created_at'], order: 'created_at', desc: true, canCreate: false,
    fields: [
      { name: 'name', type: 'text', readOnly: true }, { name: 'email', type: 'text', readOnly: true }, { name: 'subject', type: 'text', readOnly: true },
      { name: 'message', type: 'textarea', readOnly: true }, { name: 'status', type: 'select', options: ['new', 'in_progress', 'resolved', 'spam'] },
    ],
  },
  custom_requests: {
    label: 'Custom requests', columns: ['name', 'email', 'budget_range', 'status', 'created_at'], order: 'created_at', desc: true, canCreate: false,
    fields: [
      { name: 'name', type: 'text', readOnly: true }, { name: 'email', type: 'text', readOnly: true },
      { name: 'product_description', type: 'textarea', readOnly: true }, { name: 'size', type: 'text', readOnly: true },
      { name: 'budget_range', type: 'text', readOnly: true }, { name: 'message', type: 'textarea', readOnly: true },
      { name: 'status', type: 'select', options: ['new', 'in_progress', 'quoted', 'completed', 'declined'] },
    ],
  },
  newsletter_subscribers: {
    label: 'Subscribers', columns: ['email', 'status', 'created_at'], order: 'created_at', desc: true,
    fields: [{ name: 'email', type: 'text', required: true }, { name: 'status', type: 'select', options: ['active', 'unsubscribed'], default: 'active' }],
  },
  blog_categories: {
    label: 'Blog categories', columns: ['name', 'slug', 'status'], order: 'sort_order',
    fields: [{ name: 'name', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, slugFrom }, STATUS, SORT],
  },
  blogs: {
    label: 'Blog posts', columns: ['title', 'author_name', 'status', 'published_at'], order: 'sort_order',
    fields: [
      { name: 'title', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, slugFrom: 'title' },
      { name: 'excerpt', type: 'textarea' }, { name: 'content_md', label: 'Content (Markdown)', type: 'textarea', rows: 14 },
      { name: 'cover_image_url', type: 'image', bucket: 'blog-images' }, { name: 'author_name', type: 'text' },
      { name: 'category_id', label: 'Category', type: 'ref', table: 'blog_categories', nullable: true },
      { name: 'published_at', type: 'datetime', nullable: true }, STATUS, SORT,
    ],
  },
  pages: {
    label: 'Pages', columns: ['title', 'slug', 'status'], order: 'sort_order',
    fields: [
      { name: 'title', type: 'text', required: true }, { name: 'slug', type: 'text', required: true, slugFrom: 'title' },
      { name: 'content_md', label: 'Content (Markdown)', type: 'textarea', rows: 14 }, STATUS, SORT,
    ],
  },
  banners: {
    label: 'Banners', columns: ['title', 'placement', 'status', 'starts_at', 'ends_at'], order: 'sort_order',
    fields: [
      { name: 'title', type: 'text', required: true }, { name: 'subtitle', type: 'text' },
      { name: 'image_url', type: 'image', bucket: 'banner-images' }, { name: 'cta_text', type: 'text' }, { name: 'cta_link', type: 'text' },
      { name: 'placement', type: 'select', options: ['home_hero', 'home_mid', 'category_top'], default: 'home_hero' },
      { name: 'starts_at', type: 'datetime' }, { name: 'ends_at', type: 'datetime', nullable: true }, STATUS, SORT,
    ],
  },
  faqs: {
    label: 'FAQs', columns: ['question', 'category', 'status'], order: 'sort_order',
    fields: [{ name: 'question', type: 'text', required: true }, { name: 'answer', type: 'textarea', required: true }, { name: 'category', type: 'text', default: 'general' }, STATUS, SORT],
  },
  site_settings: {
    label: 'Site settings', pk: 'key', columns: ['key', 'value', 'description'], order: 'key',
    fields: [{ name: 'key', type: 'text', required: true, lockOnEdit: true }, { name: 'value', type: 'json', default: null }, { name: 'description', type: 'text' }],
  },
}
