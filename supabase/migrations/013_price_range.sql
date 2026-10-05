-- 013: rescale the current catalog (KSh 20,650–36,750) into KSh 1,000–4,500 so every price and
-- every "compare at" price stays within KSh 1,000–5,000. Only touches the 8 Lovfoot products.
update public.products p set
  compare_at_price = case when p.compare_at_price is null then null
    else least(5000, greatest(round(n.new_price * p.compare_at_price / p.price / 50) * 50, n.new_price + 100)) end,
  price = n.new_price
from (
  select id, round((1000 + (price - 20650) * 3500.0 / 16100) / 50) * 50 as new_price
  from public.products
  where slug in ('apex-terra','dune-hiker','obsidian-walker','stratus-noir','terra-bronze','stealth-runner','canyon-lo','lunar-drift')
) n
where p.id = n.id and p.price > 5000;

-- Custom-order budgets scaled to the new price level.
update public.site_settings
  set value = jsonb_set(value, '{budget_ranges}', '["KSh 5,000–8,000","KSh 8,000–12,000","KSh 12,000–20,000","KSh 20,000+"]')
  where key = 'contact';
