-- RP-84: hero images for the three launch articles (files in public/blog/).
update public.articles set
  hero_image = '/blog/padelracket-kopen-waar-let-je-op.webp',
  hero_image_alt = 'Drie padelrackets tegen het hek van een padelbaan, met ballen en een sporttas'
where market_code = 'nl' and slug = 'padelracket-kopen-waar-let-je-op';

update public.articles set
  hero_image = '/blog/welk-padelracket-past-bij-jou.webp',
  hero_image_alt = 'Speelster bekijkt een padelracket naast een rek met rackets op de baan'
where market_code = 'nl' and slug = 'welk-padelracket-past-bij-jou';

update public.articles set
  hero_image = '/blog/beste-padelracket-voor-beginners.webp',
  hero_image_alt = 'Twee spelers wachten met hun padelracket op de bal'
where market_code = 'nl' and slug = 'beste-padelracket-voor-beginners';
