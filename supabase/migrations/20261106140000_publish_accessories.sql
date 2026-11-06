-- RP-78: the accessories from bol (RP-77) came in as drafts until their pages existed.
-- Applied on 6 Nov after the merge of #39; new ones are published right away.
update public.products
set status = 'published'
where category_key = 'accessories' and status = 'draft' and not is_sample;
