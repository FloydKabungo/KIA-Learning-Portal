/* Renders validated PDF bytes locally; no document scripts, links, forms or downloads. */
(() => {
  'use strict';
  let loading;
  function engine() {
    if (!loading)
      loading = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'Assets/pdf-renderer.js';
        script.onload = () => resolve(window.KIAPDFEngine);
        script.onerror = () => {
          loading = null;
          script.remove();
          reject(
            new Error('The PDF viewer could not load. Check that all website files were extracted.')
          );
        };
        document.head.append(script);
      });
    return loading;
  }
  async function open(root, blob, { signal, fresh, title }) {
    const pdf = await engine();
    if (signal.aborted || !fresh()) return;
    const task = pdf.getDocument({
      data: new Uint8Array(await blob.arrayBuffer()),
      BinaryDataFactory: pdf.EmbeddedData,
      useWorkerFetch: false,
      enableXfa: false,
      disableFontFace: true,
      useSystemFonts: true,
      isEvalSupported: false,
      maxImageSize: 16000000,
      canvasMaxAreaInBytes: 64000000,
      verbosity: 0,
    });
    let rendering;
    signal.addEventListener(
      'abort',
      () => {
        rendering?.cancel();
        task.destroy().catch(() => {});
      },
      { once: true }
    );
    if (signal.aborted) {
      await task.destroy();
      return;
    }
    const doc = await task.promise;
    if (!fresh() || signal.aborted) {
      await task.destroy();
      return;
    }
    root.innerHTML =
      '<section class="pdf-viewer"><div class="pdf-toolbar"><button type="button" class="button secondary" data-pdf-prev aria-label="Previous PDF page">←</button><span role="status" data-pdf-position></span><button type="button" class="button secondary" data-pdf-next aria-label="Next PDF page">→</button></div><canvas role="img"></canvas><details class="pdf-text"><summary>Read page text</summary><p></p></details><p class="media-status" data-pdf-error role="alert"></p></section>';
    const canvas = root.querySelector('canvas'),
      prev = root.querySelector('[data-pdf-prev]'),
      next = root.querySelector('[data-pdf-next]'),
      position = root.querySelector('[data-pdf-position]'),
      text = root.querySelector('.pdf-text p'),
      error = root.querySelector('[data-pdf-error]');
    let number = 1,
      busy = false;
    async function render() {
      if (busy || signal.aborted || !fresh()) return;
      busy = true;
      prev.disabled = next.disabled = true;
      error.textContent = '';
      position.textContent = `Loading page ${number}…`;
      try {
        const page = await doc.getPage(number);
        if (signal.aborted || !fresh()) return;
        const natural = page.getViewport({ scale: 1 });
        const width = Math.max(200, Math.min(root.clientWidth || 760, 1100));
        const ratio = Math.min(devicePixelRatio || 1, 2);
        const scale = Math.min(
          (width / natural.width) * ratio,
          1800 / Math.max(natural.width, natural.height)
        );
        const viewport = page.getViewport({ scale });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.setAttribute('aria-label', `${title} · page ${number} of ${doc.numPages}`);
        rendering = page.render({
          canvasContext: canvas.getContext('2d'),
          viewport,
          annotationMode: pdf.AnnotationMode.DISABLE,
        });
        await rendering.promise;
        const content = await page.getTextContent();
        if (signal.aborted || !fresh()) return;
        text.textContent =
          content.items.map((item) => item.str || '').join(' ') ||
          'This page contains images. No readable text is available.';
        position.textContent = `Page ${number} of ${doc.numPages}`;
        canvas.dataset.ready = String(number);
        page.cleanup();
      } catch (e) {
        if (!signal.aborted && fresh())
          error.textContent = 'This PDF page could not be displayed. Ask KIA to check the file.';
      } finally {
        busy = false;
        prev.disabled = number <= 1;
        next.disabled = number >= doc.numPages;
      }
    }
    prev.addEventListener('click', () => {
      if (!busy && number > 1) {
        number--;
        render();
      }
    });
    next.addEventListener('click', () => {
      if (!busy && number < doc.numPages) {
        number++;
        render();
      }
    });
    await render();
  }
  window.KIAPDFViewer = Object.freeze({ open });
})();
