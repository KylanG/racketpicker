-- RP-56: logos for Joma, Lok, Prince, Varlion, StarVie, Tecnifibre and Softee (files in public/brands/).
update public.brands set logo_path = 'brands/' || slug || '.svg'
where slug in ('joma', 'lok', 'prince', 'varlion', 'starvie', 'tecnifibre', 'softee');
