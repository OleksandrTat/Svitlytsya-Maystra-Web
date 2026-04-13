-- Drop tables that have no references in application code.
-- Verified: no .from() queries exist for any of these tables.
-- All have CASCADE to remove any dependent constraints.

-- order_items: product line items per order (superseded by deal/service_type approach)
DROP TABLE IF EXISTS public.order_items CASCADE;

-- order_photos: progress photos per order stage (no admin UI references)
DROP TABLE IF EXISTS public.order_photos CASCADE;

-- order_documents: file attachments per order (no admin UI references)
DROP TABLE IF EXISTS public.order_documents CASCADE;

-- order_calculations: stored formula calculation results per order (no queries)
DROP TABLE IF EXISTS public.order_calculations CASCADE;

-- product_configurations: product configurator presets (no queries, no admin UI)
DROP TABLE IF EXISTS public.product_configurations CASCADE;
