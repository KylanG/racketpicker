-- RP-56: logos for Dunlop, Drop Shot, Oxdog and Black Crown (files in public/brands/).
update public.brands set logo_path = 'brands/dunlop.svg' where slug = 'dunlop';
update public.brands set logo_path = 'brands/drop-shot.svg' where slug = 'drop-shot';
update public.brands set logo_path = 'brands/oxdog.svg' where slug = 'oxdog';
update public.brands set logo_path = 'brands/black-crown.svg' where slug = 'black-crown';
