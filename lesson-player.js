/* Shared frontend lesson renderer. Files and progress remain local to this preview. */
(() => {
  'use strict';
  const Security = window.KIASecurity,
    esc = Security.escapeHTML,
    safeURL = Security.mediaURL;
  const mounted = new Map();
  function dispose(root) {
    if (!root) return;
    for (const [node, state] of mounted)
      if (node === root || root.contains(node)) {
        state.controller.abort();
        state.urls.forEach((url) => URL.revokeObjectURL(url));
        mounted.delete(node);
        node.dataset.mediaRequest = 'closed';
      }
    root.querySelectorAll('video').forEach((v) => {
      v.pause();
      v.removeAttribute('src');
      v.load();
    });
    root.querySelectorAll('iframe').forEach((f) => f.remove());
  }
  function embedURL(value) {
    const u = new URL(safeURL(value));
    if (
      [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtu.be',
        'www.youtube-nocookie.com',
      ].includes(u.hostname)
    ) {
      const id =
        u.hostname === 'youtu.be'
          ? u.pathname.slice(1)
          : u.searchParams.get('v') || u.pathname.split('/').at(-1);
      if (!/^[\w-]{11}$/.test(id)) throw new Error('Use a valid YouTube video link.');
      return 'https://www.youtube-nocookie.com/embed/' + id;
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(u.hostname)) {
      const id = u.pathname.split('/').filter(Boolean).at(-1);
      if (!/^\d+$/.test(id)) throw new Error('Use a valid Vimeo video link.');
      return 'https://player.vimeo.com/video/' + id;
    }
    return u.href;
  }
  async function resource(root, item) {
    dispose(root);
    const actor = window.KIAAccounts.current();
    if (!actor || (actor.role !== 'admin' && !window.KIALearning.unlocked(actor, item.courseId))) {
      root.textContent = 'This resource is not available to this account.';
      return;
    }
    const token = crypto.randomUUID(),
      state = { urls: [], controller: new AbortController() };
    root.dataset.mediaRequest = token;
    mounted.set(root, state);
    const sessionNonce = window.KIAAccounts.currentSession()?.nonce;
    const fresh = () =>
      root.isConnected &&
      root.dataset.mediaRequest === token &&
      window.KIAAccounts.current()?.id === actor.id &&
      window.KIAAccounts.currentSession()?.nonce === sessionNonce;
    const fail = (message) => {
      if (fresh()) root.innerHTML = `<p class="media-status" role="alert">${esc(message)}</p>`;
    };
    const asURL = (blob) => {
      const url = URL.createObjectURL(blob);
      state.urls.push(url);
      return url;
    };
    async function load() {
      if (!fresh()) return;
      root.innerHTML = '<p class="media-status" role="status">Loading resource…</p>';
      try {
        let url, blob;
        if (item.source === 'file') {
          blob = await window.KIAAdminData.getFile(item.id);
          if (!fresh()) return;
          if (!blob)
            throw new Error(
              'This file is unavailable in this browser. Ask KIA to upload it again.'
            );
          await Security.validateFile(blob, item.type === 'Images' ? 'Image' : item.type);
          if (!fresh()) return;
          if (item.type === 'Text') {
            const body = await blob.text();
            if (fresh()) root.innerHTML = `<div class="lesson-text">${esc(body)}</div>`;
            return;
          }
          if (item.type !== 'PDF') url = asURL(blob);
        } else if (item.source === 'text') {
          root.innerHTML = `<div class="lesson-text">${esc(item.body)}</div>`;
          return;
        } else url = safeURL(item.url, item.source === 'bundled');
        if (item.type === 'PDF' && !blob) {
          const response = await fetch(url, {
            credentials: 'omit',
            referrerPolicy: 'no-referrer',
            cache: 'no-store',
            signal: state.controller.signal,
            redirect: 'error',
          });
          if (
            !response.ok ||
            !response.headers.get('content-type')?.toLowerCase().startsWith('application/pdf')
          )
            throw new Error(
              'Use a direct PDF file that allows viewing in the portal, or upload the PDF.'
            );
          const reader = response.body.getReader(),
            chunks = [];
          let size = 0;
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > 25 * 1024 * 1024) {
              await reader.cancel();
              throw new Error('PDF files must be no larger than 25 MB.');
            }
            chunks.push(value);
          }
          blob = new Blob(chunks, { type: 'application/pdf' });
          await Security.validateFile(blob, 'PDF');
          if (!fresh()) return;
        }
        if (!fresh()) return;
        if (item.type === 'PDF' && blob) {
          await window.KIAPDFViewer.open(root, blob, {
            signal: state.controller.signal,
            fresh,
            title: item.title,
          });
          return;
        }
        if (['Image', 'Images', 'GIF'].includes(item.type))
          root.innerHTML = `<img class="lesson-media" src="${esc(url)}" alt="${esc(item.title)}" referrerpolicy="no-referrer" draggable="false"/>`;
        else if (
          item.type === 'Video' &&
          (url.startsWith('blob:') ||
            ![
              'youtube.com',
              'www.youtube.com',
              'm.youtube.com',
              'youtu.be',
              'www.youtube-nocookie.com',
              'vimeo.com',
              'www.vimeo.com',
              'player.vimeo.com',
            ].includes(new URL(url).hostname))
        )
          root.innerHTML = `<video class="lesson-media" src="${esc(url)}" controls controlslist="nodownload noremoteplayback" disablepictureinpicture preload="metadata" playsinline></video>`;
        else if (item.type === 'Embedded' || item.type === 'Video') {
          const src = embedURL(url),
            trusted = ['www.youtube-nocookie.com', 'player.vimeo.com'].includes(
              new URL(src).hostname
            );
          root.innerHTML = `<iframe class="lesson-frame" src="${esc(src)}" title="${esc(item.title)}" sandbox="allow-scripts allow-presentation${trusted ? ' allow-same-origin' : ''}" allow="fullscreen; encrypted-media; camera 'none'; microphone 'none'; geolocation 'none'" referrerpolicy="no-referrer" allowfullscreen credentialless></iframe><p class="media-status">If this activity does not load, ask your Mompreneur to check the lesson link. Some websites do not allow embedding.</p>`;
        } else
          root.innerHTML = `<iframe class="lesson-frame" src="${esc(url)}" title="${esc(item.title)}" sandbox referrerpolicy="no-referrer" credentialless></iframe>`;
        root
          .querySelector('video,img')
          ?.addEventListener(
            'error',
            () => fail('This media could not load. Ask KIA to check the file or link.'),
            { once: true }
          );
      } catch (error) {
        if (error.name !== 'AbortError') fail(error.message || 'This resource could not load.');
      }
    }
    if (item.source === 'url') {
      try {
        const host = new URL(safeURL(item.url)).hostname;
        root.innerHTML = `<div class="external-resource"><strong>External learning content</strong><p>This content is hosted by ${esc(host)}. Load it when you’re ready to connect to that website.</p><button class="button secondary" type="button" data-load-external>Load content</button></div>`;
        root.querySelector('button').addEventListener('click', load, { once: true });
      } catch (error) {
        fail(error.message);
      }
    } else await load();
  }
  function lesson(root, item, courseId) {
    dispose(root);
    root.innerHTML = `${item.body ? `<div class="lesson-text">${esc(item.body)}</div>` : ''}<div class="lesson-media-slot"></div>`;
    const slot = root.querySelector('.lesson-media-slot'),
      s = window.KIAAdminData.read();
    const media = item.resourceId
      ? s.content.find((r) => r.id === item.resourceId && r.courseId === courseId)
      : item.url
        ? { ...item, courseId, source: 'url' }
        : null;
    if (media) resource(slot, media);
    else if (item.resourceId)
      slot.innerHTML =
        '<p class="media-status">This resource is no longer available. Ask KIA to update the lesson.</p>';
    else if (!item.body && item.type !== 'Quiz')
      slot.innerHTML =
        '<p class="media-status">KIA has not added the content for this lesson yet.</p>';
  }
  function quiz(root, questions, onResult, score) {
    if (!questions?.length) {
      root.innerHTML = '<p class="media-status">KIA has not added questions to this quiz yet.</p>';
      return;
    }
    root.innerHTML = `<form class="player-quiz">${questions.map((q, i) => `<fieldset class="quiz-question"><legend>${i + 1}. ${esc(q.text)}</legend>${q.options.map((a, ai) => `<label class="quiz-option"><input type="radio" name="q${i}" value="${ai}" required/><span>${esc(a)}</span></label>`).join('')}</fieldset>`).join('')}<div class="quiz-result" role="status" ${score === undefined ? 'hidden' : ''}>${score === undefined ? '' : `Last result: ${score}% · You can try again.`}</div><button class="button primary" type="submit">Check my answers</button></form>`;
    root.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!form.reportValidity()) return;
      const data = new FormData(form),
        correct = questions.filter((q, i) => Number(data.get('q' + i)) === q.answer).length,
        result = Math.round((correct / questions.length) * 100);
      try {
        onResult(result);
        const feedback = root.querySelector('.quiz-result');
        feedback.hidden = false;
        feedback.innerHTML = `<strong>${correct} of ${questions.length} correct · ${result}%</strong><p>Your result has been saved. You can review your answers and try again.</p>${
          result < 100
            ? '<ul>' +
              questions
                .filter((q, i) => Number(data.get('q' + i)) !== q.answer)
                .map((q) => `<li>${esc(q.text)} — ${esc(q.options[q.answer])}</li>`)
                .join('') +
              '</ul>'
            : ''
        }`;
      } catch (error) {
        const feedback = root.querySelector('.quiz-result');
        feedback.hidden = false;
        feedback.textContent = error.message;
      }
    });
  }
  window.KIAPlayer = { esc, safeURL, embedURL, resource, lesson, quiz, dispose };
})();
