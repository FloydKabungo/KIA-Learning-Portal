/* New UI surfaces. Preview settings stay in this tab; no network writes. */
window.createKIARefreshAdmin = ctx => {
  'use strict';
  const {esc,actor,getState,openDialog,toast}=ctx;
  const Release=window.KIARelease;
  if(actor.role === 'mompreneur') {
    const notice=document.createElement('section');notice.className='refresh-panel';
    notice.innerHTML='<h2>Learning materials for your club</h2><p>View KIA lessons here for authorised facilitation. Do not download, record, copy or share course materials outside your licensed club.</p><a href="content-use.html">Read the content-use notice</a> <button class="button secondary" type="button">I understand</button>';
    document.querySelector('#admin-view').before(notice);
    notice.querySelector('button').addEventListener('click',()=>notice.remove());
  }
  let selectedCourse='robotics';
  function releaseView(){
    const courses=getState().courses,c=courses.find(x=>x.id===selectedCourse)||courses[0];
    if(!c)return '<h1>Course releases</h1><p>Create a course first.</p>';
    const cfg=Release.config(c);
    const field=(name,title,value,type='date',extra='')=>`<label class="release-field">${title}<input name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></label>`;
    return `<div class="view-heading"><div><h1>Course releases</h1><p>One release plan. Everyone moves forward together.</p></div></div><section class="refresh-panel"><label class="release-field">Choose a course<select id="release-course">${courses.map(x=>`<option value="${esc(x.id)}" ${x.id===c.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select></label><form id="release-form" data-course="${esc(c.id)}"><h2 style="margin-top:24px">Course availability</h2><div class="release-grid">${field('start','Course opens',cfg.start,'date','required')}${field('duration','Planned duration (days)',cfg.duration,'number','min="1" max="1095" required')}${field('end','Course closes (optional)',cfg.end)}</div><p class="release-date">Dates use South Africa time. Opening is at 00:00; closing is at the end of the selected day. Leave closing dates empty to allow catch-up.</p><button class="button secondary" type="button" data-calculate-end>Set closing date from duration</button><h2 style="margin-top:30px">Monthly learning blocks</h2><p>Choose exact dates or the number of days between blocks. Completion never delays a release.</p>${c.modules.map((m,i)=>{const b=cfg.blocks[m.id]||{},start=b.start||Release.addDays(cfg.start,i*30);return `<section class="release-block" data-block="${esc(m.id)}"><h3>Block ${i+1} · ${esc(m.title)}</h3><div class="release-grid">${field('block-start-'+m.id,'Opens',start,'date','required')}${field('block-end-'+m.id,'Closes (optional)',b.end||'')}${i?field('gap-'+m.id,'Days after previous block opens',Math.round((Date.parse(start)-Date.parse(cfg.blocks[c.modules[i-1].id]?.start||Release.addDays(cfg.start,(i-1)*30)))/86400000),'number','min="0" max="1095"'): '<p class="release-date">First block in this course.</p>'}</div><details><summary>Individual lesson dates (optional)</summary>${m.lessons.map(l=>`<div class="release-grid release-block"><strong>${esc(l.title)}</strong>${field('lesson-start-'+l.id,'Lesson opens',cfg.lessons[l.id]?.start||'')}${field('lesson-end-'+l.id,'Lesson closes',cfg.lessons[l.id]?.end||'')}</div>`).join('')}</details></section>`}).join('')}<p id="release-error" class="form-error" role="alert"></p><div class="release-actions"><button class="button" type="submit">Save release dates</button><span>Applies to learners and Mompreneurs.</span></div></form></section>`;
  }
  function enrolmentsView(){return `<div class="view-heading"><div><h1>Parent enrolments</h1><p>Review requests to join a KIA club.</p></div><a class="button secondary" href="signup.html">View sign-up page</a></div><section class="refresh-panel"><h2>Applications will appear here</h2><p>Review guardian details and confirm club placement.</p></section>`;}
  function achievementsView(){
    const list=getState().users.filter(u=>u.role==='learner'&&(actor.role==='admin'||u.branchId===actor.branchId));
    return `<div class="view-heading"><div><h1>Achievements & club rankings</h1><p>Recognise practice, learning and steady progress.</p></div></div><section class="refresh-panel"><div class="achievement-grid"><article class="achievement-card earned"><span class="badge-symbol">★</span><h3>Lesson explorer</h3><p>10 points per completed lesson, awarded once.</p></article><article class="achievement-card earned"><span class="badge-symbol">✦</span><h3>Quiz thinker</h3><p>Up to 20 points per quiz, based on the best result.</p></article><article class="achievement-card earned"><span class="badge-symbol">✓</span><h3>Course builder</h3><p>100 bonus points when a course is completed.</p></article></div><h2>Your learning community</h2><p>${list.length} learner profiles. Rankings are limited to each club and use aliases in the learner view. Learners can hide rankings through Display & comfort.</p></section>`;
  }
  document.addEventListener('change',e=>{
    if(e.target.id==='release-course'){selectedCourse=e.target.value;ctx.render();}
    const form=e.target.closest('#release-form'); if(!form)return;
    if(e.target.name.startsWith('gap-')){
      const blocks=[...form.querySelectorAll('[data-block]')],current=e.target.closest('[data-block]'),index=blocks.indexOf(current),prev=blocks[index-1];
      if(prev){const start=prev.querySelector('[name^="block-start-"]').value;const days=Number(e.target.value);if(start&&Number.isInteger(days)&&days>=0)current.querySelector('[name^="block-start-"]').value=Release.addDays(start,days);}
    }
  });
  document.addEventListener('click',e=>{
    if(!e.target.closest('[data-calculate-end]'))return;
    const form=document.querySelector('#release-form'),days=Number(form.elements.duration.value);
    if(form.elements.start.value&&Number.isInteger(days)&&days>0)form.elements.end.value=Release.addDays(form.elements.start.value,days-1);
  });
  document.addEventListener('submit',e=>{
    if(e.target.id!=='release-form')return;
    e.preventDefault();if(actor.role!=='admin')return;
    const f=e.target;if(!f.reportValidity())return;
    try{
      const data=new FormData(f),value={start:data.get('start'),end:data.get('end'),duration:Number(data.get('duration')),blocks:{},lessons:{}};
      const c=getState().courses.find(c=>c.id===f.dataset.course);
      if(value.end&&value.end<value.start)throw new Error('The course closing date must be on or after its opening date.');
      let previous=value.start;
      for(const m of c.modules){
        const b={start:data.get('block-start-'+m.id),end:data.get('block-end-'+m.id)};
        if(b.start<previous)throw new Error('Blocks must open in order, on or after the course start.');
        if(b.end&&b.end<b.start)throw new Error('A block cannot close before it opens.');
        if(value.end&&(b.start>value.end||(b.end&&b.end>value.end)))throw new Error('Block dates must fit within the course availability.');
        previous=b.start;value.blocks[m.id]=b;
        for(const l of m.lessons){const a={start:data.get('lesson-start-'+l.id)||'',end:data.get('lesson-end-'+l.id)||''};
          if(a.start&&a.start<b.start)throw new Error('A lesson cannot open before its block.');
          if(a.end&&a.end<(a.start||b.start))throw new Error('A lesson cannot close before it opens.');
          const bound=b.end||value.end;if(bound&&((a.start&&a.start>bound)||(a.end&&a.end>bound)))throw new Error('Lesson dates must fit within their block and course.');
          value.lessons[l.id]=a;
        }
      }
      Release.save(c.id,value);toast('Release dates saved.');
    }catch(error){f.querySelector('#release-error').textContent=error.message;}
  });
  return {releaseView,enrolmentsView,achievementsView};
};
