-- RP-93: PadelXpert details, after the first migration was merged.
-- Program 1884003961 is the apid in the feed URL; the tracking link's a=1884003964 is the ad.
-- Shipping (from the shop, 21 nov): free from € 79, otherwise € 3,94; delivery 2–3 working days.
update public.shops
set network_advertiser_id = '1884003961',
    free_shipping_from = 79.00,
    shipping_info = 'Gratis verzending vanaf € 79, anders € 3,94. Levertijd 2–3 werkdagen.'
where slug = 'padelxpert';
