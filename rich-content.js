/* Small frontend text composer. Only a fixed set of elements and safe links is retained. */
(() => {
  'use strict';
  const allowed = new Set(['P','BR','STRONG','EM','U','H2','H3','UL','OL','LI','A']);
  const blocked = new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON','IMG','VIDEO','AUDIO','LINK','META']);
  const esc = window.KIASecurity.escapeHTML;
  function clean(value) {
    const source = document.createElement('template'); source.innerHTML = String(value || '').slice(0,60000);
    const output = document.createElement('div');
    function visit(node, host) {
      if (node.nodeType === Node.TEXT_NODE) { host.append(document.createTextNode(node.textContent)); return; }
      if (node.nodeType !== Node.ELEMENT_NODE || blocked.has(node.tagName)) return;
      const tag = ({B:'STRONG',I:'EM',DIV:'P'})[node.tagName] || node.tagName;
      if (!allowed.has(tag)) { for (const child of node.childNodes) visit(child,host); return; }
      const copy = document.createElement(tag.toLowerCase());
      if (tag === 'A') {
        try { copy.href = window.KIASecurity.mediaURL(node.getAttribute('href')); }
        catch { for (const child of node.childNodes) visit(child,host); return; }
        copy.target = '_blank'; copy.rel = 'noopener noreferrer'; copy.referrerPolicy = 'no-referrer';
        if (node.classList.contains('lesson-action')) copy.className = 'lesson-action';
      }
      for (const child of node.childNodes) visit(child,copy);
      host.append(copy);
    }
    for (const node of source.content.childNodes) visit(node,output);
    return output.innerHTML;
  }
  const fromText = text => String(text || '').split(/\n\s*\n/).map(p => '<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('');
  const render = item => clean(item.bodyHtml || fromText(item.body));
  function mount(textarea, options = {}) {
    const wrapper = document.createElement('div'); wrapper.className = 'rich-composer';
    wrapper.innerHTML = `<div class="rich-toolbar" role="group" aria-label="Text formatting"><button type="button" data-format="strong" aria-label="Bold selected text"><strong>B</strong></button><button type="button" data-format="em" aria-label="Italic selected text"><em>I</em></button><button type="button" data-format="u" aria-label="Underline selected text"><u>U</u></button><button type="button" data-block="h3">Add heading</button><button type="button" data-block="p">Add paragraph</button><button type="button" data-block="ul">Add list</button><button type="button" data-add-button>Add button</button><button type="button" data-clear-format>Clear formatting</button></div><div class="rich-editor lesson-rich-text" contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(options.label || 'Lesson content')}" spellcheck="true"></div><div class="rich-link-fields" hidden><label>Button text<input type="text" data-button-label maxlength="80" placeholder="Explore the activity"></label><label>Button destination (HTTPS)<input type="url" data-button-url maxlength="2000" placeholder="https://..."></label><div><button type="button" data-insert-button>Insert button</button><button type="button" data-cancel-button>Cancel</button></div></div><p class="rich-help" role="status">Select words to make them bold, italic or underlined. Press Enter for a new paragraph.</p>`;
    textarea.before(wrapper); textarea.hidden = true; textarea.required = false;
    const editor = wrapper.querySelector('.rich-editor'), help = wrapper.querySelector('.rich-help'), fields = wrapper.querySelector('.rich-link-fields');
    editor.innerHTML = clean(options.html || fromText(textarea.value)) || '<p><br></p>';
    let savedRange = null;
    const within = node => !!node && (node === editor || editor.contains(node));
    function remember() { const sel = getSelection(); if (sel.rangeCount && within(sel.anchorNode) && within(sel.focusNode)) savedRange = sel.getRangeAt(0).cloneRange(); }
    function selection(range) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range); savedRange = range.cloneRange(); }
    function sync() { textarea.value = editor.innerText.trim(); textarea.dispatchEvent(new Event('input',{bubbles:true})); }
    function selectContents(node) { editor.focus(); const r = document.createRange(); r.selectNodeContents(node); selection(r); }
    function addBlock(tag, text) {
      const block = document.createElement(tag);
      if (tag === 'ul') { const li = document.createElement('li'); li.textContent = 'List item'; block.append(li); }
      else if (text) block.textContent = text; else block.append(document.createElement('br'));
      let after = savedRange?.endContainer; if (after?.nodeType === Node.TEXT_NODE) after = after.parentElement;
      while (after && after.parentElement !== editor) after = after.parentElement;
      if (after && ['P','H2','H3','UL','OL'].includes(after.tagName) && editor.contains(after)) after.after(block); else editor.append(block);
      selectContents(tag === 'ul' ? block.firstChild : block); sync(); return block;
    }
    function format(tag) {
      if (!savedRange || savedRange.collapsed || !within(savedRange.commonAncestorContainer)) { help.textContent = 'Select the words you want to format first.'; return; }
      const range = savedRange.cloneRange(), nodes = [], walk = document.createTreeWalker(editor,NodeFilter.SHOW_TEXT);
      while (walk.nextNode()) if (range.intersectsNode(walk.currentNode)) nodes.push(walk.currentNode);
      const wraps = [];
      for (const node of nodes) {
        const start = range.startContainer === node ? range.startOffset : 0;
        const end = range.endContainer === node ? range.endOffset : node.length;
        if (end <= start) continue;
        if (end < node.length) node.splitText(end);
        const selected = start ? node.splitText(start) : node;
        const wrap = document.createElement(tag); selected.before(wrap); wrap.append(selected); wraps.push(wrap);
      }
      if (wraps.length) { const next = document.createRange(); next.setStartBefore(wraps[0]); next.setEndAfter(wraps.at(-1)); editor.focus(); selection(next); }
      help.textContent = 'Formatting applied.'; sync();
    }
    editor.addEventListener('input',sync); editor.addEventListener('keyup',remember); editor.addEventListener('mouseup',remember);
    editor.addEventListener('blur',remember); editor.addEventListener('paste',event => {
      event.preventDefault(); remember(); const text = event.clipboardData.getData('text/plain');
      if (!savedRange) { editor.append(document.createTextNode(text)); } else { const range = savedRange.cloneRange(); range.deleteContents(); const node = document.createTextNode(text); range.insertNode(node); range.setStartAfter(node); range.collapse(true); selection(range); } sync();
    });
    editor.addEventListener('drop',event=>event.preventDefault());
    wrapper.querySelector('.rich-toolbar').addEventListener('mousedown',event=>{if(event.target.closest('button'))event.preventDefault();});
    wrapper.addEventListener('click',event=>{
      const button = event.target.closest('button'); if (!button) return;
      if (button.dataset.format) format(button.dataset.format);
      if (button.dataset.block) addBlock(button.dataset.block,button.dataset.block==='h3'?'Section heading':'');
      if (button.hasAttribute('data-add-button')) { fields.hidden=false; fields.querySelector('[data-button-label]').focus(); }
      if (button.hasAttribute('data-cancel-button')) { fields.hidden=true; editor.focus(); }
      if (button.hasAttribute('data-insert-button')) {
        try {
          const label = fields.querySelector('[data-button-label]').value.trim();
          if (!label) throw new Error('Enter text for the button.');
          const url = window.KIASecurity.mediaURL(fields.querySelector('[data-button-url]').value.trim());
          const block = addBlock('p',''), link = document.createElement('a');
          link.className='lesson-action';link.textContent=label;link.href=url;link.target='_blank';link.rel='noopener noreferrer';
          block.replaceChildren(link); fields.hidden=true; fields.querySelectorAll('input').forEach(n=>n.value='');sync();help.textContent='Button added. Its destination opens in a new tab.';
        } catch(error) { help.textContent=error.message; }
      }
      if (button.hasAttribute('data-clear-format')) { editor.innerHTML=fromText(editor.innerText);sync();help.textContent='Formatting and buttons cleared; text kept.'; }
    });
    // Links are editable in the composer; they navigate in the rendered lesson only.
    editor.addEventListener('click',event=>{if(event.target.closest('a'))event.preventDefault();});
    sync();
    return { focus:()=>editor.focus(), addParagraph:()=>addBlock('p',''), addButton:()=>wrapper.querySelector('[data-add-button]').click(),
      read:()=>{sync();const bodyHtml=clean(editor.innerHTML);if(bodyHtml.length>60000||textarea.value.length>12000)throw new Error('Keep lesson text under 12,000 characters.');return {body:textarea.value,bodyHtml};} };
  }
  window.KIARichContent = Object.freeze({clean,fromText,render,mount});
})();
