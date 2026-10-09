/* Frontend achievements derived from sample progress. Live points must be server awarded. */
(async()=>{
  'use strict';
  await window.KIALearnerReady; if(!window.KIALearner)return;
  const esc=window.KIASecurity.escapeHTML,actor=window.KIALearner;
  const calculate=(user,state)=>{
    let lessons=0,quizPoints=0,courseBonuses=0,quizTotal=0,quizCount=0;
    for(const c of state.courses.filter(c=>user.courseIds?.includes(c.id))){
      const p=window.KIALearning.readCourseProgress(user.id,c.id,state);lessons+=p.completed.size;
      for(const score of Object.values(p.quizScores)){const s=Math.min(100,Math.max(0,Number(score)||0));quizPoints+=Math.round(s/5);quizTotal+=s;quizCount++;}
      if(p.total&&p.completed.size===p.total)courseBonuses+=100;
    }
    return {points:lessons*10+quizPoints+courseBonuses,lessons,quizCount,quizAverage:quizCount?Math.round(quizTotal/quizCount):null,courseBonuses};
  };
  let mode='completion';
  const host=document.querySelector('#achievements-view');
  const nav=document.querySelector('.student-nav,.primary-nav');
  if(nav&&!nav.querySelector('[href="achievements.html"]'))nav.insertAdjacentHTML('beforeend','<a href="achievements.html"><span>Achievements</span></a>');
  if(host)nav?.querySelectorAll('a').forEach(a=>{a.classList.remove('active');a.removeAttribute('aria-current');if(a.getAttribute('href')==='achievements.html')a.setAttribute('aria-current','page');});
  function render(){
    const state=window.KIAAdminData.read(),own=calculate(actor,state);
    const banner=`<div class="reward-points"><img src="Assets/learner/badge-star.svg" alt=""/><div><b>${own.points}</b><span> points</span></div></div><a class="button secondary" href="achievements.html">My badges →</a>`;
    let small=document.querySelector('#reward-summary');
    if(!host&&!small&&document.querySelector('.student-dashboard-wrap')){small=document.createElement('section');small.id='reward-summary';small.className='rewards-banner';document.querySelector('.student-dashboard-wrap').prepend(small);}
    if(small)small.innerHTML=banner;
    if(!host)return;
    const list=state.users.filter(u=>u.role==='learner'&&u.branchId===actor.branchId&&u.id!==actor.id);
    const ranks=[...list.map((u,i)=>({...calculate(u,state),alias:'Explorer '+String(i+1).padStart(2,'0'),id:u.id})),{...own,alias:'You',id:actor.id}];
    const metric=r=>mode==='completion'?r.lessons:r.quizAverage??-1;
    ranks.sort((a,b)=>metric(b)-metric(a)||a.alias.localeCompare(b.alias));
    let previous=null,rank=0;
    const boardOpen = host.querySelector('.club-board')?.open || false;
    host.innerHTML=`<div class="page-heading"><div><h1>My achievements<span>.</span></h1><p class="page-intro">Every step counts.</p></div></div><div class="rewards-banner">${banner.replace('<a class="button secondary" href="achievements.html">My badges →</a>','<a class="button secondary" href="my-learning.html">Keep exploring →</a>')}</div><div class="achievement-grid">${[['badge-star','First discovery',own.lessons>=1,'1 lesson'],['badge-brain','Curious thinker',own.quizCount>=1,'1 quiz'],['badge-trophy','Course builder',own.courseBonuses>0,'1 course']].map(([art,title,earned,note])=>`<article class="achievement-card ${earned?'earned':''}"><img src="Assets/learner/${art}.svg" alt=""/><h2>${title}</h2><span class="visual-badge-state">${earned?'✓ Earned':note+' to unlock'}</span></article>`).join('')}</div><details class="visual-details"><summary>How to earn points</summary><div class="point-options"><div><strong>+10</strong><span>Lesson</span></div><div><strong>Up to 20</strong><span>Quiz</span></div><div><strong>+100</strong><span>Full course</span></div></div><p>Each achievement counts once. Quiz points use your best score.</p></details><details class="visual-details club-board" data-rankings-panel ${boardOpen?'open':''}><summary>Club rankings</summary><div class="reward-tabs" role="group" aria-label="Rankings by"><button data-rank-mode="completion" aria-pressed="${mode==='completion'}">Lessons</button><button data-rank-mode="quiz" aria-pressed="${mode==='quiz'}">Quizzes</button></div>${ranks.map((r,i)=>{const v=metric(r);if(v!==previous){rank=i+1;previous=v;}return `<div class="rank-row ${r.id===actor.id?'is-you':''}"><strong>${mode==='quiz'&&r.quizAverage===null?'—':rank}</strong><img class="rank-avatar" src="Assets/learner/${r.id===actor.id?'badge-star':'robot'}.svg" alt=""/><span><strong>${esc(r.alias)}</strong><small>${r.points} points</small></span><strong>${mode==='completion'?r.lessons+' lessons':r.quizAverage===null?'Not tried':r.quizAverage+'%'}</strong></div>`;}).join('')}<p class="release-date">Same score, same rank.</p></details>`;
    window.KIADisplay?.apply();
  }
  document.addEventListener('click',e=>{const t=e.target.closest('[data-rank-mode]');if(t){mode=t.dataset.rankMode;render();document.querySelector(`[data-rank-mode="${mode}"]`)?.focus();}});
  window.addEventListener('kia-progress-preview',render);window.addEventListener('pageshow',render);render();
})();
