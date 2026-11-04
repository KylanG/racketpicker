(() => {
  if (window.rpFavs) return;
  const KEY = 'rp-favs';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const idOf = it => (it.brand + '-' + it.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const emit = () => window.dispatchEvent(new Event('rp-favs'));
  window.rpFavs = {
    idOf,
    all: read,
    count: () => read().length,
    has: it => read().some(x => x.id === idOf(it)),
    toggle: it => {
      const id = idOf(it), list = read(), i = list.findIndex(x => x.id === id);
      if (i >= 0) list.splice(i, 1);
      else list.unshift({ id, name: it.name, brand: it.brand, sport: it.sport, price: it.price, shops: it.shops });
      localStorage.setItem(KEY, JSON.stringify(list)); emit();
    },
    remove: id => { localStorage.setItem(KEY, JSON.stringify(read().filter(x => x.id !== id))); emit(); },
    clear: () => { localStorage.setItem(KEY, '[]'); emit(); }
  };
  window.addEventListener('storage', e => { if (e.key === KEY) emit(); });
  emit();
})();
