-- RP-72: bol.com as its own affiliate network (Marketing Catalog API, not a CSV feed).
-- Separate migration: a new enum value cannot be used in the transaction that adds it.
alter type public.affiliate_network add value if not exists 'bol';
