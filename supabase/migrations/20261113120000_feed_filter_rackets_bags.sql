-- RP-91: feeds that bring padel rackets and bags (Padel Market). Each item is matched
-- within its own kind, so a bag never ends up on a racket's page.
-- Its own migration: a new enum value cannot be used in the transaction that adds it.
alter type public.feed_filter add value if not exists 'padel_rackets_bags';
