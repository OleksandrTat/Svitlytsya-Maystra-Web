-- 0012: Pricing improvements
-- - price_formulas.user_inputs for customer-facing calculator inputs
-- - price_presets.variable_key for formula expressions
-- - formula_components notes + discount support

alter table public.price_formulas
  add column if not exists user_inputs jsonb not null default '[]'::jsonb;

alter table public.price_presets
  add column if not exists variable_key text;

update public.price_presets
set variable_key = coalesce(
  nullif(lower(regexp_replace(name, '[^a-zA-Z0-9]+', '_', 'g')), ''),
  'preset_' || substr(id::text, 1, 8)
)
where variable_key is null;

alter table public.price_presets
  alter column variable_key set not null;

create unique index if not exists idx_price_presets_variable_key
  on public.price_presets(variable_key);

alter table public.formula_components
  add column if not exists notes text,
  add column if not exists is_discount boolean not null default false;

insert into public.price_presets (name, variable_key, category, unit, value, currency, notes)
select
  name,
  variable_key,
  category::price_preset_category,
  unit,
  value,
  currency,
  notes
from (
  values
    ('Дуб (дошка)', 'oak_board', 'material', 'м2', 1200, 'UAH', 'Ціна за м2 дубової дошки'),
    ('Ясен (дошка)', 'ash_board', 'material', 'м2', 900, 'UAH', 'Ціна за м2 ясеневої дошки'),
    ('Сосна (дошка)', 'pine_board', 'material', 'м2', 450, 'UAH', 'Ціна за м2 соснової дошки'),
    ('МДФ 16 мм', 'mdf_16', 'material', 'м2', 280, 'UAH', 'Лист МДФ 16 мм'),
    ('Фанера 18 мм', 'plywood_18', 'material', 'м2', 320, 'UAH', 'Фанера 18 мм'),
    ('Лак матовий', 'varnish_matte', 'consumable', 'м2', 85, 'UAH', 'Лакування у 2 шари'),
    ('Фарба біла', 'paint_white', 'consumable', 'м2', 120, 'UAH', 'Акрилова фарба'),
    ('Фурнітура стандарт', 'hardware_std', 'material', 'комплект', 1800, 'UAH', 'Петлі, ручка, замок'),
    ('Фурнітура преміум', 'hardware_premium', 'material', 'комплект', 4500, 'UAH', 'Преміум комплект фурнітури'),
    ('Скло матове 4 мм', 'glass_frosted', 'material', 'м2', 650, 'UAH', 'Матовe скло 4 мм'),
    ('Монтаж дверей', 'install_door', 'labor', 'шт', 1500, 'UAH', 'Встановлення одних дверей'),
    ('Монтаж вікна', 'install_window', 'labor', 'шт', 2200, 'UAH', 'Встановлення одного вікна'),
    ('Столяр година', 'carpenter_hour', 'labor', 'год', 250, 'UAH', 'Ставка столяра за годину'),
    ('Цех за день', 'workshop_day', 'overhead', 'день', 800, 'UAH', 'Амортизація цеху за день'),
    ('Доставка за км', 'delivery_km', 'overhead', 'км', 15, 'UAH', 'Логістика за кілометр')
) as seed(name, variable_key, category, unit, value, currency, notes)
where not exists (
  select 1 from public.price_presets existing where existing.variable_key = seed.variable_key
);