/* Enrolment form design only. Personal details stay in form memory; nothing is sent or stored. */
(() => {
  'use strict';
  const form=document.querySelector('#enrol-form'),panels=[...form.querySelectorAll('[data-step]')];
  const esc=window.KIADisplay?.escape || (s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  let step=0,childCount=0;
  const input=(name,label,type='text',attrs='')=>`<label>${label}<input name="${name}" type="${type}" required maxlength="120" ${attrs}></label>`;
  function child(){
    const id=++childCount;const box=document.createElement('fieldset');box.className='child-entry';box.dataset.child=String(id);
    box.innerHTML=`<legend>Learner ${id}</legend><div class="enrol-fields">${input('child-name-'+id,'Full name')}${input('child-username-'+id,'Preferred learner username','text','pattern="[A-Za-z0-9_-]{3,32}" minlength="3" autocomplete="off" title="3–32 letters, numbers, underscores or hyphens"')}${input('child-dob-'+id,'Date of birth','date')}<label>Gender<select name="child-gender-${id}" required><option value="">Select</option><option>Girl</option><option>Boy</option><option>Another gender</option><option>Prefer not to say</option></select></label><label class="wide">Home address<textarea name="child-address-${id}" required maxlength="300" rows="2"></textarea></label></div><button class="button button-secondary" style="margin-top:16px" type="button" data-remove-child>Remove learner</button>`;
    document.querySelector('#children').append(box);updateRemove();return box;
  }
  function updateRemove(){form.querySelectorAll('[data-remove-child]').forEach(b=>b.disabled=form.querySelectorAll('[data-child]').length===1);}
  function validate(panel){
    form.querySelectorAll('[name^="child-dob-"]').forEach(n=>{n.setCustomValidity('');if(n.value){const now=new Date(),dob=new Date(n.value+'T12:00:00'),age=now.getFullYear()-dob.getFullYear()-((now.getMonth()<dob.getMonth()||(now.getMonth()===dob.getMonth()&&now.getDate()<dob.getDate()))?1:0);if(age<8||age>18)n.setCustomValidity('This programme is for learners aged 8 to 18. Please check the date or contact KIA.');}});
    const seen=new Set();form.querySelectorAll('[name^="child-username-"]').forEach(n=>{n.setCustomValidity('');const v=n.value.trim().toLowerCase();if(v&&seen.has(v))n.setCustomValidity('Choose a different username for each learner.');seen.add(v);});
    for(const control of panel.querySelectorAll('input,select,textarea'))if(!control.reportValidity())return false;return true;
  }
  function show(index){
    step=index;panels.forEach((p,i)=>p.hidden=i!==step);
    document.querySelectorAll('.enrol-steps li').forEach((n,i)=>{if(i===step)n.setAttribute('aria-current','step');else n.removeAttribute('aria-current');});
    if(step===2)review();
    const h=panels[step].querySelector('h2');h.tabIndex=-1;h.focus();
  }
  function review(){
    const d=new FormData(form),children=[...form.querySelectorAll('[data-child]')];
    document.querySelector('#enrol-review').innerHTML=`<dl><dt>Guardian</dt><dd>${esc(d.get('guardian-name'))}</dd><dt>Email</dt><dd>${esc(d.get('guardian-email'))}</dd><dt>Cellphone</dt><dd>${esc(d.get('guardian-phone'))}</dd><dt>Preferred club</dt><dd>${esc(d.get('club'))}</dd></dl><h3>Learners (${children.length})</h3>${children.map(b=>`<p><strong>${esc(d.get('child-name-'+b.dataset.child))}</strong><br>@${esc(d.get('child-username-'+b.dataset.child))}</p>`).join('')}`;
  }
  form.addEventListener('click',e=>{
    if(e.target.closest('[data-next]')){if(validate(panels[step]))show(step+1);}
    if(e.target.closest('[data-back]'))show(step-1);
    if(e.target.closest('[data-add-child]')){const box=child();box.querySelector('input').focus();}
    const remove=e.target.closest('[data-remove-child]');if(remove&&!remove.disabled){remove.closest('[data-child]').remove();updateRemove();document.querySelector('[data-add-child]').focus();}
  });
  form.addEventListener('submit',e=>{e.preventDefault();if(step<2){if(validate(panels[step]))show(step+1);return;}if(!validate(panels[2]))return;
    const message=document.querySelector('#enrol-result');message.hidden=false;message.textContent='Online enrolment is not available yet. Please contact KIA below to complete your enrolment.';message.focus();
  });
  child();
})();
