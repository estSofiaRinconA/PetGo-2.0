/* PetGo 2.0 - Panel global. No registra seguimiento ni lee credenciales. */
(() => {
  'use strict';
  if (window.__petgoAccessibilityLoaded) return;
  window.__petgoAccessibilityLoaded = true;

  const STORE = 'petgo_accessibility_v1';
  const NOTICE = 'petgo_cookie_notice_v1';
  const safeGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const safeSet = (key, val) => { try { localStorage.setItem(key, val); } catch { /* Storage can be disabled. */ } };
  let state = { contrast: false, scale: 1 };
  try {
    const stored = JSON.parse(safeGet(STORE) || '{}');
    state.contrast = stored.contrast === true;
    state.scale = [1, 1.15, 1.3, 1.5].includes(stored.scale) ? stored.scale : 1;
  } catch { /* Use defaults. */ }
  const savedFontSizes = new WeakMap();
  const textTags = 'p, a, span, label, li, dt, dd, td, th, button, input, select, textarea, h1, h2, h3, h4, h5, h6, small, strong, em, summary, figcaption, blockquote';

  function applyTextScale() {
    // Scales text only, preserving each element's original font size and hierarchy.
    const elements = document.querySelectorAll(textTags);
    elements.forEach(el => {
      if (el.closest('#pg-access-panel, #pg-access-trigger, #pg-cookie-banner')) return;
      if (!savedFontSizes.has(el)) {
        savedFontSizes.set(el, { value: el.style.getPropertyValue('font-size'), priority: el.style.getPropertyPriority('font-size'), pixels: parseFloat(getComputedStyle(el).fontSize) });
      }
      const original = savedFontSizes.get(el);
      if (state.scale === 1) {
        if (original.value) el.style.setProperty('font-size', original.value, original.priority);
        else el.style.removeProperty('font-size');
      } else if (Number.isFinite(original.pixels)) {
        el.style.setProperty('font-size', `${Math.round(original.pixels * state.scale * 10) / 10}px`, 'important');
      }
    });
  }
  function applySettings() {
    document.documentElement.classList.toggle('pg-high-contrast', state.contrast);
    applyTextScale();
    safeSet(STORE, JSON.stringify(state));
  }
  function make(tag, attrs = {}, content = '') {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => element.setAttribute(k, String(v)));
    if (content) element.textContent = content;
    return element;
  }
  function init() {
    if (!document.body) return;
    const trigger = make('button', { id: 'pg-access-trigger', type: 'button', 'aria-controls': 'pg-access-panel', 'aria-expanded': 'false' }, '♿ Accesibilidad');
    const panel = make('section', { id: 'pg-access-panel', role: 'region', 'aria-label': 'Opciones de accesibilidad', hidden: '' });
    const header = make('div');
    header.style.display = 'flex'; header.style.justifyContent = 'space-between'; header.style.alignItems = 'center';
    header.append(make('h2', {}, 'Accesibilidad'));
    const close = make('button', { type: 'button', 'aria-label': 'Cerrar opciones de accesibilidad' }, 'Cerrar');
    header.append(close); panel.append(header);
    panel.append(make('p', {}, 'Puedes mejorar la lectura de esta página con estos controles.'));
    const actions = make('div', { class: 'pg-actions' });
    const contrast = make('button', { type: 'button', 'aria-pressed': String(state.contrast) }, 'Alto contraste');
    const smaller = make('button', { type: 'button', 'aria-label': 'Disminuir tamaño de texto' }, 'A− Texto');
    const bigger = make('button', { type: 'button', 'aria-label': 'Aumentar tamaño de texto' }, 'A+ Texto');
    const size = make('span', { role: 'status', 'aria-live': 'polite', style: 'align-self:center;font-size:14px;' }, '100 %');
    const reset = make('button', { type: 'button' }, 'Restablecer');
    actions.append(contrast, smaller, size, bigger, reset);
    panel.append(actions);
    panel.append(make('p', {}, 'Lectura en voz alta: selecciona un texto o escucha el contenido principal.'));
    const voice = make('div', { class: 'pg-actions' });
    const read = make('button', { type: 'button' }, '▶ Leer');
    const pause = make('button', { type: 'button' }, '⏸ Pausar');
    const stop = make('button', { type: 'button' }, '■ Detener');
    voice.append(read, pause, stop); panel.append(voice);
    const feedback = make('p', { role: 'status', 'aria-live': 'polite' }, ''); panel.append(feedback);
    const banner = make('section', { id: 'pg-cookie-banner', role: 'region', 'aria-label': 'Aviso de cookies' });
    banner.append(make('strong', {}, 'Aviso de cookies 🍪'));
    banner.append(make('p', {}, 'PetGo utiliza cookies necesarias para iniciar sesión y mantenerla activa. Las preferencias de accesibilidad se guardan en este navegador. No añadimos cookies publicitarias con este aviso.'));
    const acknowledge = make('button', { type: 'button' }, 'Entendido'); banner.append(acknowledge);
    if (safeGet(NOTICE) === 'seen') banner.hidden = true;
    document.body.append(banner, trigger, panel);

    const scales = [1, 1.15, 1.3, 1.5];
    function update() { applySettings(); size.textContent = `${Math.round(state.scale * 100)} %`; contrast.setAttribute('aria-pressed', String(state.contrast)); smaller.disabled = state.scale === 1; bigger.disabled = state.scale === 1.5; }
    function openPanel(value) {
      panel.hidden = !value; trigger.setAttribute('aria-expanded', String(value));
      if (value) close.focus(); else trigger.focus();
    }
    trigger.addEventListener('click', () => openPanel(panel.hidden));
    close.addEventListener('click', () => openPanel(false));
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') openPanel(false); });
    contrast.addEventListener('click', () => { state.contrast = !state.contrast; update(); });
    smaller.addEventListener('click', () => { state.scale = scales[Math.max(0, scales.indexOf(state.scale) - 1)]; update(); });
    bigger.addEventListener('click', () => { state.scale = scales[Math.min(scales.length - 1, scales.indexOf(state.scale) + 1)]; update(); });
    reset.addEventListener('click', () => { state = { contrast: false, scale: 1 }; update(); });
    acknowledge.addEventListener('click', () => { safeSet(NOTICE, 'seen'); banner.hidden = true; });

    const speechAvailable = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    if (!speechAvailable) {
      [read, pause, stop].forEach(b => { b.disabled = true; });
      feedback.textContent = 'Tu navegador no admite lectura en voz alta.';
    } else {
      const synth = window.speechSynthesis;
      let parts = []; let position = 0; let active = false;
      function speakNext() {
        if (!active || position >= parts.length) { active = false; return; }
        const utterance = new SpeechSynthesisUtterance(parts[position++]);
        utterance.lang = 'es-CO'; utterance.rate = 0.95;
        const spanishVoice = synth.getVoices().find(v => /^es(-|_)/i.test(v.lang));
        if (spanishVoice) utterance.voice = spanishVoice;
        utterance.onend = speakNext;
        utterance.onerror = () => { active = false; feedback.textContent = 'No se pudo continuar la lectura.'; };
        synth.speak(utterance);
      }
      read.addEventListener('click', () => {
        synth.cancel(); active = false;
        let text = String(window.getSelection()?.toString() || '').trim();
        if (!text) {
          const target = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
          const copy = target.cloneNode(true);
          copy.querySelectorAll('script, style, nav, footer, button, input, textarea, select, [hidden], [aria-hidden="true"], #pg-access-panel, #pg-cookie-banner, #pg-access-trigger').forEach(el => el.remove());
          text = copy.textContent || '';
        }
        text = text.replace(/\s+/g, ' ').trim().slice(0, 24000);
        if (!text) { feedback.textContent = 'No hay texto disponible para leer.'; return; }
        parts = text.match(/.{1,180}(?:\s|$)/g) || [text]; position = 0; active = true;
        feedback.textContent = 'Leyendo el texto en voz alta.';
        speakNext();
      });
      pause.addEventListener('click', () => {
        if (synth.paused) { synth.resume(); feedback.textContent = 'Lectura reanudada.'; }
        else if (synth.speaking) { synth.pause(); feedback.textContent = 'Lectura pausada.'; }
      });
      stop.addEventListener('click', () => { active = false; synth.cancel(); feedback.textContent = 'Lectura detenida.'; });
      window.addEventListener('pagehide', () => { active = false; synth.cancel(); });
    }
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
