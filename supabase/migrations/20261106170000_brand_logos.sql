-- RP-56: brand logos as one-colour SVGs in public/brands/; brands.logo_path is the public path.
update public.brands set logo_path = 'brands/adidas.svg' where slug = 'adidas';
update public.brands set logo_path = 'brands/puma.svg' where slug = 'puma';
update public.brands set logo_path = 'brands/wilson.svg' where slug = 'wilson';
update public.brands set logo_path = 'brands/bullpadel.svg' where slug = 'bullpadel';
update public.brands set logo_path = 'brands/siux.svg' where slug = 'siux';
update public.brands set logo_path = 'brands/head.svg' where slug = 'head';
update public.brands set logo_path = 'brands/babolat.svg' where slug = 'babolat';
update public.brands set logo_path = 'brands/nox.svg' where slug = 'nox';
