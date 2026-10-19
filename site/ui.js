const header=document.querySelector('.site-header');
if(header){
 const syncHeader=()=>{
  document.documentElement.style.setProperty('--header-height',`${Math.ceil(header.getBoundingClientRect().height)}px`);
  header.classList.toggle('is-scrolled',window.scrollY>12);
 };
 new ResizeObserver(syncHeader).observe(header);
 window.addEventListener('scroll',()=>header.classList.toggle('is-scrolled',window.scrollY>12),{passive:true});
 syncHeader();
}
// Keep keyboard focus clear of both persistent navigation bars.
document.addEventListener('focusin',event=>{
 if(document.querySelector('dialog[open]'))return;
 const bar=document.querySelector('.mobile-cta'),target=event.target;
 if(!(target instanceof HTMLElement)||target.matches('main,.skip-link')||header?.contains(target)||bar?.contains(target))return;
 requestAnimationFrame(()=>{
  const rect=target.getBoundingClientRect(),headerBottom=header?.getBoundingClientRect().bottom||0;
  if(rect.top<headerBottom+12)window.scrollBy({top:rect.top-headerBottom-20,behavior:'instant'});
  else if(bar&&matchMedia('(max-width: 700px)').matches){
   const top=bar.getBoundingClientRect().top;
   if(rect.bottom>top-12)window.scrollBy({top:rect.bottom-top+20,behavior:'instant'});
  }
 });
});
