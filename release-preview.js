/* Frontend release-date preview only. Production must enforce release windows on the server.
   No roles, private learner data, credentials or backend documents are written here. */
(() => {
  'use strict';
  const KEY='kia-release-design-v1';
  let saved={}; try { saved=JSON.parse(sessionStorage.getItem(KEY)||'{}'); } catch {}
  const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const dateMS=d=>Date.parse(d+'T00:00:00+02:00');
  const addDays=(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
  const label=d=>d ? new Date(d+'T12:00:00Z').toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Johannesburg'}) : 'No closing date';
  const initial=()=>today().slice(0,8)+'01';
  function config(course) {
    const value=saved[course.id]||{};
    return { start:value.start||initial(), end:value.end||'', duration:value.duration||Math.max(30,(course.modules?.length||1)*30), blocks:value.blocks||{}, lessons:value.lessons||{} };
  }
  function windowFor(course,moduleIndex,lessonId) {
    const c=config(course), m=course.modules?.[moduleIndex], block=c.blocks[m?.id]||{};
    const start=block.start||addDays(c.start,moduleIndex*30),end=block.end||'';
    const lesson=c.lessons[lessonId]||{};
    const starts=[c.start,start,lesson.start].filter(Boolean).sort();
    const ends=[c.end,end,lesson.end].filter(Boolean).sort();
    return {start:starts.at(-1),end:ends[0]||''};
  }
  function status(course,moduleIndex=0,lessonId,now=Date.now()) {
    const w=windowFor(course,moduleIndex,lessonId);
    const closed=!!w.end&&now>=dateMS(addDays(w.end,1));
    const pending=now<dateMS(w.start);
    return {...w,open:!closed&&!pending,label:closed?'Closed':pending?'Locked':'Available',message:closed?'Closed on '+label(w.end):pending?'Opens '+label(w.start):w.end?'Available until '+label(w.end):'Available now'};
  }
  function lessonStatus(id,courseId='robotics') {
    const course=window.KIAAdminData?.read().courses.find(c=>c.id===courseId);
    if(!course)return {open:false,label:'Unavailable',message:'Course unavailable'};
    const mi=course.modules.findIndex(m=>m.lessons.some(l=>l.id===id));
    return mi<0?{open:false,label:'Unavailable',message:'Lesson unavailable'}:status(course,mi,id);
  }
  function save(courseId,value) {
    saved[courseId]=value;
    try {sessionStorage.setItem(KEY,JSON.stringify(saved));} catch {throw new Error('Your changes could not be saved. Allow browser storage and retry.');}
    window.dispatchEvent(new Event('kia-design-v2-release-preview'));
  }
  window.KIARelease={config,status,lessonStatus,save,label,addDays,today};
})();
