-- Catalog only. Customer accounts come from Supabase Auth.
-- Safe to re-run: existing slugs are left as they are.

insert into public.categories (id, name, slug, description, sort_order) values
  ('11111111-1111-4111-8111-111111111111', 'Seating', 'seating', 'Chairs, a stool, and a daybed.', 1),
  ('22222222-2222-4222-8222-222222222222', 'Tables', 'tables', 'Side tables and tables for a meal.', 2),
  ('33333333-3333-4333-8333-333333333333', 'Textiles', 'textiles', 'Wool, linen, and bedding.', 3),
  ('44444444-4444-4444-8444-444444444444', 'Lighting', 'lighting', 'Lamps for reading and for a room.', 4),
  ('55555555-5555-4555-8555-555555555555', 'Objects', 'objects', 'Ceramics for the table.', 5)
on conflict (slug) do nothing;

insert into public.products (
  id, category_id, name, slug, summary, description, price_cents, compare_at_cents,
  sku, stock, material, dimensions, lead_time, featured, published,
  image_url, image_alt, hover_image_url, created_at
) values
(
  'a1000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'Linden lounge chair', 'linden-lounge-chair',
  'A low chair in ash, with a wool seat that unzips.',
  'Linden sits low, with a solid ash frame and a removable wool cushion. The back is slightly open so the chair does not close off a small room. The cushion cover unzips for cleaning. Built to order in the Portland shop.',
  148000, null, 'HD-LIN-01', 4, 'Ash, wool', 'W 31 in · D 34 in · H 28 in · Seat 15 in',
  'Made to order, 3–5 weeks', true, true,
  'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=1600&q=80',
  'Low lounge chair with a pale wood frame in a bright room',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1600&q=80',
  '2026-08-02T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  'Ash daybed', 'ash-daybed',
  'A daybed with a slatted base and a firm wool mattress.',
  'The daybed is a single bed that reads as a sofa. The ash frame is joined with exposed tenons, and the slatted base takes a firm wool mattress rather than a deep cushion. It fits a room that has to work during the day.',
  214000, null, 'HD-ASH-01', 2, 'Ash, wool', 'W 80 in · D 36 in · H 30 in',
  'Made to order, 4–6 weeks', false, true,
  'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80',
  'Long upholstered seat in a living room',
  'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1600&q=80',
  '2026-08-04T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000003',
  '11111111-1111-4111-8111-111111111111',
  'Oak stool', 'oak-stool',
  'A three-leg stool for a counter or a bench.',
  'Turned from white oak, with a saddle seat and three legs that splay just enough to stay put on an uneven floor. Use it at a counter, or pull two up to the nesting tables. The finish is hardwax oil, which can be renewed at home.',
  32000, null, 'HD-STL-01', 8, 'White oak', 'W 15 in · D 13 in · H 24 in',
  'In stock, ships in 3 business days', false, true,
  'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1600&q=80',
  'Simple wooden stool against a light wall',
  null, '2026-08-06T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000004',
  '22222222-2222-4222-8222-222222222222',
  'Cane side table', 'cane-side-table',
  'A small round table with a cane shelf.',
  'The top is a solid oak disc. Below it, a cane shelf holds a book or a lamp cord so the top stays clear. The legs unscrew for shipping and go back together with a hex key, which is included.',
  54000, null, 'HD-CNE-01', 6, 'White oak, cane', 'Dia 18 in · H 20 in',
  'In stock, ships in 5 business days', false, true,
  'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=1600&q=80',
  'Round wooden side table beside a sofa',
  null, '2026-08-08T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000005',
  '22222222-2222-4222-8222-222222222222',
  'Refectory table', 'refectory-table',
  'A long oak table for six, with a thicker center board.',
  'Three white-oak boards, the center one thicker, on a trestle base that leaves room for chairs at the ends. The top is finished with hardwax oil. Seats six without a leaf. Large pieces ship freight; we confirm the date after the order.',
  286000, null, 'HD-REF-01', 2, 'White oak', 'L 84 in · W 36 in · H 30 in',
  'Made to order, 5–7 weeks, freight delivery', true, true,
  'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?auto=format&fit=crop&w=1600&q=80',
  'Long wooden dining table set with chairs',
  null, '2026-08-12T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000006',
  '22222222-2222-4222-8222-222222222222',
  'Nesting tables', 'nesting-tables',
  'Two oak tables that slide together.',
  'A pair of low tables in white oak. The smaller one slides under the larger one, and both are light enough to move when you need the floor. Edges are eased by hand so they are not sharp against a shin.',
  89000, null, 'HD-NST-01', 5, 'White oak', 'Large W 26 in · D 18 in · H 16 in',
  'Made to order, 3–4 weeks', false, true,
  'https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1600&q=80',
  'Low wooden tables in a living room',
  null, '2026-08-14T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000007',
  '33333333-3333-4333-8333-333333333333',
  'Wool throw, olive', 'wool-throw-olive',
  'A heavy wool throw with a linen bind.',
  'Woven in a two-tone olive wool, with a linen binding at the ends. It is heavy enough for a chair in winter and washes cold, laid flat to dry. 50 by 70 inches.',
  18000, 22000, 'HD-THR-01', 14, 'Wool, linen', '50 in × 70 in',
  'In stock, ships in 3 business days', true, true,
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=80',
  'Living room with a draped textile on a sofa',
  null, '2026-08-18T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000008',
  '33333333-3333-4333-8333-333333333333',
  'Stone linen duvet', 'stone-linen-duvet',
  'Washed linen duvet cover in a stone color.',
  'Stone-colored linen, garment washed so it is soft on the first night. Button closure, interior ties at the corners. Queen size. The color sits between warm gray and oat, and it hides everyday creasing.',
  26000, null, 'HD-DVT-01', 10, 'Washed linen', 'Queen, 88 in × 92 in',
  'In stock, ships in 3 business days', false, true,
  'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=80',
  'A made bed with neutral linen bedding',
  'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1600&q=80',
  '2026-08-20T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000009',
  '44444444-4444-4444-8444-444444444444',
  'Brass task lamp', 'brass-task-lamp',
  'An adjustable brass lamp with a linen shade.',
  'A weighted brass base, an arm that holds its position, and a linen shade lined so the bulb does not glare. Takes an E26 LED, 6 watts is enough. The brass is unlacquered and will dull where hands touch it.',
  42000, null, 'HD-LMP-01', 7, 'Brass, linen', 'H 18 in, adjustable · Shade dia 8 in',
  'In stock, ships in 3 business days', true, true,
  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1600&q=80',
  'Brass task lamp on a wooden desk',
  'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=1600&q=80',
  '2026-08-22T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000010',
  '44444444-4444-4444-8444-444444444444',
  'Paper pendant', 'paper-pendant',
  'A rice-paper shade on a short brass canopy.',
  'A soft oval shade in rice paper, hung from a short brass canopy. It throws a wide, low light and suits a table better than a hard downlight. Cord is 8 feet, cloth covered. Currently waiting on the next shade delivery.',
  24000, null, 'HD-PND-01', 0, 'Rice paper, brass', 'Shade W 16 in · H 9 in · Cord 8 ft',
  'Next batch in 4 weeks', false, true,
  'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=1600&q=80',
  'Paper pendant lamp hanging in a pale room',
  null, '2026-08-24T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000011',
  '55555555-5555-4555-8555-555555555555',
  'Stoneware pourer', 'stoneware-pourer',
  'A small pourer with a pulled lip.',
  'Thrown in the shop upstairs, in a speckled stoneware clay with a clear glaze that pools at the foot. The lip is pulled, not attached, so it pours without dripping down the belly. About 12 ounces. Dishwasher safe.',
  6800, null, 'HD-POR-01', 16, 'Stoneware', 'H 4.5 in · 12 oz',
  'In stock, ships in 3 business days', false, true,
  'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1600&q=80',
  'Handmade ceramic pourer on a wooden surface',
  null, '2026-08-28T15:00:00Z'
),
(
  'a1000000-0000-4000-8000-000000000012',
  '55555555-5555-4555-8555-555555555555',
  'Basin vase', 'basin-vase',
  'A wide, low vase for branches.',
  'A wide basin rather than a tall vase, so branches sit in a fan instead of a spike. The clay is the same speckled stoneware as the pourer, left unglazed on the outside and glassy inside so it holds water.',
  9200, null, 'HD-VAS-01', 11, 'Stoneware', 'Dia 8 in · H 5 in',
  'In stock, ships in 3 business days', false, true,
  'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=1600&q=80',
  'Low ceramic vessels grouped on a table',
  'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1600&q=80',
  '2026-09-02T15:00:00Z'
)
on conflict (slug) do nothing;
