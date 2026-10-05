-- 012: the shop prices in Kenyan shillings (KES). Converts existing USD data once at 129 KES/USD.
-- Guarded by site_settings.currency so re-running is a no-op.
do $$
begin
  if coalesce((select value #>> '{}' from public.site_settings where key = 'currency'), 'USD') <> 'KES' then
    -- Catalog: round to the nearest KSh 50 for clean shelf prices.
    update public.products set
      price = round(price * 129 / 50) * 50,
      compare_at_price = case when compare_at_price is null then null else round(compare_at_price * 129 / 50) * 50 end;
    update public.product_variants set price_override = round(price_override * 129 / 50) * 50 where price_override is not null;

    -- Historic orders: exact conversion so total = subtotal + shipping and line_total = qty * unit_price still hold.
    update public.order_items i set unit_price = i.unit_price * 129, line_total = i.line_total * 129
      from public.orders o where o.id = i.order_id and o.currency = 'USD';
    update public.orders set subtotal = subtotal * 129, shipping = shipping * 129, total = total * 129, currency = 'KES'
      where currency = 'USD';
  end if;
end $$;

alter table public.orders alter column currency set default 'KES';

insert into public.site_settings (key, value, description) values
  ('currency', '"KES"', 'Currency prices are stored and shown in')
on conflict (key) do update set value = '"KES"';
delete from public.site_settings where key = 'usd_to_kes_rate';
update public.site_settings set description = 'Shipping fee in KSh charged below the free-shipping threshold (0 = free)' where key = 'flat_shipping_rate';
update public.site_settings set description = 'Subtotal in KSh at which shipping becomes free (0 = never applies)' where key = 'free_shipping_threshold';
update public.site_settings
  set value = jsonb_set(value, '{budget_ranges}', '["KSh 40,000–65,000","KSh 65,000–100,000","KSh 100,000–150,000","KSh 150,000+"]')
  where key = 'contact';
