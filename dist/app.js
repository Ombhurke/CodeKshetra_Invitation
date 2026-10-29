(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const STORE = 'codekshetra.invitation.v1';
  const invitedGuests = ['Fr. Paul Chandrankunnel', 'Fr. Siju Jose', 'Fr. Stanley Wilson', 'Dr. Manoj Bramhe', 'Dr. Shabana Pathan', 'Dr. Sushant Satputaley', 'Dr. Harish Rajurkar', 'Dr. Jyoti Rothe', 'Dr. Abhay Hirekhan', 'Dr. Vikas Bhowate', 'Dr. Amit Bhende', 'Dr. Manish Gudadhe', 'Dr. Abhishek Pathak', 'Dr. Pravin Sen', 'Dr. Shriraghavan Madhubushi', 'Dr. Prashant Maheshwary', 'Dr. Homeshwar Nagpure'].map((name, i) => ({ id: `invited-${i + 1}`, name, role: '' }));
  const DEFAULT_MESSAGE = 'Your esteemed presence would be an honour and a great source of encouragement for all the participants.';
  const defaults = () => ({
    guestId: invitedGuests[0].id,
    guests: invitedGuests.map(g => ({ ...g })),
    event: { date: '31st October 2026', time: '1:15 PM', venue: '2nd floor auditorium, B Block, St. Vincent Pallotti College of Engineering & Technology, Nagpur', message: DEFAULT_MESSAGE }, signatures: {},
  });
  let storageAvailable = true;
  function readStore() {
    const fallback = defaults();
    try {
      const raw = localStorage.getItem(STORE);
      if (!raw) return fallback;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.guests) || !data.guests.length) return fallback;
      data.guests = data.guests.filter(g => g && typeof g.id === 'string' && typeof g.name === 'string' && typeof g.role === 'string');
      if (!data.guests.length) return fallback;
      data.event = Object.fromEntries(Object.keys(fallback.event).map(k => [k, typeof data.event?.[k] === 'string' ? data.event[k] : fallback.event[k]]));
      for (const key of ['date', 'time', 'venue']) if (!data.event[key]) data.event[key] = fallback.event[key];
      if (data.event.message.startsWith('Your presence would make this occasion')) data.event.message = DEFAULT_MESSAGE;
      for (const guest of invitedGuests) {
        if (!data.guests.some(g => g.id === guest.id || g.name.trim().toLowerCase() === guest.name.toLowerCase())) data.guests.push({ ...guest });
      }
      data.signatures = data.signatures && typeof data.signatures === 'object' && !Array.isArray(data.signatures) ? data.signatures : {};
      if (!data.guests.some(g => g.id === data.guestId)) data.guestId = data.guests[0].id;
      return data;
    } catch { storageAvailable = false; return fallback; }
  }
  let data = readStore();
  let strokes = [];
  let typed = '';
  let activeStroke = null;
  let activePointer = null;
  let saved = false;
  let dirty = false;
  const drafts = new Map();
  const gate = $('.gate');
  const invitation = $('#invitation');
  const dialog = $('#organizer-dialog');
  const canvas = $('#signature-canvas');
  const context = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const timers = [];
  let opening = false;
  let opened = false;
  let toastTimer;
  let canvasWidth = 1;
  let canvasHeight = 1;

  function currentGuest() { return data.guests.find(g => g.id === data.guestId) || data.guests[0]; }
  function safeName(value) { return value.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').slice(0, 65) || 'guest'; }
  function persist() {
    try {
      localStorage.setItem(STORE, JSON.stringify(data));
      storageAvailable = true;
      return true;
    } catch { storageAvailable = false; return false; }
  }
  function toast(message) {
    const el = $('.toast');
    el.textContent = message; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 4000);
  }
  function setSignatureStatus(message, isError = false) {
    const el = $('#signature-status');
    el.textContent = message; el.classList.toggle('error', isError);
  }
  function personalize() {
    const guest = currentGuest();
    $$('[data-guest-name]').forEach(el => { el.textContent = guest.name; });
    $$('[data-guest-role]').forEach(el => { el.textContent = guest.role; });
    $$('[data-guest-short]').forEach(el => { el.textContent = guest.id === 'welcome' && guest.name === 'Our distinguished guest' ? 'you' : guest.name; });
    $$('[data-event]').forEach(el => {
      const field = el.dataset.event;
      el.textContent = data.event[field] || (field === 'message' ? DEFAULT_MESSAGE : 'To be announced');
    });
    document.title = 'CODEKSHETRA 2026 — Your invitation';
    populateOpeningSelect();
  }

  // One controlled transition: cut, separate ribbon halves, unfold, reveal.
  function finishOpening() {
    $('#guest-setup').hidden = true;
    timers.forEach(clearTimeout); timers.length = 0;
    gate.hidden = true; gate.classList.remove('opening', 'departing');
    invitation.hidden = false; invitation.inert = false;
    opened = true; opening = false;
    $('#organizer-trigger').hidden = true;
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (location.hash !== '#invitation') history.replaceState(null, '', '#invitation');
    $('.skip-link').href = '#signature';
    $('.skip-link').textContent = 'Skip to signature board';
    invitation.focus({ preventScroll: true });
    requestAnimationFrame(() => { observeReveals(); resizeCanvas(); });
  }
  function openInvitation(instant = false) {
    if (opened) return;
    if (instant || reduced.matches) { finishOpening(); return; }
    if (opening) return;
    opening = true;
    $('#open-invitation').disabled = true;
    gate.classList.add('opening');
    timers.push(setTimeout(() => gate.classList.add('departing'), 1800));
    timers.push(setTimeout(finishOpening, 2400));
  }
  function replay() {
    timers.forEach(clearTimeout); timers.length = 0;
    opening = false; opened = false;
    $('#organizer-trigger').hidden = true;
    $('#guest-setup').hidden = true;
    invitation.hidden = true; invitation.inert = true;
    gate.hidden = false; gate.classList.remove('opening', 'departing');
    gate.inert = false;
    $('#open-invitation').disabled = false;
    $('.skip-link').href = '#open-invitation';
    $('.skip-link').textContent = 'Skip to invitation';
    $('.page-progress').style.transform = 'scaleX(0)';
    history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('#open-invitation').focus({ preventScroll: true });
    $$('.reveal').forEach(el => el.classList.remove('visible'));
  }
  $('#open-invitation').addEventListener('click', () => openInvitation());
  $('#skip-animation').addEventListener('click', () => openInvitation(true));
  $('#replay').addEventListener('click', replay);
  $('#prepare-invitation').addEventListener('click', () => {
    replay();
    if (!reduced.matches) gate.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)' });
  });
  function showGuestSetup() {
    replay(); gate.hidden = true; gate.inert = true;
    $('#guest-setup').hidden = false; $('#organizer-trigger').hidden = false;
    $('.skip-link').href = '#opening-guest-select'; $('.skip-link').textContent = 'Skip to guest selection';
    $('#opening-guest-select').focus({ preventScroll: true });
  }
  $('#change-guest').addEventListener('click', showGuestSetup);

  let observer;
  function observeReveals() {
    observer?.disconnect();
    if (reduced.matches || !('IntersectionObserver' in window)) {
      $$('.reveal').forEach(el => el.classList.add('visible')); return;
    }
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -12px 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
  }
  let scrollQueued = false;
  window.addEventListener('scroll', () => {
    if (!opened || scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      const total = document.documentElement.scrollHeight - innerHeight;
      $('.page-progress').style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`;
      scrollQueued = false;
    });
  }, { passive: true });
  reduced.addEventListener('change', () => { if (opening) finishOpening(); if (opened) observeReveals(); });

  // Settings use stable guest IDs; editing a name does not detach a signature.
  function populateSelect() {
    const select = $('#guest-select'); select.replaceChildren();
    data.guests.forEach(guest => {
      const option = document.createElement('option');
      option.value = guest.id; option.textContent = `${guest.name}${guest.role ? ' · ' + guest.role : ''}`;
      select.append(option);
    });
    const add = document.createElement('option'); add.value = '__new__'; add.textContent = '+ Add another guest'; select.append(add);
    select.value = data.guestId;
  }
  function populateOpeningSelect() {
    const select = $('#opening-guest-select');
    select.replaceChildren();
    data.guests.forEach(guest => {
      const option = document.createElement('option');
      option.value = guest.id; option.textContent = guest.name; select.append(option);
    });
    const add = document.createElement('option'); add.value = '__new__'; add.textContent = '+ Add a guest manually'; select.append(add);
    select.value = data.guestId;
  }
  $('#opening-guest-select').addEventListener('change', event => {
    const id = event.target.value;
    if (id === '__new__') {
      showSettings(); $('#guest-select').value = '__new__'; fillGuestFields();
      event.target.value = data.guestId; $('#guest-name').focus(); return;
    }
    saveDraft(); data.guestId = id; personalize(); loadGuestSignature();
    if (!persist()) toast('Guest selected for this visit. Browser storage is unavailable.');
  });
  $('#opening-edit').addEventListener('click', showSettings);
  function fillGuestFields() {
    const guest = data.guests.find(g => g.id === $('#guest-select').value);
    $('#guest-name').value = guest?.name || '';
    $('#guest-role').value = guest?.role || '';
  }
  function showSettings() {
    populateSelect(); fillGuestFields();
    ['date', 'time', 'venue', 'message'].forEach(key => { $(`#event-${key}`).value = data.event[key]; });
    $('#settings-status').textContent = '';
    dialog.showModal();
  }
  function cloneStrokes(items) { return items.map(stroke => stroke.map(p => ({ x: p.x, y: p.y }))); }
  function saveDraft() { drafts.set(data.guestId, { strokes: cloneStrokes(strokes), typed, saved, dirty }); }
  function applySettings(present) {
    const form = $('#organizer-form');
    if (!form.reportValidity()) return;
    const name = $('#guest-name').value.trim();
    if (!name) { $('#settings-status').textContent = 'Please enter a guest name.'; $('#guest-name').focus(); return; }
    saveDraft();
    let id = $('#guest-select').value;
    const role = $('#guest-role').value.trim();
    if (id === '__new__') {
      id = globalThis.crypto?.randomUUID?.() || `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      data.guests.push({ id, name, role });
    } else {
      const guest = data.guests.find(g => g.id === id); guest.name = name; guest.role = role;
    }
    data.guestId = id;
    ['date', 'time', 'venue', 'message'].forEach(key => { data.event[key] = $(`#event-${key}`).value.trim(); });
    const stored = persist();
    personalize(); loadGuestSignature(); dialog.close();
    if (present) replay();
    toast(stored ? (present ? 'Your guest’s invitation is ready.' : 'Invitation updated.') : 'Updated for this visit. Browser storage is unavailable.');
  }
  $('#organizer-trigger').addEventListener('click', showSettings);
  $('#close-organizer').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  $('#guest-select').addEventListener('change', () => { fillGuestFields(); if ($('#guest-select').value === '__new__') $('#guest-name').focus(); });
  $('#organizer-form').addEventListener('submit', event => { event.preventDefault(); applySettings(true); });
  $('#apply-settings').addEventListener('click', () => applySettings(false));
  $('#next-guest').addEventListener('click', () => { closeSignature(); showGuestSetup(); });

  // Normalized points survive resize/orientation changes without losing strokes.
  function hasSignature() { return strokes.length > 0 || typed.length > 0; }
  function updateSignatureControls() {
    $('.canvas-placeholder').hidden = hasSignature();
    $('#undo-signature').disabled = !hasSignature();
    $('#clear-signature').disabled = !hasSignature();
    $('#save-signature').disabled = !hasSignature() || (saved && !dirty);
    $('#saved-panel').hidden = !saved || dirty;
  }
  function markEdited() {
    dirty = true; saved = false;
    setSignatureStatus('Unsaved signature. Select Save when you’re ready.');
    updateSignatureControls();
  }
  function paintSignature(ctx, width, height, points, text, background = true) {
    ctx.clearRect(0, 0, width, height);
    if (background) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); }
    ctx.strokeStyle = '#202734'; ctx.fillStyle = '#202734';
    ctx.lineWidth = Math.max(1.8, width / 240); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (text) {
      let fontSize = Math.min(width * .085, height / 4);
      ctx.font = `italic ${fontSize}px Georgia, serif`;
      const textWidth = ctx.measureText(text).width;
      if (textWidth > width - 50) { fontSize *= (width - 50) / textWidth; ctx.font = `italic ${fontSize}px Georgia, serif`; }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, width / 2, height / 2);
    }
    for (const stroke of points) {
      if (!stroke.length) continue;
      if (stroke.length === 1) {
        ctx.beginPath(); ctx.arc(stroke[0].x * width, stroke[0].y * height, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill(); continue;
      }
      ctx.beginPath(); ctx.moveTo(stroke[0].x * width, stroke[0].y * height);
      for (let i = 1; i < stroke.length - 1; i++) {
        const p = stroke[i], n = stroke[i + 1];
        ctx.quadraticCurveTo(p.x * width, p.y * height, (p.x + n.x) * width / 2, (p.y + n.y) * height / 2);
      }
      const last = stroke[stroke.length - 1]; ctx.lineTo(last.x * width, last.y * height); ctx.stroke();
    }
  }
  function renderSignature() { paintSignature(context, canvasWidth, canvasHeight, strokes, typed); }
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    canvasWidth = rect.width; canvasHeight = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 3);
    canvas.width = Math.round(canvasWidth * ratio); canvas.height = Math.round(canvasHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0); renderSignature();
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  }
  let drawQueued = false;
  function requestDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => { renderSignature(); drawQueued = false; });
  }
  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || activePointer !== null) return;
    event.preventDefault();
    activePointer = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    activeStroke = [point(event)]; strokes.push(activeStroke);
    markEdited(); requestDraw();
  });
  canvas.addEventListener('pointermove', event => {
    if (event.pointerId !== activePointer || !activeStroke) return;
    event.preventDefault();
    const events = event.getCoalescedEvents?.() || [];
    (events.length ? events : [event]).forEach(e => activeStroke.push(point(e)));
    requestDraw();
  });
  function stopDrawing(event) {
    if (event.pointerId !== activePointer) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    activePointer = null; activeStroke = null; renderSignature();
  }
  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);
  canvas.addEventListener('lostpointercapture', () => { activePointer = null; activeStroke = null; });
  $('#undo-signature').addEventListener('click', () => {
    if (strokes.length) strokes.pop(); else typed = '';
    markEdited(); renderSignature();
    if (!hasSignature()) setSignatureStatus('Signature board cleared.');
  });
  $('#clear-signature').addEventListener('click', () => {
    strokes = []; typed = ''; activeStroke = null; activePointer = null;
    markEdited(); renderSignature(); setSignatureStatus('Board cleared. A previously saved copy is kept until you save a replacement.');
  });
  $('#type-signature').addEventListener('click', () => {
    $('#typed-signature-form').hidden = !$('#typed-signature-form').hidden;
    if (!$('#typed-signature-form').hidden) { $('#typed-signature').value = typed; $('#typed-signature').focus(); }
  });
  $('#typed-signature-form').addEventListener('submit', event => {
    event.preventDefault(); const value = $('#typed-signature').value.trim();
    if (!value) { setSignatureStatus('Please type your name first.', true); return; }
    typed = value; markEdited(); renderSignature(); $('#typed-signature-form').hidden = true;
  });
  function validStrokes(value) {
    if (!Array.isArray(value)) return [];
    return value.filter(Array.isArray).map(stroke => stroke.filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)).map(p => ({ x: Math.max(0, Math.min(1, p.x)), y: Math.max(0, Math.min(1, p.y)) }))).filter(stroke => stroke.length);
  }
  function loadGuestSignature() {
    const draft = drafts.get(data.guestId), record = data.signatures[data.guestId];
    activeStroke = null; activePointer = null;
    if (draft) {
      strokes = cloneStrokes(draft.strokes); typed = draft.typed; saved = draft.saved; dirty = draft.dirty;
    } else if (record) {
      strokes = validStrokes(record.strokes); typed = typeof record.typed === 'string' ? record.typed : ''; saved = hasSignature(); dirty = false;
    } else { strokes = []; typed = ''; saved = false; dirty = false; }
    $('#typed-signature-form').hidden = true;
    restoreSavedMessage();
    setSignatureStatus(saved ? 'Your saved signature is ready.' : (hasSignature() ? 'Your unsaved draft is ready.' : ''));
    updateSignatureControls(); renderSignature(); updateSignaturePreview();
  }
  function restoreSavedMessage() {
    $('#saved-panel h3').textContent = 'A moment, remembered.';
    const name = document.createElement('span'); name.dataset.guestName = ''; name.textContent = currentGuest().name;
    $('#saved-panel p').replaceChildren(document.createTextNode('Thank you, '), name, document.createTextNode('. Your signature has been saved on this device.'));
  }
  $('#save-signature').addEventListener('click', () => {
    if (!hasSignature()) return;
    renderSignature();
    const exactSignature = document.createElement('canvas');
    exactSignature.width = canvas.width; exactSignature.height = canvas.height;
    exactSignature.getContext('2d').drawImage(canvas, 0, 0);
    const previous = data.signatures[data.guestId];
    data.signatures[data.guestId] = { strokes: cloneStrokes(strokes), typed, savedAt: new Date().toISOString(), image: exactSignature.toDataURL('image/png'), guest: { ...currentGuest() }, event: { ...data.event } };
    downloadInvitation(exactSignature);
    if (persist()) {
      saved = true; dirty = false; drafts.delete(data.guestId);
      restoreSavedMessage();
      setSignatureStatus('Signature saved on this device.'); updateSignatureControls();
      captureSignature();
    } else {
      if (previous) data.signatures[data.guestId] = previous; else delete data.signatures[data.guestId];
      setSignatureStatus('Browser storage is unavailable or full. Your signature is still here; download a copy below.', true);
      $('#saved-panel').hidden = false;
      $('#saved-panel h3').textContent = 'Keep a copy of your signature.';
      $('#saved-panel p').textContent = 'The signature could not be saved in this browser. Download it before leaving.';
    }
  });

  const signatureDialog = $('#signature-dialog');
  let capturing = false;
  function signatureImage(record) {
    if (record.image) return record.image;
    const image = document.createElement('canvas'); image.width = 1200; image.height = 500;
    paintSignature(image.getContext('2d'), image.width, image.height, validStrokes(record.strokes), record.typed || '', false);
    return image.toDataURL('image/png');
  }
  function updateSignaturePreview() {
    const record = data.signatures[data.guestId];
    const present = record && (validStrokes(record.strokes).length || record.typed);
    $('#signature-preview').hidden = !present;
    $('#signature-prompt').hidden = !!present;
    if (present) $('#signature-preview').src = signatureImage(record);
    $('#slot-caption').textContent = present ? 'Saved on this device · Tap to edit' : 'Tap to sign full screen';
  }
  function closeSignature() {
    if (capturing) return;
    signatureDialog.close();
  }
  $('#signature').addEventListener('click', () => {
    if (capturing) return;
    signatureDialog.showModal(); document.body.classList.add('signing');
    resizeCanvas();
    if (!reduced.matches) signatureDialog.animate([{ opacity: 0, transform: 'translateY(28px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
  });
  $('#close-signature').addEventListener('click', closeSignature);
  signatureDialog.addEventListener('cancel', event => { if (capturing) event.preventDefault(); });
  signatureDialog.addEventListener('close', () => { document.body.classList.remove('signing'); $('#signature').focus({ preventScroll: true }); });
  async function captureSignature() {
    if (capturing) return;
    capturing = true;
    const area = $('.signature-area'); area.inert = true;
    $('#close-signature').disabled = true;
    const rect = canvas.getBoundingClientRect();
    const snapshot = document.createElement('img');
    snapshot.src = canvas.toDataURL('image/png'); snapshot.alt = ''; snapshot.className = 'signature-snapshot';
    Object.assign(snapshot.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    signatureDialog.append(snapshot);
    try {
      if (!reduced.matches) {
        await snapshot.animate([{ opacity: 0, filter: 'brightness(1.3)', transform: 'scale(1.02)' }, { opacity: 1, filter: 'brightness(1)', transform: 'scale(1)' }], { duration: 280, fill: 'forwards' }).finished;
      }
      signatureDialog.close(); document.body.append(snapshot);
      const target = $('.signature-preview').getBoundingClientRect();
      if (!reduced.matches) {
        await snapshot.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${target.left - rect.left}px,${target.top - rect.top}px) scale(${target.width / rect.width},${target.height / rect.height})`, opacity: 1 }], { duration: 780, easing: 'cubic-bezier(.22,.8,.22,1)', fill: 'forwards' }).finished;
      }
    } finally {
      snapshot.remove(); updateSignaturePreview(); capturing = false; area.inert = false;
      $('#close-signature').disabled = false;
      if (!reduced.matches) $('#signature').animate([{ boxShadow: '0 0 0 5px var(--line)' }, { boxShadow: '0 0 0 0 transparent' }], { duration: 550 });
      toast('Signature saved. Your named invitation download has been requested.');
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  function downloadCanvas(imageCanvas, filename) {
    imageCanvas.toBlob(blob => { if (blob) downloadBlob(blob, filename); else setSignatureStatus('Download could not be prepared. Please try again.', true); }, 'image/png');
  }
  $('#download-signature').addEventListener('click', async () => {
    const record = data.signatures[data.guestId];
    const guestName = record?.guest?.name || currentGuest().name;
    if (record?.image && saved && !dirty) {
      const image = new Image(); image.src = record.image;
      try {
        await image.decode();
        const out = document.createElement('canvas'); out.width = image.naturalWidth; out.height = image.naturalHeight;
        out.getContext('2d').drawImage(image, 0, 0);
        downloadCanvas(out, `codekshetra-${safeName(guestName)}-signature.png`);
      } catch { setSignatureStatus('Could not read the saved signature. Please try again.', true); }
    } else { renderSignature(); downloadCanvas(canvas, `codekshetra-${safeName(currentGuest().name)}-signature.png`); }
  });
  function wrappedText(ctx, text, x, y, width, lineHeight) {
    let line = '';
    for (const word of text.split(/\s+/)) {
      const test = line ? line + ' ' + word : word;
      if (line && ctx.measureText(test).width > width) { ctx.fillText(line, x, y); y += lineHeight; line = word; }
      else line = test;
    }
    if (line) { ctx.fillText(line, x, y); y += lineHeight; }
    return y;
  }
  $('#download-invitation').addEventListener('click', async () => {
    const record = data.signatures[data.guestId];
    if (record?.image && saved && !dirty) {
      const image = new Image(); image.src = record.image;
      try { await image.decode(); downloadInvitation(image, record); }
      catch { setSignatureStatus('Could not read the saved signature. Please try again.', true); }
    } else {
      renderSignature(); downloadInvitation(canvas);
    }
  });
  function downloadInvitation(signatureSource, record = null) {
    const guest = record?.guest || { ...currentGuest() };
    const eventDetails = record?.event || { ...data.event };
    // A self-contained keepsake export, without any server or image dependencies.
    const out = document.createElement('canvas'); out.width = 1200; out.height = 1900;
    const ctx = out.getContext('2d'), theme = document.body.dataset.theme;
    const ink = theme === 'aurora' ? '#eae9fa' : theme === 'pearl' ? '#1b3766' : '#252521';
    const bg = theme === 'aurora' ? '#101627' : theme === 'pearl' ? '#edf3fc' : '#f6f5ef';
    ctx.fillStyle = bg; ctx.fillRect(0, 0, out.width, out.height);
    ctx.strokeStyle = theme === 'aurora' ? '#48516c' : '#bac1c7'; ctx.lineWidth = 1; ctx.strokeRect(50, 50, 1100, 1800);
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = '18px Arial'; ctx.fillText('A PERSONAL INVITATION', 600, 125);
    ctx.font = '66px Georgia'; ctx.fillText('CODEKSHETRA 2026', 600, 235);
    ctx.font = 'italic 32px Georgia'; ctx.fillText('Inauguration Ceremony', 600, 330);
    let nameSize = 46; ctx.font = `${nameSize}px Georgia`;
    while (ctx.measureText(guest.name).width > 960 && nameSize > 16) { nameSize--; ctx.font = `${nameSize}px Georgia`; }
    ctx.fillText(guest.name, 600, 440);
    ctx.font = '22px Arial'; ctx.fillText(guest.role, 600, 490, 960);
    ctx.textAlign = 'left'; ctx.font = '26px Georgia';
    let y = wrappedText(ctx, 'The Rotaract Club of SVPCET, under the Student Affairs & Development Cell (SADC), cordially invites you to the inauguration ceremony of CODEKSHETRA 2026 — Enter the Kshetra. Solve the Impossible. A National-Level 24-Hour Hackathon.', 120, 600, 960, 43);
    y = wrappedText(ctx, eventDetails.message || DEFAULT_MESSAGE, 120, y + 30, 960, 43);
    // Event fields occupy fixed positions and long values wrap safely.
    y = Math.max(1000, y + 35);
    ['date','time','venue'].forEach(key => {
      ctx.font = '16px Arial'; ctx.fillText(key.toUpperCase(), 120, y);
      ctx.font = '26px Georgia'; y = wrappedText(ctx, eventDetails[key] || 'To be announced', 120, y + 38, 960, 34) + 25;
    });
    // Grow a long-content export rather than clipping its signature.
    if (y > 1330) {
      const resized = document.createElement('canvas'); resized.width = 1200; resized.height = y + 560;
      const large = resized.getContext('2d'); large.fillStyle = bg; large.fillRect(0,0,resized.width,resized.height);
      large.drawImage(out,0,0); large.fillStyle = bg; large.fillRect(0,1800,1200,resized.height-1800);
      large.strokeStyle = ctx.strokeStyle; large.strokeRect(50,50,1100,resized.height-100);
      addExportSignature(large, y + 30, ink, signatureSource); downloadCanvas(resized, `codekshetra-${safeName(guest.name)}-invitation.png`); return;
    }
    addExportSignature(ctx, 1390, ink, signatureSource); downloadCanvas(out, `codekshetra-${safeName(guest.name)}-invitation.png`);
  }
  function addExportSignature(ctx, y, ink, sig) {
    // Uniform scaling preserves the actual signature, regardless of tablet orientation.
    const width = sig.naturalWidth || sig.width, height = sig.naturalHeight || sig.height;
    const scale = Math.min(960 / width, 280 / height);
    ctx.drawImage(sig, 120 + (960 - width * scale) / 2, y + (280 - height * scale) / 2, width * scale, height * scale);
    ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.font = '14px Arial';
    ctx.fillText('A MARK TO REMEMBER · CODEKSHETRA', 600, y + 325);
    ctx.font = 'italic 24px Georgia'; ctx.fillText('Warm Regards, Organizing Committee · Rotaract Club of SVPCET', 600, y + 390);
  }
  if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe($('.canvas-wrap'));
  else window.addEventListener('resize', resizeCanvas);
  window.addEventListener('beforeunload', event => {
    const pendingDraft = [...drafts.values()].some(d => d.dirty && (d.strokes.length || d.typed));
    if ((dirty && hasSignature()) || pendingDraft) { event.preventDefault(); event.returnValue = ''; }
  });
  personalize(); loadGuestSignature();
  $('.skip-link').href = '#opening-guest-select'; $('.skip-link').textContent = 'Skip to guest selection';
  if (!storageAvailable) toast('Browser storage is unavailable. You can still download your signature.');
  if (location.hash === '#invitation' || location.hash === '#signature') {
    const goToSignature = location.hash === '#signature'; finishOpening();
    if (goToSignature) requestAnimationFrame(() => $('#signature').click());
  }
})();
