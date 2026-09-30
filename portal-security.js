/* Browser-side defense in depth. This is not server authentication. */
(() => {
  'use strict';
  const escapeHTML = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  function text(value, label = 'Value', max = 12000) {
    const clean = String(value ?? '').trim();
    if (!clean || clean.length > max) throw new Error(`${label} must contain 1–${max} characters.`);
    return clean;
  }
  const isDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  const isTime = (value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  function mediaURL(value, bundled = false) {
    if (bundled && /^Assets\/[a-zA-Z0-9._-]+$/.test(value)) return value;
    if (typeof value !== 'string' || value.length > 2000)
      throw new Error('Keep content links under 2,000 characters.');
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error('Enter a complete HTTPS content link.');
    }
    const host = url.hostname.toLowerCase();
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host.endsWith('.local') ||
      host === '[::1]' ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      host.includes(':')
    )
      throw new Error(
        'Use an HTTPS content link with a public hostname and no embedded credentials.'
      );
    return url.href;
  }
  async function validateFile(file, type) {
    const allowed = {
      Video: ['video/mp4', 'video/webm'],
      Image: ['image/png', 'image/jpeg', 'image/webp'],
      GIF: ['image/gif'],
      Text: ['text/plain'],
      PDF: ['application/pdf'],
    };
    if (!file?.size || file.size > 25 * 1024 * 1024 || !allowed[type]?.includes(file.type))
      throw new Error('Choose a matching file type, up to 25 MB.');
    const bytes = new Uint8Array(await file.slice(0, 512).arrayBuffer()),
      starts = (values) => values.every((v, i) => bytes[i] === v),
      ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
    const valid = {
      'image/png': () => starts([137, 80, 78, 71, 13, 10, 26, 10]),
      'image/jpeg': () => starts([255, 216, 255]),
      'image/webp': () => ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP',
      'image/gif': () => ['GIF87a', 'GIF89a'].includes(ascii(0, 6)),
      'video/mp4': () => ascii(4, 8) === 'ftyp',
      'video/webm': () => starts([26, 69, 223, 163]),
      'application/pdf': () => ascii(0, 5) === '%PDF-',
      'text/plain': () => !bytes.includes(0),
    };
    if (!valid[file.type]()) throw new Error('The file contents do not match its declared type.');
    return file;
  }
  const currentDay = () =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Johannesburg',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  window.KIASecurity = Object.freeze({
    escapeHTML,
    text,
    isDate,
    isTime,
    mediaURL,
    validateFile,
    currentDay,
  });
  if (window.top !== window.self) {
    document.documentElement.replaceChildren();
    throw new Error('Open the KIA portal directly, outside an embedded frame.');
  }
})();
