-- RP-93: Adtraction as its own affiliate network (CSV product feeds, like Awin and Daisycon).
-- Separate migration: a new enum value cannot be used in the transaction that adds it.
alter type public.affiliate_network add value if not exists 'adtraction';
