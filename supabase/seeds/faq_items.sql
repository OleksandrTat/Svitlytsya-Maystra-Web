-- FAQ Items seed — Svitlytsya Maystra
-- Categories: general | production | delivery | warranty | payment
-- Columns: question (uk), answer (uk), question_en, answer_en, category, sort_order, is_published

truncate table public.faq_items restart identity cascade;

insert into public.faq_items (question, answer, question_en, answer_en, category, sort_order, is_published) values

-- ═══════════════════════════════════════════════════════════
-- GENERAL
-- ═══════════════════════════════════════════════════════════
(
  'Чим займається майстерня Svitlytsya?',
  'Майстерня Svitlytsya — це сімейне виробництво дерев''яних виробів ручної роботи з 1998 року. Ми виготовляємо авторські двері, меблі та вікна з натурального дерева на замовлення. Кожен виріб проектується індивідуально під простір і побажання клієнта.',
  'What does the Svitlytsya workshop do?',
  'Svitlytsya is a family woodworking workshop founded in 1998. We handcraft custom doors, furniture and windows from natural wood. Every piece is individually designed to match the client''s space and vision.',
  'general', 10, true
),
(
  'Чи можна замовити виріб за власним ескізом або дизайн-проєктом?',
  'Так, ми працюємо з власними ескізами клієнта, дизайн-проєктами та технічними кресленнями. Якщо у вас є ідея, але немає готового проєкту — наш майстер допоможе її оформити під час безкоштовної консультації.',
  'Can I order a product based on my own sketch or design project?',
  'Yes, we work with your own sketches, design projects and technical drawings. If you have an idea but no finished design — our craftsman will help develop it during a free consultation.',
  'general', 20, true
),
(
  'Як розпочати співпрацю з майстернею?',
  'Найпростіше — заповнити форму на сайті або зателефонувати нам. Після цього ми призначаємо безкоштовну консультацію, уточнюємо деталі проєкту, виміри та матеріали, і готуємо індивідуальний розрахунок вартості.',
  'How do I start working with the workshop?',
  'The easiest way is to fill out the form on our website or give us a call. We then schedule a free consultation to discuss project details, measurements and materials, and prepare an individual cost estimate.',
  'general', 30, true
),
(
  'Чи працюєте ви з юридичними особами та будівельними компаніями?',
  'Так, ми співпрацюємо з дизайн-студіями, забудовниками та будівельними компаніями. Можемо надати всі необхідні документи для бухгалтерії та укласти договір на виконання робіт.',
  'Do you work with businesses and construction companies?',
  'Yes, we collaborate with design studios, developers and construction companies. We can provide all necessary accounting documents and sign a formal service agreement.',
  'general', 40, true
),
(
  'Чи є у вас шоурум або можна приїхати подивитися на роботи?',
  'У нас є майстерня в Слобідці Тернопільської області, де можна побачити зразки робіт та поспілкуватися з майстром особисто. Для візиту рекомендуємо попередньо домовитися про час телефоном або через форму на сайті.',
  'Do you have a showroom or can I visit to see the work?',
  'We have a workshop in Slobidka, Ternopil region, where you can view work samples and speak with the craftsman in person. We recommend scheduling a visit in advance by phone or via the contact form on our website.',
  'general', 50, true
),

-- ═══════════════════════════════════════════════════════════
-- PRODUCTION
-- ═══════════════════════════════════════════════════════════
(
  'З яких порід дерева ви виготовляєте вироби?',
  'Ми працюємо переважно з дубом, ясенем, сосною та буком. Для окремих проєктів використовуємо горіх, вишню та екзотичні породи. Вибір матеріалу залежить від призначення виробу, бажаного стилю та бюджету.',
  'What types of wood do you work with?',
  'We primarily work with oak, ash, pine and beech. For select projects we use walnut, cherry and exotic species. The choice of wood depends on the intended use, desired style and budget.',
  'production', 10, true
),
(
  'Скільки часу займає виготовлення замовлення?',
  'Терміни виготовлення залежать від складності виробу. Прості вироби (наприклад, одне вікно або полиця) — від 2 до 4 тижнів. Складні проєкти (комплектна обстановка кімнати, нестандартні двері) — від 6 до 12 тижнів. Точний термін узгоджується при оформленні замовлення.',
  'How long does it take to make an order?',
  'Production time depends on the complexity of the piece. Simple items (e.g., a single window or shelf) take 2–4 weeks. Complex projects (full room furnishings, custom doors) take 6–12 weeks. The exact timeline is agreed upon when placing the order.',
  'production', 20, true
),
(
  'Чи використовуєте ви екологічно чисті матеріали та лаки?',
  'Так, ми використовуємо лише сертифіковані оздоблювальні матеріали провідних європейських виробників — олії, воски та лаки на водній основі без токсичних розчинників. Деревина проходить природне висушування та обробку антисептиком.',
  'Do you use eco-friendly materials and finishes?',
  'Yes, we use only certified finishing materials from leading European manufacturers — oils, waxes and water-based lacquers with no toxic solvents. The wood undergoes natural drying and antiseptic treatment.',
  'production', 30, true
),
(
  'Чи можна поєднати дерево з іншими матеріалами (металом, склом, каменем)?',
  'Так, ми регулярно виконуємо комбіновані проєкти: двері з ковальськими вставками, меблі зі скляними фасадами, столи з кам''яними стільницями. Для таких виробів ми координуємо роботу з перевіреними партнерами.',
  'Can wood be combined with other materials (metal, glass, stone)?',
  'Yes, we regularly execute combined projects: doors with wrought iron inserts, furniture with glass fronts, tables with stone tops. For such pieces we coordinate with our trusted partners.',
  'production', 40, true
),
(
  'Чи займаєтеся ви реставрацією старих меблів та дверей?',
  'Так, реставрація — один з наших напрямків. Ми відновлюємо антикварні меблі, старовинні двері та інші дерев''яні вироби: шліфування, заміна пошкоджених елементів, оновлення покриття. Оцінка стану й вартості реставрації — безкоштовно.',
  'Do you restore old furniture and doors?',
  'Yes, restoration is one of our specialties. We restore antique furniture, vintage doors and other wooden items: sanding, replacing damaged parts, refinishing. Assessment and cost estimation for restoration is free of charge.',
  'production', 50, true
),

-- ═══════════════════════════════════════════════════════════
-- DELIVERY
-- ═══════════════════════════════════════════════════════════
(
  'У які регіони України ви здійснюєте доставку?',
  'Ми доставляємо вироби по всій Україні. Для виробів, що потребують монтажу, наш майстер виїжджає особисто. Дрібніші вироби відправляємо перевіреними транспортними компаніями з надійним пакуванням.',
  'Which regions of Ukraine do you deliver to?',
  'We deliver across all of Ukraine. For items requiring installation, our craftsman travels to the site personally. Smaller items are shipped via trusted freight companies with secure packaging.',
  'delivery', 10, true
),
(
  'Чи займаєтеся ви монтажем та встановленням виробів?',
  'Так, ми пропонуємо повний цикл: виготовлення, доставка та монтаж. Встановлення дверей, вікон та великогабаритних меблів проводять наші майстри. Вартість монтажу розраховується окремо залежно від складності та відстані.',
  'Do you handle installation and fitting?',
  'Yes, we offer a complete cycle: manufacturing, delivery and installation. Doors, windows and large furniture are installed by our craftsmen. Installation cost is calculated separately based on complexity and distance.',
  'delivery', 20, true
),
(
  'Як упаковуються вироби для транспортування?',
  'Усі вироби ретельно упаковуються у захисну плівку, поролон та дерев''яні рами. Для крихких або складних конструкцій виготовляємо індивідуальну тару. Страхування вантажу доступне за запитом.',
  'How are products packaged for transport?',
  'All items are carefully wrapped in protective film, foam and wooden frames. For fragile or complex structures we build custom crates. Cargo insurance is available upon request.',
  'delivery', 30, true
),

-- ═══════════════════════════════════════════════════════════
-- WARRANTY
-- ═══════════════════════════════════════════════════════════
(
  'Яка гарантія на вироби майстерні?',
  'На всі вироби ми надаємо гарантію 3 роки. Гарантія покриває виробничі дефекти, деформацію деревини та проблеми з фурнітурою. Природне розсихання та пошкодження через неналежний догляд у гарантійний випадок не входять.',
  'What warranty do you offer?',
  'All our products come with a 3-year warranty. It covers manufacturing defects, wood deformation and hardware issues. Natural shrinkage and damage from improper care are not covered.',
  'warranty', 10, true
),
(
  'Що робити, якщо виріб пошкоджено під час доставки?',
  'У разі пошкодження під час доставки необхідно зафіксувати це у присутності кур''єра, сфотографувати та повідомити нас у день отримання. Ми вирішимо питання ремонту або заміни за наш рахунок.',
  'What should I do if the item is damaged during delivery?',
  'If damage occurs during delivery, note it in the courier''s presence, take photos and contact us on the day of receipt. We will arrange repair or replacement at our expense.',
  'warranty', 20, true
),
(
  'Чи надаєте ви послуги з обслуговування та ремонту після закінчення гарантії?',
  'Так, після закінчення гарантійного терміну ми пропонуємо платне технічне обслуговування: підрегулювання фурнітури, оновлення покриття, ремонт пошкоджених елементів. Зверніться до нас — розрахуємо вартість робіт.',
  'Do you provide maintenance and repair services after the warranty expires?',
  'Yes, after the warranty period we offer paid maintenance services: hardware adjustment, refinishing and repair of damaged parts. Contact us and we will provide a cost estimate.',
  'warranty', 30, true
),

-- ═══════════════════════════════════════════════════════════
-- PAYMENT
-- ═══════════════════════════════════════════════════════════
(
  'Які способи оплати ви приймаєте?',
  'Ми приймаєте оплату банківським переказом (на рахунок ФОП), готівкою при отриманні, а також онлайн-оплату карткою. Для юридичних осіб виставляємо рахунок-фактуру.',
  'What payment methods do you accept?',
  'We accept bank transfer (to a sole proprietor account), cash on delivery and online card payment. For businesses we issue an invoice.',
  'payment', 10, true
),
(
  'Яка схема оплати для великих замовлень?',
  'Для великих проєктів ми працюємо за поетапною схемою: 50% передоплата при підписанні договору, 30% — після виготовлення та погодження виробу, 20% — після монтажу та здачі об''єкта. Умови можуть коригуватися індивідуально.',
  'What is the payment scheme for large orders?',
  'For large projects we work in stages: 50% deposit upon signing the contract, 30% after production and approval of the piece, 20% after installation and handover. Terms can be adjusted individually.',
  'payment', 20, true
),
(
  'Чи є у вас розстрочка або оплата частинами?',
  'Для великих замовлень ми можемо погодити індивідуальний графік платежів без переплати. Партнерська розстрочка через банківські програми також доступна — уточніть при оформленні замовлення.',
  'Do you offer installment payments?',
  'For large orders we can agree on an individual payment schedule with no extra cost. Bank installment programs are also available — ask when placing your order.',
  'payment', 30, true
),
(
  'Чи повертають кошти, якщо я відмовлюся від замовлення?',
  'Після підписання договору та внесення передоплати скасування замовлення можливе лише до початку виробництва — у такому разі ми повертаємо передоплату за вирахуванням витрат на матеріали та проєктування. Після початку виготовлення повернення коштів не передбачено.',
  'Can I get a refund if I cancel my order?',
  'After signing the contract and paying the deposit, cancellation is only possible before production begins — in that case we refund the deposit minus costs for materials and design. Once manufacturing has started, refunds are not possible.',
  'payment', 40, true
);
