// Schema for the "Site content" editor. Every entry maps to a row in site_settings.
// types: text | textarea | number | image | strings (list of text) | list (array of objects) | object
const T = (name, label, extra) => ({ name, label, type: 'text', ...extra })
const A = (name, label) => ({ name, label, type: 'textarea' })
const I = (name, label) => ({ name, label, type: 'image' })

export const tabs = [
  { id: 'general', label: 'General', items: [
    { key: 'site_name', label: 'Site name', type: 'text' },
    { key: 'tagline', label: 'Tagline', type: 'text' },
    { key: 'announcement_bar', label: 'Announcement bar (top of every page)', type: 'text' },
    { key: 'contact_email', label: 'Contact email', type: 'text' },
    { key: 'contact_phone', label: 'Contact phone', type: 'text' },
    { key: 'footer_blurb', label: 'Footer description', type: 'textarea' },
    { key: 'footer_text', label: 'Footer copyright line', type: 'text' },
    { key: 'social_instagram', label: 'Instagram URL', type: 'text' },
    { key: 'social_x', label: 'X (Twitter) URL', type: 'text' },
  ] },
  { id: 'checkout', label: 'Checkout & shipping', items: [
    { key: 'flat_shipping_rate', label: 'Shipping fee in KSh (0 = free)', type: 'number' },
    { key: 'free_shipping_threshold', label: 'Free shipping above this subtotal in KSh (0 = never applies)', type: 'number' },
  ] },
  { id: 'home', label: 'Home page', note: 'The hero image/headline, the "Own the Darkness" banner and the Collection header are edited under Website → Banners.', items: [
    { key: 'home_hero_extras', label: 'Hero extras', type: 'object', fields: [T('badge', 'Badge text'), T('cta2_text', 'Second button text'), T('cta2_link', 'Second button link')] },
    { key: 'home_ticker', label: 'Scrolling ticker', type: 'strings' },
    { key: 'home_palette', label: 'Featured section heading', type: 'object', fields: [T('title', 'Title'), T('subtitle', 'Subtitle')] },
    { key: 'home_specs', label: 'Specifications section', type: 'object', fields: [
      T('eyebrow', 'Eyebrow'), T('title1', 'Title line 1'), T('title2', 'Title line 2 (muted)'), A('body', 'Body'), I('image', 'Image'),
      T('weight_value', 'Weight value'), T('weight_unit', 'Weight unit'), T('drop_value', 'Drop value'), T('drop_unit', 'Drop unit'),
      { name: 'features', label: 'Feature list', type: 'list', fields: [T('title', 'Title'), T('desc', 'Description')], blank: { title: '', desc: '' } },
    ] },
    { key: 'home_arrivals', label: 'New arrivals heading', type: 'object', fields: [T('title', 'Title')] },
  ] },
  { id: 'atelier', label: 'Atelier page', items: [
    { key: 'atelier', label: 'Atelier page', type: 'object', fields: [
      I('hero_image', 'Hero image'), T('eyebrow', 'Eyebrow'), T('title1', 'Title line 1'), T('title2', 'Title line 2'),
      T('story_eyebrow', 'Story eyebrow'), T('story_title1', 'Story title line 1'), T('story_title2', 'Story title line 2 (muted)'),
      A('story_p1', 'Story paragraph 1'), A('story_p2', 'Story paragraph 2'), I('story_image', 'Story image'),
      T('materials_title', 'Materials heading'),
      { name: 'materials', label: 'Materials', type: 'list', fields: [T('name', 'Name'), T('tag', 'Tag'), A('desc', 'Description')], blank: { name: '', tag: '', desc: '' } },
      T('values_title', 'Values heading'),
      { name: 'values', label: 'Values', type: 'list', fields: [T('title', 'Title'), A('desc', 'Description')], blank: { title: '', desc: '' } },
    ] },
  ] },
  { id: 'performance', label: 'Performance page', items: [
    { key: 'performance', label: 'Performance page', type: 'object', fields: [
      I('hero_image', 'Hero image'), T('eyebrow', 'Eyebrow'), T('title1', 'Title line 1'), T('title2', 'Title line 2 (gradient)'), A('body', 'Intro'),
      T('cta_text', 'Button text'), T('cta_link', 'Button link'),
      { name: 'stats', label: 'Stats', type: 'list', fields: [T('value', 'Value'), T('label', 'Label')], blank: { value: '', label: '' } },
      T('tech_title', 'Technology heading'),
      { name: 'tech', label: 'Technology cards', type: 'list', fields: [T('title', 'Title'), A('desc', 'Description'), I('image', 'Image')], blank: { title: '', desc: '', image: '' } },
      T('models_title', 'Models heading'),
      { name: 'category_slugs', label: 'Category slugs shown as models (e.g. performance)', type: 'strings' },
    ] },
  ] },
  { id: 'contact', label: 'Contact page', items: [
    { key: 'contact', label: 'Contact page', type: 'object', fields: [
      T('eyebrow', 'Eyebrow'), T('title', 'Title'), T('subtitle', 'Subtitle'),
      { name: 'info', label: 'Contact details', type: 'list', fields: [T('label', 'Label'), A('value', 'Value')], blank: { label: '', value: '' } },
      A('custom_note', 'Custom-order note'),
      { name: 'budget_ranges', label: 'Custom-order budget options', type: 'strings' },
    ] },
  ] },
  { id: 'pages', label: 'Journal, FAQ & sizing', note: 'Journal posts are under Website → Blog posts, FAQ entries under Website → FAQs, and info pages (About, Shipping & Returns, Privacy, Terms) under Website → Pages.', items: [
    { key: 'journal', label: 'Journal page heading', type: 'object', fields: [T('eyebrow', 'Eyebrow'), T('title', 'Title'), A('subtitle', 'Subtitle')] },
    { key: 'faq_page', label: 'FAQ page heading', type: 'object', fields: [T('eyebrow', 'Eyebrow'), T('title', 'Title'), A('subtitle', 'Subtitle')] },
    { key: 'size_guide', label: 'Size guide', type: 'object', fields: [
      A('note', 'Note'),
      { name: 'rows', label: 'Size rows', type: 'list', fields: [T('us', 'US'), T('eu', 'EU'), T('uk', 'UK'), T('cm', 'Foot length (cm)')], blank: { us: '', eu: '', uk: '', cm: '' } },
    ] },
  ] },
]
