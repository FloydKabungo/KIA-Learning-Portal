/* Visual lesson composer using the existing local content preview. */
window.mountKIALessonStudio=(form,lesson,richEditor,courseId)=>{
  'use strict';
  let videoURL='',subtitleURL='';
  const preview=form.querySelector('.studio-preview'),status=form.querySelector('.studio-status');
  const cleanup=()=>{window.KIAPlayer?.dispose(preview);if(videoURL)URL.revokeObjectURL(videoURL);if(subtitleURL)URL.revokeObjectURL(subtitleURL);videoURL='';subtitleURL='';};
  const dialog=form.closest('dialog');dialog.addEventListener('close',cleanup,{once:true});
  function show(){
    const video=form.elements.studioVideo.files[0],image=form.elements.studioImage.files[0];
    cleanup();preview.replaceChildren();
    if(video){const v=document.createElement('video');videoURL=URL.createObjectURL(video);v.src=videoURL;v.controls=true;v.preload='metadata';v.playsInline=true;v.controlsList='nodownload';preview.append(v);
      if(form.elements.subtitles.value.trim()){subtitleURL=URL.createObjectURL(new Blob([form.elements.subtitles.value],{type:'text/vtt'}));const t=document.createElement('track');t.kind='captions';t.label='English';t.srclang='en';t.src=subtitleURL;t.default=true;v.append(t);}
    }else if(image){const img=document.createElement('img');videoURL=URL.createObjectURL(image);img.src=videoURL;img.alt=form.elements.title.value||'Lesson image preview';preview.append(img);}
    else if(form.elements.resourceId.value || form.elements.url.value.trim()){
      const item=form.elements.resourceId.value ? window.KIAAdminData.read().content.find(r=>r.id===form.elements.resourceId.value) : {courseId,source:'url',type:form.elements.type.value,url:form.elements.url.value.trim()};
      if(item)window.KIAPlayer.resource(preview,{...item,subtitles:form.elements.subtitles.value});
    }
    else {const span=document.createElement('span');span.textContent='▷';span.setAttribute('aria-hidden','true');const p=document.createElement('p');p.textContent=form.elements.title.value||'Your lesson preview';preview.append(span,p);}
  }
  form.querySelectorAll('[data-studio-focus]').forEach(b=>b.addEventListener('click',()=>{const target=form.elements[b.dataset.studioFocus];if(!target)return;target.scrollIntoView({block:'center'});target.focus();if(target.type==='file')target.click();}));
  for (const [selector,type] of [['[data-studio-video-source]','Video'],['[data-studio-embed]','Embedded']]) form.querySelector(selector).addEventListener('click',()=>{form.elements.type.value=type;form.elements.type.dispatchEvent(new Event('change'));form.elements.url.scrollIntoView({block:'center'});form.elements.url.focus();});
  form.querySelector('[data-studio-paragraph]').addEventListener('click',()=>richEditor.addParagraph());
  form.querySelector('[data-studio-button]').addEventListener('click',()=>richEditor.addButton());
  form.querySelector('[data-studio-quiz]').addEventListener('click',()=>{form.elements.type.value='Quiz';form.elements.type.dispatchEvent(new Event('change'));form.querySelector('.quiz-builder').scrollIntoView({block:'center'});});
  form.querySelector('[data-studio-preview]').addEventListener('click',()=>{show();const textPreview=form.querySelector('.studio-content-preview');textPreview.hidden=false;textPreview.innerHTML=window.KIARichContent.render(richEditor.read());status.textContent='Preview updated. Save to keep your changes.';});
  for(const field of ['studioVideo','studioImage'])form.elements[field].addEventListener('change',async()=>{
    const input=form.elements[field],file=input.files[0];if(!file)return;
    try{await window.KIASecurity.validateFile(file,field==='studioVideo'?'Video':file.type==='image/gif'?'GIF':'Image');form.elements.type.value=field==='studioVideo'?'Video':file.type==='image/gif'?'GIF':'Images';form.elements.type.dispatchEvent(new Event('change'));if(field==='studioVideo')form.elements.studioImage.value='';else form.elements.studioVideo.value='';show();status.textContent=file.name+' · ready';}catch(error){status.textContent=error.message;input.value='';}
  });
  form.elements.studioCaptions.addEventListener('change',async()=>{const f=form.elements.studioCaptions.files[0];if(!f)return;try{if(f.size>1024*1024)throw new Error('Use a WebVTT subtitle file smaller than 1 MB.');const text=await f.text();if(!text.trimStart().startsWith('WEBVTT'))throw new Error('Choose a valid .vtt file starting with WEBVTT.');form.elements.subtitles.value=text;show();status.textContent='Subtitles added. Use the CC control in the video preview.';}catch(error){status.textContent=error.message;form.elements.studioCaptions.value='';}});
  show();
  return async data=>{
    const subtitles=form.elements.subtitles.value.trim();if(subtitles&&!subtitles.startsWith('WEBVTT'))throw new Error('Subtitles must start with WEBVTT.');
    if(subtitles.length>100000)throw new Error('Keep subtitle text under 100,000 characters.');
    return {subtitles,transcript:form.elements.transcript.value.trim(),imageAlt:form.elements.imageAlt.value.trim()};
  };
};
