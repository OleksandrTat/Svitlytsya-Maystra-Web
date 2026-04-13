-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Initial data for Svitlytsya workshop
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. COMPANY INFO ──────────────────────────────────────────────────────────

INSERT INTO public.company_info (
  id, name, tagline, description, founded_year,
  email, phone, phone_secondary, address, city, country,
  working_hours, social_instagram, social_facebook,
  team_members, certificates, updated_at
) VALUES (
  gen_random_uuid(),
  'Світлиця Майстра',
  'Дерево, що живе у вашому домі',
  'Майстерня «Світлиця» — це ручне виробництво дверей, меблів і дерев''яних виробів на замовлення у Києві. Більше 10 років ми перетворюємо дерево на функціональне та красиве рішення для кожного простору.',
  2014,
  'info@svitlytsya.ua',
  '+380 (67) 000-00-00',
  '+380 (50) 000-00-00',
  'вул. Деревообробна, 12',
  'Київ',
  'Україна',
  'Пн–Пт: 09:00–18:00, Сб: 10:00–15:00',
  'https://instagram.com/svitlytsya',
  'https://facebook.com/svitlytsya',
  '[
    {"id":"t1","name":"Михайло Коваль","role":"Головний майстер","photo_url":null},
    {"id":"t2","name":"Оксана Литвин","role":"Дизайнер","photo_url":null},
    {"id":"t3","name":"Василь Гончар","role":"Майстер-столяр","photo_url":null}
  ]'::jsonb,
  '[]'::jsonb,
  now()
)
ON CONFLICT DO NOTHING;

-- ── 2. SITE SETTINGS ─────────────────────────────────────────────────────────

INSERT INTO public.site_settings (key, value, description) VALUES
(
  'contacts',
  '{
    "phone": "+380 (67) 000-00-00",
    "phone_secondary": "+380 (50) 000-00-00",
    "email": "info@svitlytsya.ua",
    "address": "вул. Деревообробна, 12, Київ",
    "hours": "Пн–Пт: 09:00–18:00",
    "hours_saturday": "Сб: 10:00–15:00",
    "map_embed": ""
  }'::jsonb,
  'Контактні дані'
),
(
  'hero',
  '{
    "title": "Живе дерево у вашому домі",
    "subtitle": "Двері, меблі та дерев''яні вироби ручної роботи на замовлення",
    "cta_primary": "Залишити заявку",
    "cta_secondary": "Наші роботи"
  }'::jsonb,
  'Головний екран (hero)'
),
(
  'seo',
  '{
    "site_name": "Світлиця Майстра",
    "default_title": "Світлиця — вироби з дерева на замовлення",
    "default_description": "Двері, меблі та реставрація з натурального дерева. Виготовляємо на замовлення у Києві.",
    "og_image": ""
  }'::jsonb,
  'SEO налаштування'
)
ON CONFLICT (key) DO NOTHING;

-- ── 3. SERVICES ──────────────────────────────────────────────────────────────

INSERT INTO public.services (
  id, title, slug, tagline, short_description, description,
  icon, category, features, process_steps,
  cover_image, gallery, price_from, price_unit,
  duration_days_from, duration_days_to,
  is_active, is_featured, sort_order,
  title_en, tagline_en, short_description_en, description_en
) VALUES

-- Двері
(
  'a1000000-0000-0000-0000-000000000001',
  'Двері на замовлення',
  'dveri-na-zamovlennia',
  'Рішення під ваш простір і розмір',
  'Вхідні та міжкімнатні двері з натурального дерева під ваш проєкт.',
  'Ми виготовляємо двері будь-якої конфігурації: масив дуба, ясена або сосни, будь-які нестандартні розміри, вбудовані системи. Повний цикл від заміру до монтажу з гарантією.',
  '🚪',
  'production',
  '[
    {"title":"Індивідуальні розміри","description":"Підганяємо конструкцію під будь-який проліт."},
    {"title":"Натуральне дерево","description":"Масив дуба, ясена, сосни — ваш вибір."},
    {"title":"Фурнітура класу premium","description":"Петлі, замки та ручки від перевірених виробників."},
    {"title":"Монтаж і гарантія","description":"Встановлюємо власними силами, гарантія 2 роки."}
  ]'::jsonb,
  '[
    {"step":1,"title":"Консультація","description":"Обговорюємо задачу, матеріали і стилістику."},
    {"step":2,"title":"Замір","description":"Виїжджаємо на об''єкт, фіксуємо точні параметри."},
    {"step":3,"title":"Виробництво","description":"Виготовляємо виріб у майстерні від 7 до 21 дня."},
    {"step":4,"title":"Монтаж","description":"Встановлюємо і перевіряємо роботу дверей."}
  ]'::jsonb,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80',
  '{}',
  8500, 'грн', 10, 25,
  true, true, 1,
  'Custom Doors',
  'Solutions for your space and size',
  'Entrance and interior doors made from natural wood to your project specs.',
  'We manufacture doors of any configuration: solid oak, ash or pine, any non-standard sizes, built-in systems. Full cycle from measurement to installation with warranty.'
),

-- Меблі
(
  'a1000000-0000-0000-0000-000000000002',
  'Меблі на замовлення',
  'mebli-na-zamovlennia',
  'Функціональні меблі без шаблонів',
  'Кухні, шафи, стелажі та корпусні рішення під ваш простір.',
  'Проєктуємо і виготовляємо меблі під конкретний простір: враховуємо сценарії використання, ергономіку та естетику. Від ескізу до монтажу — без посередників.',
  '🪑',
  'production',
  '[
    {"title":"Проєктування у 3D","description":"Показуємо результат до початку виробництва."},
    {"title":"Нестандартні рішення","description":"Меблі під нішу, скошену стелю, будь-яку геометрію."},
    {"title":"Вибір матеріалів","description":"Масив, МДФ, ЛДСП — підбираємо під бюджет."},
    {"title":"Збирання на місці","description":"Встановлюємо меблі і прибираємо за собою."}
  ]'::jsonb,
  '[
    {"step":1,"title":"Бриф","description":"Збираємо вимоги, замовники показують референси."},
    {"step":2,"title":"Проєкт","description":"Готуємо 3D-візуалізацію та кошторис."},
    {"step":3,"title":"Виготовлення","description":"Запускаємо виробництво після узгодження."},
    {"step":4,"title":"Монтаж","description":"Збираємо меблі на місці і налаштовуємо фасади."}
  ]'::jsonb,
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=80',
  '{}',
  12000, 'грн', 14, 35,
  true, true, 2,
  'Custom Furniture',
  'Functional furniture without templates',
  'Kitchens, wardrobes, shelving and cabinet solutions for your space.',
  'We design and manufacture furniture for specific spaces: considering usage scenarios, ergonomics and aesthetics. From sketch to installation — without intermediaries.'
),

-- Вікна
(
  'a1000000-0000-0000-0000-000000000003',
  'Вікна та рами',
  'vikna-ta-ramy',
  'Тепло та натуральність у кожному прорізі',
  'Дерев''яні вікна та рами з масиву для будинків та апартаментів.',
  'Виготовляємо дерев''яні вікна за індивідуальними розмірами: спарені рами, євровікна з подвійним склопакетом, реставрація старих рам. Натуральне дерево тримає тепло краще за пластик.',
  '🪟',
  'production',
  '[
    {"title":"Масив без компромісів","description":"Тільки натуральне дерево — ніякого ПВХ."},
    {"title":"Подвійний склопакет","description":"Сучасне скло в традиційній дерев''яній рамі."},
    {"title":"Обробка і фарбування","description":"Захищаємо деревину від вологи та УФ."},
    {"title":"Реставрація старих вікон","description":"Відновлюємо існуючі рами замість заміни."}
  ]'::jsonb,
  '[
    {"step":1,"title":"Огляд і замір","description":"Фіксуємо розміри прорізів і стан рам."},
    {"step":2,"title":"Виробництво","description":"Виготовляємо рами у майстерні."},
    {"step":3,"title":"Засклення","description":"Встановлюємо склопакети."},
    {"step":4,"title":"Монтаж","description":"Встановлюємо вікна та регулюємо петлі."}
  ]'::jsonb,
  'https://images.unsplash.com/photo-1503594384566-461fe158e797?auto=format&fit=crop&w=1200&q=80',
  '{}',
  6000, 'грн', 7, 18,
  true, false, 3,
  'Windows & Frames',
  'Warmth and naturalness in every opening',
  'Wooden windows and frames from solid wood for houses and apartments.',
  'We manufacture wooden windows to individual sizes: paired frames, euro windows with double glazing, restoration of old frames.'
),

-- Реставрація
(
  'a1000000-0000-0000-0000-000000000004',
  'Реставрація',
  'restavratsiia',
  'Друге життя для дерев''яних виробів',
  'Відновлення меблів, дверей і рам — повертаємо вигляд і міцність.',
  'Реставруємо антикварні меблі, старі двері та вікна: зачиняємо тріщини, замінюємо пошкоджені елементи, шліфуємо, тонуємо і покриваємо захисним лаком. Предмет знову служить роками.',
  '🛠️',
  'restoration',
  '[
    {"title":"Оцінка стану","description":"Визначаємо обсяг робіт ще до підписання договору."},
    {"title":"Ремонт структури","description":"Зміцнюємо з''єднання, замінюємо пошкоджені деталі."},
    {"title":"Шліфування і тонування","description":"Видаляємо старе покриття, вирівнюємо поверхню."},
    {"title":"Захисне покриття","description":"Масло або лак — захищаємо результат на роки."}
  ]'::jsonb,
  '[
    {"step":1,"title":"Оцінка","description":"Оглядаємо виріб і погоджуємо обсяг та вартість."},
    {"step":2,"title":"Демонтаж фурнітури","description":"Знімаємо ручки, петлі та замки."},
    {"step":3,"title":"Відновлення","description":"Ремонт, шліфування, тонування."},
    {"step":4,"title":"Покриття і збирання","description":"Наносимо фінішний захист, повертаємо фурнітуру."}
  ]'::jsonb,
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=1200&q=80',
  '{}',
  2500, 'грн', 3, 14,
  true, false, 4,
  'Restoration',
  'A second life for wooden products',
  'Restoration of furniture, doors and frames — we return appearance and strength.',
  'We restore antique furniture, old doors and windows: fill cracks, replace damaged elements, sand, tint and apply protective varnish.'
)

ON CONFLICT (slug) DO NOTHING;

-- ── 4. PRODUCTS ───────────────────────────────────────────────────────────────

INSERT INTO public.products (
  id, title, slug, description, short_description,
  category, materials, style, cover_image, images,
  price_from, status, sort_order, is_featured, priority,
  title_en, description_en, short_description_en
) VALUES

(
  'b1000000-0000-0000-0000-000000000001',
  'Дверна коробка масив дуба',
  'dverna-korobka-masiv-duba',
  'Масивна дверна коробка з дуба — основа для надійних дверей. Виготовляємо під будь-який розмір прольоту. Обробка маслом або лаком.',
  'Коробка з масиву дуба під нестандартний розмір',
  'doors',
  ARRAY['Дуб'],
  ARRAY['Класичний', 'Мінімалізм'],
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
  '{}',
  4200, 'active', 1, true, 8,
  'Solid Oak Door Frame',
  'Solid oak door frame — the foundation for reliable doors. Manufactured to any opening size.',
  'Solid oak frame for non-standard openings'
),

(
  'b1000000-0000-0000-0000-000000000002',
  'Міжкімнатні двері «Скандинав»',
  'mizhkimniatni-dveri-skandynav',
  'Лаконічні міжкімнатні двері у скандинавському стилі з ясена. Полотно 2000×800 мм, товщина 40 мм, вбудована коробка.',
  'Двері з ясена у мінімалістичному стилі',
  'doors',
  ARRAY['Ясен'],
  ARRAY['Скандинавський', 'Мінімалізм'],
  'https://images.unsplash.com/photo-1600607687644-c7171b42498b?auto=format&fit=crop&w=800&q=80',
  '{}',
  8900, 'active', 2, true, 9,
  'Interior Door "Scandinavian"',
  'Laconic interior doors in Scandinavian style made from ash. Panel 2000×800mm, 40mm thick, built-in frame.',
  'Ash interior doors in minimalist style'
),

(
  'b1000000-0000-0000-0000-000000000003',
  'Кухонний острів «Лофт»',
  'kukhonnyi-ostriv-loft',
  'Кухонний острів із масиву сосни в стилі лофт. Стільниця 1600×900 мм, нижня полиця з металевими прутами, ніжки зі сталевого профілю.',
  'Острів із сосни та металу для кухні в стилі лофт',
  'furniture',
  ARRAY['Сосна', 'Метал'],
  ARRAY['Лофт', 'Індустріальний'],
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80',
  '{}',
  14500, 'active', 3, true, 8,
  'Kitchen Island "Loft"',
  'Kitchen island made from solid pine in loft style. Worktop 1600×900mm, lower shelf with metal rods, steel profile legs.',
  'Pine and metal island for a loft-style kitchen'
),

(
  'b1000000-0000-0000-0000-000000000004',
  'Шафа-купе «Класика»',
  'shafa-kupe-klasyka',
  'Вбудована шафа-купе з МДФ і масивним фасадом. Ширина до 3000 мм, до стелі. Внутрішнє оснащення під запит.',
  'Вбудована шафа-купе з масивними фасадами',
  'furniture',
  ARRAY['МДФ', 'Дуб'],
  ARRAY['Класичний'],
  'https://images.unsplash.com/photo-1558997519-83ea9252eeb8?auto=format&fit=crop&w=800&q=80',
  '{}',
  22000, 'active', 4, false, 7,
  'Sliding Wardrobe "Classic"',
  'Built-in sliding wardrobe with MDF and solid wood facade. Up to 3000mm wide, floor to ceiling.',
  'Built-in sliding wardrobe with solid wood facades'
),

(
  'b1000000-0000-0000-0000-000000000005',
  'Стелаж «Бібліотека»',
  'stelazh-biblioteka',
  'Відкритий стелаж із масиву дуба у стилі кабінетної бібліотеки. Розміри: В2200 × Ш1400 × Г350 мм. Кріплення до стіни включено.',
  'Дубовий стелаж у стилі класичної бібліотеки',
  'furniture',
  ARRAY['Дуб'],
  ARRAY['Класичний', 'Кабінетний'],
  'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80',
  '{}',
  9800, 'active', 5, false, 6,
  'Bookcase "Library"',
  'Open bookcase made from solid oak in classic library style. Dimensions: H2200 × W1400 × D350mm.',
  'Solid oak bookcase in classic library style'
),

(
  'b1000000-0000-0000-0000-000000000006',
  'Євровікно дерев''яне',
  'evrovikno-dereviiane',
  'Дерев''яне євровікно зі склопакетом 32 мм. Рама з клеєного бруса хвойних порід, обробка акриловим лаком. Будь-які розміри.',
  'Євровікно з клеєного бруса зі склопакетом',
  'windows',
  ARRAY['Сосна', 'Ялиця'],
  ARRAY['Класичний'],
  'https://images.unsplash.com/photo-1503594384566-461fe158e797?auto=format&fit=crop&w=800&q=80',
  '{}',
  7200, 'active', 6, false, 7,
  'Wooden Euro Window',
  'Wooden euro window with 32mm glazing unit. Frame made from glued laminated softwood, acrylic lacquer finish.',
  'Euro window from glued laminated timber with double glazing'
)

ON CONFLICT (slug) DO NOTHING;

-- ── 5. TESTIMONIALS ───────────────────────────────────────────────────────────

INSERT INTO public.testimonials (
  id, author_name, author_location, content, rating, is_visible, content_en
) VALUES

(
  'c1000000-0000-0000-0000-000000000001',
  'Олена К.',
  'Київ',
  'Замовляли міжкімнатні двері для нової квартири. Усе зробили точно в строк, якість відмінна — рівні стики, петлі не скриплять. Майстер при монтажі пояснив усе доступно. Рекомендую.',
  5, true,
  'We ordered interior doors for our new apartment. Everything was done exactly on time, excellent quality — even joints, hinges don''t squeak. The craftsman explained everything clearly during installation. Highly recommend.'
),
(
  'c1000000-0000-0000-0000-000000000002',
  'Андрій В.',
  'Бровари',
  'Замовив кухонний острів. Хлопці самі запропонували рішення, яке ми навіть не розглядали — вийшло набагато функціональніше. Якість дерева чудова, полотно рівне.',
  5, true,
  'Ordered a kitchen island. The guys suggested a solution we hadn''t even considered — it turned out much more functional. Wood quality is excellent, surface is perfectly flat.'
),
(
  'c1000000-0000-0000-0000-000000000003',
  'Наталія Р.',
  'Київ',
  'Реставрували стару шафу-антикваріат. Боялась, що результат буде «як нова» у поганому сенсі — але зберегли характер і патину, просто зміцнили і вкрили маслом. Дуже задоволена.',
  5, true,
  'They restored an old antique wardrobe. I was afraid the result would be "like new" in a bad sense — but they preserved the character and patina, just strengthened it and coated with oil. Very satisfied.'
),
(
  'c1000000-0000-0000-0000-000000000004',
  'Максим Г.',
  'Вишгород',
  'Замовляв вбудовану шафу до стелі. Вимірювали двічі, щоб врахувати нерівності стін — і підійшло ідеально. Монтаж за один день, прибрали за собою. Все культурно і якісно.',
  5, true,
  'Ordered a built-in wardrobe to ceiling. They measured twice to account for wall unevenness — and it fit perfectly. Installation in one day, they cleaned up after themselves. Everything professional and quality.'
),
(
  'c1000000-0000-0000-0000-000000000005',
  'Ірина С.',
  'Київ',
  'Брали дубовий стелаж для домашньої бібліотеки. Довго шукала щось з масиву і не пластику — тут все серйозно, дерево живе. Вже рік стоїть, нічого не розхиталось.',
  5, true,
  'Bought an oak bookcase for a home library. I was looking for something solid wood and not plastic for a long time — here everything is serious, the wood feels alive. Has been standing for a year, nothing has come loose.'
),
(
  'c1000000-0000-0000-0000-000000000006',
  'Сергій М.',
  'Ірпінь',
  'Дерев''яні вікна на заміну старих. Монтаж чистий, нічого не пошкодили на укосах. Тягу взимку перевірив — нема. Дерево дихає, у кімнаті приємніший мікроклімат.',
  4, true,
  'Wooden windows to replace the old ones. Clean installation, they didn''t damage anything on the reveals. Checked for drafts in winter — none. Wood breathes, more pleasant microclimate in the room.'
)

ON CONFLICT DO NOTHING;

-- ── 6. FAQ ────────────────────────────────────────────────────────────────────

INSERT INTO public.faq_items (
  id, question, answer, category, sort_order, is_published, question_en, answer_en
) VALUES

(
  'd1000000-0000-0000-0000-000000000001',
  'Скільки коштують двері на замовлення?',
  'Ціна залежить від породи дерева, розмірів і складності конструкції. Прості міжкімнатні двері з ясена починаються від 8 500 грн, вхідні з дуба — від 18 000 грн. Точний розрахунок — після заміру.',
  'pricing', 1, true,
  'How much do custom doors cost?',
  'The price depends on the type of wood, dimensions and construction complexity. Simple interior doors in ash start from 8,500 UAH, entrance doors in oak from 18,000 UAH. Exact calculation after measurement.'
),
(
  'd1000000-0000-0000-0000-000000000002',
  'Як довго виготовляються вироби?',
  'Терміни залежать від складності: двері — 10–25 робочих днів, меблі — 14–35 днів, вікна — 7–18 днів. Реставрація — від 3 днів. Точний термін погоджуємо під час замовлення.',
  'process', 2, true,
  'How long does production take?',
  'Timelines depend on complexity: doors — 10–25 working days, furniture — 14–35 days, windows — 7–18 days. Restoration from 3 days. Exact timeline agreed at the time of order.'
),
(
  'd1000000-0000-0000-0000-000000000003',
  'Чи виїжджаєте на замір?',
  'Так, виїзд на замір безкоштовний у межах Києва та Київської області. Для інших регіонів — домовляємось окремо. Замір необхідний для точного виготовлення.',
  'process', 3, true,
  'Do you come to take measurements?',
  'Yes, measurement visits are free within Kyiv and Kyiv region. For other regions — we arrange separately. Measurement is necessary for precise manufacturing.'
),
(
  'd1000000-0000-0000-0000-000000000004',
  'Яке дерево краще для дверей — дуб чи ясен?',
  'Дуб міцніший і тяжчий, краще підходить для вхідних дверей і там, де важлива тривалість. Ясен легший і трохи гнучкіший — ідеальний для міжкімнатних. Обидва матеріали якісні, різниця — у характері та ціні.',
  'materials', 4, true,
  'Which wood is better for doors — oak or ash?',
  'Oak is stronger and heavier, better for entrance doors and where longevity matters. Ash is lighter and slightly more flexible — ideal for interior doors. Both materials are quality, the difference is in character and price.'
),
(
  'd1000000-0000-0000-0000-000000000005',
  'Чи надаєте гарантію?',
  'Так. На усі вироби гарантія 24 місяці від дня монтажу. Гарантія покриває дефекти виробництва та матеріалів. Монтаж виконуємо власними майстрами — так контролюємо якість на всіх етапах.',
  'warranty', 5, true,
  'Do you provide a warranty?',
  'Yes. All products have a 24-month warranty from the date of installation. The warranty covers manufacturing and material defects. Installation is done by our own craftsmen — this is how we control quality at all stages.'
),
(
  'd1000000-0000-0000-0000-000000000006',
  'Чи можна замовити нестандартний розмір?',
  'Так, це наша перевага. Ми не обмежені стандартами масового виробництва — виготовляємо під будь-який розмір прольоту, нестандартну висоту стелі або арковий отвір.',
  'general', 6, true,
  'Can I order a non-standard size?',
  'Yes, that''s our advantage. We are not limited by mass production standards — we manufacture for any opening size, non-standard ceiling height or arched opening.'
),
(
  'd1000000-0000-0000-0000-000000000007',
  'Чи займаєтесь реставрацією чужої роботи?',
  'Так. Якщо виріб фізично можна відновити — беремось. Спершу оглядаємо і даємо чесну оцінку: іноді простіше замовити нові двері, ніж реставрувати пошкоджені. Це скажемо одразу.',
  'restoration', 7, true,
  'Do you restore work by other craftsmen?',
  'Yes. If the item can physically be restored — we take it on. First we inspect and give an honest assessment: sometimes it is simpler to order new doors than to restore damaged ones. We will say this upfront.'
),
(
  'd1000000-0000-0000-0000-000000000008',
  'Як оформити замовлення?',
  'Залиште заявку на сайті або зателефонуйте. Погоджуємо деталі, виїжджаємо на замір, підписуємо договір і отримуємо аванс 50%. Решту — після прийому роботи.',
  'general', 8, true,
  'How do I place an order?',
  'Leave a request on the website or call us. We agree on the details, come to take measurements, sign a contract and receive a 50% advance. The rest — after acceptance of the work.'
)

ON CONFLICT DO NOTHING;

-- ── 7. CERTIFICATES ──────────────────────────────────────────────────────────

INSERT INTO public.certificates (
  id, title, issuer, issued_year, description, sort_order, is_published,
  title_en, issuer_en, description_en
) VALUES

(
  'e1000000-0000-0000-0000-000000000001',
  'Сертифікат майстра деревообробки',
  'Асоціація деревообробників України',
  2016,
  'Кваліфікаційний сертифікат столяра-майстра 5-го розряду.',
  1, true,
  'Master Woodworking Certificate',
  'Association of Woodworkers of Ukraine',
  'Qualification certificate of joiner-master 5th grade.'
),
(
  'e1000000-0000-0000-0000-000000000002',
  'ISO 9001 — Система управління якістю',
  'Bureau Veritas',
  2021,
  'Сертифікація виробничих процесів майстерні за міжнародним стандартом якості.',
  2, true,
  'ISO 9001 — Quality Management System',
  'Bureau Veritas',
  'Certification of workshop production processes according to international quality standard.'
),
(
  'e1000000-0000-0000-0000-000000000003',
  'Еко-деревина — сертифікат FSC',
  'Forest Stewardship Council',
  2022,
  'Підтверджує використання деревини з відповідально керованих лісів.',
  3, true,
  'Eco-Wood — FSC Certificate',
  'Forest Stewardship Council',
  'Confirms the use of wood from responsibly managed forests.'
)

ON CONFLICT DO NOTHING;

-- ── 8. PRICE PRESETS ─────────────────────────────────────────────────────────

INSERT INTO public.price_presets (
  id, name, category, unit, value, currency, variable_key, notes
) VALUES

-- Матеріали
(
  'f1000000-0000-0000-0000-000000000001',
  'Дуб масив (1 кв. м)', 'material', 'м²', 1800, 'UAH', 'oak_sqm',
  'Стандартна ціна масиву дуба 1-го сорту'
),
(
  'f1000000-0000-0000-0000-000000000002',
  'Ясен масив (1 кв. м)', 'material', 'м²', 1400, 'UAH', 'ash_sqm',
  'Стандартна ціна масиву ясена 1-го сорту'
),
(
  'f1000000-0000-0000-0000-000000000003',
  'Сосна масив (1 кв. м)', 'material', 'м²', 850, 'UAH', 'pine_sqm',
  'Стандартна ціна соснового масиву'
),
(
  'f1000000-0000-0000-0000-000000000004',
  'МДФ 18 мм (1 кв. м)', 'material', 'м²', 320, 'UAH', 'mdf_sqm',
  'МДФ плита 18 мм для корпусних виробів'
),
(
  'f1000000-0000-0000-0000-000000000005',
  'Склопакет стандарт (1 кв. м)', 'material', 'м²', 950, 'UAH', 'glass_sqm',
  'Двокамерний склопакет 32 мм'
),

-- Витратні матеріали
(
  'f1000000-0000-0000-0000-000000000006',
  'Масло захисне (1 л)', 'consumable', 'л', 420, 'UAH', 'oil_liter',
  'Олія-віск для обробки деревини, витрата ~0.1 л/м²'
),
(
  'f1000000-0000-0000-0000-000000000007',
  'Лак акриловий (1 л)', 'consumable', 'л', 380, 'UAH', 'lacquer_liter',
  'Водорозчинний акриловий лак, витрата ~0.12 л/м²'
),
(
  'f1000000-0000-0000-0000-000000000008',
  'Фурнітура двері (комплект)', 'consumable', 'комплект', 1200, 'UAH', 'door_hardware_set',
  'Петлі 3 шт + ручка + замок'
),
(
  'f1000000-0000-0000-0000-000000000009',
  'Фурнітура вікно (комплект)', 'consumable', 'комплект', 850, 'UAH', 'window_hardware_set',
  'Завіси + ручка поворотно-відкидна'
),

-- Праця
(
  'f1000000-0000-0000-0000-000000000010',
  'Столярні роботи (1 год)', 'labor', 'год', 450, 'UAH', 'labor_hour',
  'Стандартна ставка столяра'
),
(
  'f1000000-0000-0000-0000-000000000011',
  'Монтаж дверей (1 отвір)', 'labor', 'шт', 1800, 'UAH', 'door_install',
  'Встановлення дверного блоку, включно з коробкою'
),
(
  'f1000000-0000-0000-0000-000000000012',
  'Монтаж вікна (1 отвір)', 'labor', 'шт', 2200, 'UAH', 'window_install',
  'Встановлення вікна з відкосами'
),
(
  'f1000000-0000-0000-0000-000000000013',
  'Виїзд і замір', 'labor', 'виїзд', 0, 'UAH', 'measurement_visit',
  'Безкоштовно у межах Київської обл.'
),

-- Накладні
(
  'f1000000-0000-0000-0000-000000000014',
  'Маржа майстерні', 'overhead', '%', 25, 'UAH', 'margin_pct',
  'Відсоток маржинальності (від собівартості)'
),
(
  'f1000000-0000-0000-0000-000000000015',
  'ПДВ', 'overhead', '%', 20, 'UAH', 'vat_pct',
  'Якщо виставляємо рахунок з ПДВ'
)

ON CONFLICT (name) DO NOTHING;
