(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const svgNS = 'http://www.w3.org/2000/svg';
  const familyNames = { foundations: 'Fondations', group: 'Groupes & couplages', rsa: 'RSA & factorisation', lattice: 'Réseaux', codes: 'Codes', encryption: 'Chiffrement & FHE', signature: 'Signatures', blind: 'Signatures aveugles', credential: 'Credentials', time: 'Temps', random: 'Aléatoire & quantique', hierarchy: 'Hiérarchies & comptage', circuits: 'Circuits', modelbase: 'Référence', modelgroup: 'Groupes', modeloracle: 'Oracles', modelcontext: 'Setup & composition' };
  const familyOrder = { assumption: ['foundations', 'group', 'rsa', 'lattice', 'codes'], property: ['encryption', 'signature', 'blind', 'credential'], complexity: ['time', 'random', 'hierarchy', 'circuits'], model: ['modelbase', 'modelgroup', 'modeloracle', 'modelcontext'] };
  const relationNames = { study: 'À étudier', variant: 'Variante', implication: 'Implication', inclusion: 'Inclusion démontrée', open: 'Question ouverte' };
  let atlas = null, selected = null, transform = { x: 55, y: 40, scale: 1 }, dragging = null;
  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const el = (tag, attrs = {}) => { const node = document.createElementNS(svgNS, tag); for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value); return node; };

  async function decrypt(password) {
    if (!crypto.subtle) throw new Error('Ce navigateur ne permet pas le déchiffrement sécurisé. Utilisez HTTPS.');
    const embedded = $('encrypted-atlas');
    if (!embedded) throw new Error('Carte chiffrée absente. Rechargez la page.');
    const payload = JSON.parse(embedded.textContent);
    if (payload.version !== 1 || payload.kdf !== 'PBKDF2-SHA256' || payload.cipher !== 'AES-256-GCM') throw new Error('Format de carte inconnu.');
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: b64(payload.salt), iterations: payload.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(payload.iv), tagLength: 128 }, key, b64(payload.ciphertext));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('Contenu invalide.');
    return data;
  }

  $('unlock-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button');
    const password = $('password').value;
    button.disabled = true; button.textContent = 'Ouverture…'; $('lock-error').textContent = '';
    try {
      atlas = await decrypt(password);
      $('password').value = '';
      $('lock').hidden = true; $('app').hidden = false;
      updateFamilies(); updateRelations();
      fit(); render();
    } catch (error) { $('lock-error').textContent = error.name === 'OperationError' ? 'Mot de passe incorrect.' : error.message; }
    finally { button.disabled = false; button.textContent = 'Ouvrir'; }
  });
  $('relock').addEventListener('click', () => { atlas = null; selected = null; $('graph').replaceChildren(); $('detail').replaceChildren(); $('app').hidden = true; $('lock').hidden = false; $('password').focus(); });
  $('view').addEventListener('change', () => { selected = null; $('search').value = ''; $('detail').innerHTML = '<p class="empty">Choisissez un nœud pour ouvrir sa fiche.</p>'; updateFamilies(); updateRelations(); fit(); render(); });
  for (const id of ['search', 'family', 'relation']) $(id).addEventListener(id === 'search' ? 'input' : 'change', () => { if (id !== 'relation') fit(); render(); });

  function updateFamilies() {
    $('family').replaceChildren(new Option('Toutes les familles', 'all'));
    for (const family of familyOrder[$('view').value]) {
      if (!atlas.nodes.some((node) => node.family === family)) continue;
      $('family').add(new Option(familyNames[family], family));
    }
  }

  function updateRelations() {
    $('relation').replaceChildren(new Option('Toutes les liaisons', 'all'));
    const types = $('view').value === 'complexity' ? ['inclusion', 'open', 'study'] : $('view').value === 'model' ? ['study', 'variant'] : ['study', 'variant', 'implication'];
    for (const type of types) $('relation').add(new Option(relationNames[type], type));
    $('search').placeholder = $('view').value === 'complexity' ? 'P, NP, BQP, TC⁰…' : $('view').value === 'model' ? 'GGM, ROM, UC…' : $('view').value === 'property' ? 'Blindness, CCA2, OMUF…' : 'LWE, DDH, SIS…';
    $('view-hint').textContent = $('view').value === 'complexity' ? 'Cliquez sur une classe pour voir sa définition, une idée à retenir, les pièges et les sources. Molette pour zoomer ; glisser pour déplacer la carte.' : $('view').value === 'model' ? 'Cliquez sur un modèle pour voir son rôle, ce qu’il faut vérifier dans une preuve, ses limites et les sources.' : 'Cliquez sur un nœud pour lire son jeu, les pièges de preuve et les sources. Molette pour zoomer ; glisser pour déplacer la carte.';
  }

  function visible() {
    const query = $('search').value.trim().toLowerCase();
    const family = $('family').value;
    const relation = $('relation').value;
    const nodes = atlas.nodes.filter((n) => (n.kind || 'assumption') === $('view').value && (family === 'all' || n.family === family) && (!query || [n.id, n.label, n.subtitle, n.definition, ...(n.tags || [])].join(' ').toLowerCase().includes(query)));
    const ids = new Set(nodes.map((n) => n.id));
    const edges = atlas.edges.filter((e) => ids.has(e.from) && ids.has(e.to) && (relation === 'all' || e.type === relation));
    return { nodes, edges };
  }

  function layout(nodes) {
    const families = familyOrder[$('view').value].filter((family) => nodes.some((node) => node.family === family));
    const positions = new Map();
    families.forEach((family, column) => {
      nodes.filter((n) => n.family === family).forEach((n, row) => positions.set(n.id, { x: column * 220 + 75, y: row * 84 + 90 }));
    });
    return positions;
  }

  function fit() {
    if (!atlas) return;
    const positions = [...layout(visible().nodes).values()];
    if (!positions.length) return;
    const width = Math.max(...positions.map((p) => p.x)) + 90;
    const height = Math.max(...positions.map((p) => p.y)) + 55;
    const canvas = $('graph');
    const scale = Math.min(1, (canvas.clientWidth - 40) / width, (canvas.clientHeight - 40) / height);
    transform = { x: Math.max(20, (canvas.clientWidth - width * scale) / 2), y: Math.max(20, (canvas.clientHeight - height * scale) / 2), scale };
  }

  function render() {
    if (!atlas) return;
    const { nodes, edges } = visible();
    const positions = layout(nodes);
    const svg = $('graph'); svg.replaceChildren();
    const viewport = el('g', { transform: `translate(${transform.x} ${transform.y}) scale(${transform.scale})` });
    const ids = new Set(nodes.map((n) => n.id));
    for (const edge of edges) {
      const a = positions.get(edge.from), b = positions.get(edge.to);
      if (!a || !b) continue;
      const line = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: `edge ${edge.type}${selected && edge.from !== selected && edge.to !== selected ? ' dim' : ''}` });
      const title = el('title'); title.textContent = `${edge.from} → ${edge.to}: ${relationNames[edge.type]}. ${edge.note || ''}`; line.append(title); viewport.append(line);
    }
    for (const node of nodes) {
      const p = positions.get(node.id);
      const connected = !selected || selected === node.id || edges.some((e) => (e.from === selected && e.to === node.id) || (e.to === selected && e.from === node.id));
      const group = el('g', { class: `node ${node.family}${connected ? '' : ' dim'}${selected === node.id ? ' active' : ''}`, transform: `translate(${p.x - 70} ${p.y - 25})`, tabindex: '0', role: 'button', 'aria-label': `Ouvrir ${node.label}` });
      group.append(el('rect', { width: 140, height: 50 }));
      const label = el('text', { x: 70, y: 31, 'text-anchor': 'middle' }); label.textContent = node.label; group.append(label);
      group.addEventListener('click', () => select(node.id));
      group.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(node.id); } });
      viewport.append(group);
    }
    svg.append(viewport);
    const view = $('view').value;
    $('stats').textContent = `${nodes.length} ${view === 'property' ? 'propriétés' : view === 'complexity' ? 'classes' : view === 'model' ? 'modèles' : 'hypothèses'} · ${edges.length} liaisons visibles`;
    $('notice').textContent = view === 'model' ? 'Ces fiches mélangent volontairement plusieurs axes : restrictions sur les groupes, oracle idéalisé, setup et cadre de composition. Une liaison indique un sujet à comparer, pas une implication automatique entre preuves.' : view === 'complexity' ? 'Une inclusion A ⊆ B signifie que tout problème de A est aussi dans B ; elle ne dit pas si A = B. ETH est une hypothèse de temps pour SAT, pas une classe. #P contient des fonctions de comptage, contrairement aux autres classes de décision affichées.' : view === 'property' ? 'Ces propriétés sont des objectifs définis par des jeux de sécurité. Leur relation ne prouve rien pour une construction particulière : vérifier le modèle, les oracles, les corruptions et les informations révélées.' : 'Carte de départ, non exhaustive. Une liaison « à étudier » ou « variante » ne signifie pas une réduction de sécurité. Vérifier systématiquement les paramètres, le modèle et le sens de la réduction dans la source.';
    $('legend-assumption').hidden = $('view').value !== 'assumption';
    $('legend-property').hidden = $('view').value !== 'property';
    $('legend-complexity').hidden = $('view').value !== 'complexity';
    $('legend-model').hidden = $('view').value !== 'model';
    if (selected && !ids.has(selected)) { selected = null; $('detail').innerHTML = '<p class="empty">Choisissez un nœud pour ouvrir sa fiche.</p>'; }
  }

  function select(id) {
    selected = id; render();
    const node = atlas.nodes.find((n) => n.id === id);
    if (!node) return;
    const related = atlas.edges.filter((e) => e.from === id || e.to === id);
    const sources = (node.sources || []).map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)}</a></li>`).join('');
    const links = related.map((e) => { const other = e.from === id ? e.to : e.from; return `<div class="relation"><span class="kind">${esc(relationNames[e.type])}</span> · <button type="button" data-node="${esc(other)}">${esc(other)}</button><br>${esc(e.note || '')}</div>`; }).join('');
    const kind = node.kind || 'assumption';
    $('detail').innerHTML = `<span class="tag">${esc(familyNames[node.family] || node.family)}</span><h2>${esc(node.label)}</h2><p class="caption">${esc(node.subtitle || '')}</p><h3>${kind === 'complexity' || kind === 'model' ? 'Définition' : 'Définition / jeu'}</h3><p>${esc(node.definition)}</p><h3>${kind === 'complexity' ? 'À retenir' : 'À vérifier dans une preuve'}</h3><p>${esc(node.proof)}</p><h3>Piège courant</h3><p>${esc(node.pitfall)}</p><h3>Liaisons</h3>${links || '<p class="caption">Aucune liaison pour cette vue.</p>'}<h3>Sources de départ</h3><ul>${sources}</ul>`;
    $('detail').querySelectorAll('[data-node]').forEach((button) => button.addEventListener('click', () => { const target = atlas.nodes.find((item) => item.id === button.dataset.node); if (!target) return; $('view').value = target.kind || 'assumption'; updateFamilies(); updateRelations(); $('family').value = 'all'; $('search').value = ''; fit(); select(button.dataset.node); }));
  }

  const canvas = $('graph');
  canvas.addEventListener('pointerdown', (event) => { if (event.target.closest('.node')) return; dragging = { x: event.clientX, y: event.clientY, ox: transform.x, oy: transform.y }; canvas.setPointerCapture(event.pointerId); });
  canvas.addEventListener('pointermove', (event) => { if (!dragging) return; transform.x = dragging.ox + event.clientX - dragging.x; transform.y = dragging.oy + event.clientY - dragging.y; render(); });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('pointercancel', () => { dragging = null; });
  canvas.addEventListener('wheel', (event) => { event.preventDefault(); transform.scale = Math.max(.45, Math.min(2.5, transform.scale * (event.deltaY < 0 ? 1.12 : .89))); render(); }, { passive: false });
  $('zoom-in').addEventListener('click', () => { transform.scale = Math.min(2.5, transform.scale * 1.2); render(); });
  $('zoom-out').addEventListener('click', () => { transform.scale = Math.max(.45, transform.scale / 1.2); render(); });
  $('zoom-reset').addEventListener('click', () => { fit(); render(); });
})();
