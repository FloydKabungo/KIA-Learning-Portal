/* Display preferences only. Does not create accounts or change permissions. */
(() => {
  'use strict';
  const esc = value => String(value).replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const defaults = { size:'normal', spacing:false, quiet:false, motion:matchMedia('(prefers-reduced-motion: reduce)').matches, rankings:true };
  let preferences = {...defaults};
  try { preferences = {...defaults, ...JSON.parse(localStorage.getItem('kia-display-preferences-v1') || '{}')}; } catch {}
  function apply() {
    const d = document.documentElement.dataset;
    d.textSize = ['normal','large','larger'].includes(preferences.size) ? preferences.size : 'normal';
    d.readingSpace = String(preferences.spacing); d.quiet = String(preferences.quiet); d.reduceMotion = String(preferences.motion);
    document.querySelectorAll('[data-rankings-panel]').forEach(n => n.hidden = !preferences.rankings);
    document.querySelectorAll('video').forEach(n => { n.autoplay = false; n.controlsList?.add('nodownload'); });
  }
  apply();
  if (!document.querySelector('.skip-link')) {
    const skip = document.createElement('a'); skip.className='skip-link'; skip.textContent='Skip to content';
    const main = document.querySelector('main'); if (main) { if(!main.id)main.id='main-content';main.tabIndex=-1;skip.href='#'+main.id;document.body.prepend(skip); }
  }
  let menu = document.querySelector('#account-menu');
  let toggle = document.querySelector('#account-toggle');
  if (!menu) {
    const area = document.querySelector('.student-user-area,.account');
    if (area) {
      const wrapper = document.createElement('div'); wrapper.className = 'learner-account-wrap';
      toggle = document.createElement('button'); toggle.type = 'button'; toggle.id = 'learner-account-toggle';
      toggle.className = 'learner-account-toggle'; toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-controls','learner-account-menu');
      const avatar = area.querySelector('.student-avatar,.avatar');
      const name = area.querySelector('.student-user-copy,.account-name');
      if (avatar) toggle.append(avatar); if (name) toggle.append(name);
      const arrow = document.createElement('span'); arrow.textContent = '⌄'; arrow.setAttribute('aria-hidden','true'); toggle.append(arrow);
      toggle.setAttribute('aria-label','Learner account options');
      menu = document.createElement('div'); menu.id = 'learner-account-menu'; menu.className = 'learner-account-menu'; menu.hidden = true;
      const exit = area.querySelector('.student-logout,.logout'); if (exit) menu.append(exit);
      wrapper.append(toggle,menu); area.append(wrapper);
      const close = () => { menu.hidden = true; toggle.setAttribute('aria-expanded','false'); };
      toggle.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; toggle.setAttribute('aria-expanded',String(open)); });
      document.addEventListener('click',event => { if (!wrapper.contains(event.target)) close(); });
      document.addEventListener('keydown',event => { if (event.key === 'Escape' && !menu.hidden) { close(); toggle.focus(); } });
    }
  }
  if (!menu) {
    const header = document.querySelector('.site-header .header-inner');
    if (header) {
      const wrapper = document.createElement('div'); wrapper.className = 'public-account-wrap learner-account-wrap';
      toggle = document.createElement('button'); toggle.type = 'button'; toggle.id = 'public-account-toggle';
      toggle.className = 'learner-account-toggle public-account-toggle';
      toggle.innerHTML = 'Options <span aria-hidden="true">⌄</span>';
      toggle.setAttribute('aria-expanded','false'); toggle.setAttribute('aria-controls','public-account-menu');
      menu = document.createElement('div'); menu.id = 'public-account-menu'; menu.className = 'learner-account-menu'; menu.hidden = true;
      wrapper.append(toggle,menu); header.insertBefore(wrapper,header.querySelector('.menu-button'));
      const close = () => { menu.hidden = true; toggle.setAttribute('aria-expanded','false'); };
      toggle.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; toggle.setAttribute('aria-expanded',String(open)); });
      document.addEventListener('click', event => { if (!wrapper.contains(event.target)) close(); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { close(); toggle.focus(); } });
    }
  }
  const trigger = document.createElement('button'); trigger.className = 'display-trigger';
  trigger.type = 'button'; trigger.setAttribute('aria-haspopup','dialog'); trigger.textContent = 'Display & comfort';
  if (menu) menu.insertBefore(trigger, menu.querySelector('a[href="login.html"]'));

  const dialog = document.createElement('dialog'); dialog.className='display-dialog'; dialog.setAttribute('aria-labelledby','display-heading');
  dialog.innerHTML=`<h2 id="display-heading">Make yourself comfortable</h2><p>Choose what helps you focus. You can change these settings any time.</p><label class="pref-row"><span>Text size</span><select name="size"><option value="normal">Standard</option><option value="large">Large</option><option value="larger">Extra large</option></select></label>${[['spacing','More reading space','Extra space between lines and words.'],['quiet','Quiet view','Fewer decorative pictures.'],['motion','Reduce motion','Keep the interface still.'],['rankings','Show club rankings','Your personal points remain visible.']].map(([key,title,description])=>`<label class="pref-row"><span>${title}<small>${description}</small></span><input name="${key}" type="checkbox"/></label>`).join('')}<button class="refresh-close" type="button">Done</button>`;
  document.body.append(dialog);
  trigger.addEventListener('click',()=>{if(menu){menu.hidden=true;toggle?.setAttribute('aria-expanded','false');}for(const [k,v] of Object.entries(preferences)){const f=dialog.querySelector(`[name="${k}"]`);if(f){if(f.type==='checkbox')f.checked=!!v;else f.value=v;}}dialog.showModal();});
  dialog.querySelector('button').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=> (toggle || trigger).focus());
  dialog.addEventListener('change',e=>{preferences[e.target.name]=e.target.type==='checkbox'?e.target.checked:e.target.value;try{localStorage.setItem('kia-display-preferences-v1',JSON.stringify(preferences));}catch{}apply();});
  const footer=document.createElement('div'); footer.className='copyright-note';
  footer.innerHTML=`<span>© ${new Date().getFullYear()} Kids Innovate Africa. Learning content for authorised use.</span><a href="content-use.html">Content use & copyright</a>`;
  document.body.append(footer);
  window.KIADisplay={apply,preferences,escape:esc};
})();
