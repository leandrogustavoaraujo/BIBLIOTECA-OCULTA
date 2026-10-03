(() => {
  'use strict';
  const books = window.LIBRARY_CATALOG || [];
  const $ = id => document.getElementById(id);
  const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let favorites;
  try { const value = JSON.parse(localStorage.getItem('biblioteca-favoritos') || '[]'); favorites = new Set(Array.isArray(value) ? value.filter(id => books.some(b => b.id === id)) : []); } catch { favorites = new Set(); }
  let view = 'all', limit = 30, timer;
  const categories = [...new Set(books.flatMap(b => b.categories))].sort((a,b) => a.localeCompare(b,'es'));
  const labels = {'Alquimia':'Alquimia','Astrologia':'Astrología','Teosofia':'Teosofía','Numerologia':'Numerología','Profecias':'Profecías','Suenos':'Sueños','Registros akashicos':'Registros akáshicos','Brujeria':'Brujería','Reencarnacion':'Reencarnación','Telepatia':'Telepatía'};
  const label = s => labels[s] || s;
  const langList = [...new Set(books.map(b => b.language))].sort();
  $('total-stat').textContent = books.length;
  $('category-stat').textContent = categories.length;
  categories.forEach(c => $('category').add(new Option(label(c), c)));
  langList.forEach(l => $('language').add(new Option(l, l)));
  const popular = ['', 'Ocultismo', 'Alquimia', 'Tarot', 'Astrologia', 'Brujeria', 'Teosofia'].filter(c => !c || categories.includes(c));
  $('chips').innerHTML = popular.map(c => `<button class="chip${c === '' ? ' active' : ''}" data-category="${escape(c)}" aria-pressed="${c === ''}">${c ? escape(label(c)) : 'Todos'}</button>`).join('');
  const symbols = ['✧', '☽', '☉', '✦', '◇', '❋'];
  function render() {
    const q = normalize($('search').value.trim()), cat = $('category').value, lang = $('language').value;
    let result = books.filter(b => (!q || normalize(b.title + ' ' + b.author).includes(q)) && (!cat || b.categories.includes(cat)) && (!lang || b.language === lang) && (view !== 'favorites' || favorites.has(b.id)));
    const order = $('sort').value;
    result.sort((a,b) => {
      if (order === 'featured') {
        const rank = b => /kybal|dogma y ritual|gran arcano|simbolismo del tarot|ciencia de los magos/.test(normalize(b.title)) && b.language === 'Español' ? 0 : b.language === 'Español' && b.kind !== 'Artículo' ? 1 : b.language === 'Español' ? 2 : 3;
        const diff = rank(a) - rank(b); if (diff) return diff;
      }
      return a.title.localeCompare(b.title,'es') * (order === 'za' ? -1 : 1);
    });
    const shown = result.slice(0,limit);
    $('books').innerHTML = shown.map(b => `<article class="card"><button class="favorite${favorites.has(b.id) ? ' saved' : ''}" data-favorite="${b.id}" aria-label="${favorites.has(b.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}: ${escape(b.title)}" aria-pressed="${favorites.has(b.id)}">${favorites.has(b.id) ? '♥' : '♡'}</button><a class="cover theme-${b.theme}" href="${escape(b.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${escape(b.title)} en ${escape(b.source)} (nueva pestaña)">${b.cover ? `<img class="real-cover" src="${escape(b.cover)}" alt="${escape(b.title)} — portada o primera página" loading="lazy" decoding="async">` : ''}<span class="cover-category">${escape(label(b.categories[0]))}</span><span class="cover-title">${escape(b.title.replace(/\s*\((?:Inglés|Portugués|Francés|Artículo)\)/g,''))}</span><span class="cover-symbol" aria-hidden="true">${symbols[b.theme]}</span><span class="cover-author">${escape(b.author)}</span></a><h3 title="${escape(b.title)}">${escape(b.title)}</h3><p class="author" title="${escape(b.author)}">${escape(b.author)}</p><div class="card-meta"><span>${escape(b.language)}</span><a href="${escape(b.url)}" target="_blank" rel="noopener noreferrer">Ver en la fuente ↗</a></div></article>`).join('');
    $('result-count').textContent = `${result.length} ${result.length === 1 ? 'lectura' : 'lecturas'}`;
    $('page-count').textContent = result.length ? `Mostrando ${shown.length} de ${result.length} lecturas · libros y documentos` : '';
    $('empty').hidden = result.length > 0;
    $('load-more').hidden = shown.length >= result.length;
    $('favorite-count').textContent = favorites.size;
    $('catalog-title').textContent = view === 'favorites' ? 'Tus lecturas guardadas' : 'Elige tu próximo descubrimiento';
    document.querySelectorAll('.chip').forEach(el => { const active = el.dataset.category === cat; el.classList.toggle('active', active); el.setAttribute('aria-pressed',active); });
  }
  function reset() { $('search').value=''; $('category').value=''; $('language').value=''; $('sort').value='featured'; limit=30; render(); }
  function switchView(next) {
    view = next;
    $('library-view').hidden = next === 'sources'; $('sources-view').hidden = next !== 'sources';
    document.querySelectorAll('[data-view]').forEach(el => { el.classList.toggle('active',el.dataset.view===next); if(el.dataset.view===next) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
    document.querySelector('.breadcrumb').innerHTML = `Tu biblioteca <span>/</span> ${next === 'favorites' ? 'Mis favoritos' : next === 'sources' ? 'Fuentes' : 'Explorar'}`;
    if(next !== 'sources') { reset(); document.querySelector('.hero').hidden=next==='favorites'; }
    window.scrollTo({top:0,behavior:'smooth'});
  }
  $('books').addEventListener('click',e => {
    const button = e.target.closest('[data-favorite]'); if(!button) return;
    const id = button.dataset.favorite, removed = favorites.has(id);
    removed ? favorites.delete(id) : favorites.add(id);
    let message = removed ? 'Lectura eliminada de tus favoritos' : 'Lectura guardada en tus favoritos';
    try { localStorage.setItem('biblioteca-favoritos', JSON.stringify([...favorites])); } catch { message += ' · solo en esta sesión'; }
    render(); $('toast').textContent=message; $('toast').classList.add('show'); clearTimeout(timer); timer=setTimeout(() => $('toast').classList.remove('show'),2300);
    const restored = document.querySelector(`[data-favorite="${id}"]`); if(restored) restored.focus({preventScroll:true});
  });
  $('chips').addEventListener('click',e => { const button=e.target.closest('[data-category]'); if(button){$('category').value=button.dataset.category;limit=30;render();} });
  ['category','language','sort'].forEach(id => $(id).addEventListener('change',() => {limit=30;render();}));
  $('search').addEventListener('input',() => { if(view==='sources') { const query=$('search').value;switchView('all');$('search').value=query; } limit=30;render(); });
  $('load-more').addEventListener('click',() => {limit+=30;render();});
  $('reset').addEventListener('click',reset);
  $('empty-reset').addEventListener('click',() => switchView('all'));
  document.querySelectorAll('[data-view]').forEach(el=>el.addEventListener('click',()=>switchView(el.dataset.view)));
  $('footer-sources').addEventListener('click',()=>switchView('sources'));
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();$('search').focus();}});
  render();
})();
