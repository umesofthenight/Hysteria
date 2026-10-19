import {escapeHTML,archiveURL,headingId} from '/reference.js';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const reader = $('#reader');
const cache = new Map();
let documents = [];
let pathways = [];
let category = 'All';
let currentPathway = 'Fool';
let requestId = 0;
let showAll = false;
let previousFocus;
const initialMetadata={title:document.title,description:$('meta[name="description"]').content,canonical:$('link[rel="canonical"]').href};
const params=new URLSearchParams(location.search);
function syncURL(values){const url=new URL(location.href);Object.entries(values).forEach(([key,value])=>{value?url.searchParams.set(key,value):url.searchParams.delete(key);});history.replaceState(null,'',url);}

async function loadReference(id, pathway) {
  if(!cache.has(id)){
    const response=await fetch(archiveURL(id));
    if(!response.ok)throw new Error('This reference could not be loaded.');
    cache.set(id,await response.text());
  }
  const page=new DOMParser().parseFromString(cache.get(id),'text/html');
  const content=page.querySelector('[data-reference-content]');
  if(!content)throw new Error('Reference content is unavailable.');
  if(pathway){
    const heading=content.querySelector(`#${headingId(pathway.name+' Pathway')}`);
    let sequence=heading?.nextElementSibling;
    while(sequence&&!/^H[12]$/.test(sequence.tagName)&&!/^Sequence 9:/.test(sequence.textContent))sequence=sequence.nextElementSibling;
    if(!sequence||!/^Sequence 9:/.test(sequence.textContent))throw new Error('Sequence is unavailable.');
    const excerpt=document.createElement('div');
    for(let node=sequence.nextElementSibling;node&&!/^H[123]$/.test(node.tagName);node=node.nextElementSibling)excerpt.append(node.cloneNode(true));
    content.replaceChildren(...excerpt.childNodes);
  }
  const headings=[...content.querySelectorAll('h2,h3,h4,h5,h6')].map(h=>({id:h.id,text:h.textContent}));
  content.querySelectorAll('h2,h3,h4,h5').forEach(h=>{
    const next=document.createElement(`h${Number(h.tagName[1])+1}`);
    for(const attr of h.attributes)next.setAttribute(attr.name,attr.value);
    next.innerHTML=h.innerHTML;h.replaceWith(next);
  });
  return {html:content.innerHTML,headings};
}
function showDialog(dialog) {
  previousFocus=document.activeElement;
  dialog.showModal();dialog.scrollTop=0;
}
function closeDialog(dialog) {dialog.close();previousFocus?.focus();}
async function openReader(id, startingPathway) {
  const request=++requestId;
  const doc=documents.find(d=>d.id===id);
  $('#reader-title').textContent=startingPathway?`${startingPathway.sequence} abilities`:doc?.title || id.replaceAll('-',' ');
  $('#reader-category').textContent=startingPathway?`${startingPathway.name} pathway · Sequence 9`:`Hysteria archive${doc?' · '+doc.category:''}`;
  const title=startingPathway?`${startingPathway.sequence} abilities`:doc?.title || id.replaceAll('-',' ');
  const pageURL=archiveURL(id)+(startingPathway?`#${headingId(startingPathway.name+' Pathway')}`:'');
  $('#reader-page').href=pageURL;
  $('#reader-breadcrumb').textContent=title;
  document.title=`${title} | Hysteria Archive`;
  $('meta[name="description"]').content=doc?.summary || `Read ${title} in the Hysteria roleplay archive.`;
  $('link[rel="canonical"]').href=new URL(pageURL,location.origin).href;
  syncURL({reference:id,sequence:startingPathway?.name});
  $('#reader-body').setAttribute('aria-busy','true');
  $('#reader-body').innerHTML='<p>Opening the reference…</p>';
  $('#reader-toc').replaceChildren();
  if(!reader.open)showDialog(reader);
  try {
    const rendered=await loadReference(id,startingPathway);
    if(request!==requestId||!reader.open)return;
    $('#reader-body').innerHTML=rendered.html;
    $('#reader-toc').innerHTML=rendered.headings.map(h=>`<a href="#${h.id}">${escapeHTML(h.text)}</a>`).join('');
    if(!rendered.headings.length)$('#reader-toc').innerHTML='<a href="#reader-title">Overview</a>';
    $('#reader-body').setAttribute('aria-busy','false');
    $('#reader-title').focus({preventScroll:true});
  } catch {
    if(request!==requestId||!reader.open)return;
    $('#reader-body').setAttribute('aria-busy','false');
    $('#reader-body').innerHTML='<p role="alert">This reference could not be loaded. Check your connection and try again, or use Open full page.</p>';
  }
}
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-read]');
  if(link&&documents.length&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&event.button===0){event.preventDefault();openReader(link.dataset.read);}
});
reader.addEventListener('close',()=>{
  ++requestId;document.title=initialMetadata.title;$('meta[name="description"]').content=initialMetadata.description;$('link[rel="canonical"]').href=initialMetadata.canonical;syncURL({reference:null,sequence:null});
});
$('#reader-close').addEventListener('click',()=>closeDialog(reader));
for(const dialog of [reader]){
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}});
  dialog.addEventListener('close',()=>previousFocus?.focus());
}

const summaries={
  Fool:'Enhanced memory, heightened spirituality, Spirit Vision and an intuition for danger. Divination is a talent you must still learn to use.',
  Error:'Nimble hands, enhanced observation and the skills of a thief. A Marauder begins by finding what others would rather keep hidden.',
  Door:'Open a passage through obstacles and sense the spirituality around you. An Apprentice learns that a closed door is rarely the end.',
  Darkness:'Remain lucid at night and need less sleep. A Sleepless grows stronger when darkness falls.'
};
function updatePathway(){
  currentPathway=$('#pathway-select').value;
  const pathway=pathways.find(p=>p.name===currentPathway);
  if(!pathway)return;
  $('#pathway-name').textContent=pathway.sequence.split(' (')[0];
  $('#pathway-sequence').textContent=`Sequence 9 · ${pathway.name} pathway`;
  $('#pathway-summary').textContent=summaries[currentPathway] || `Discover the traits and abilities of a ${pathway.sequence}, the first Sequence on the ${pathway.name} pathway.`;
  $('#pathway-read').textContent=`Read the ${pathway.sequence.split(' (')[0]} abilities`;
  $('#pathway-read').href=`${archiveURL('all-pathway-abilities')}#${headingId(pathway.name+' Pathway')}`;
}
$('#pathway-select').addEventListener('change',()=>{updatePathway();syncURL({pathway:currentPathway==='Fool'?null:currentPathway});});
$('#pathway-read').addEventListener('click',event=>{if(!pathways.length||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0)return;event.preventDefault();openReader('all-pathway-abilities',pathways.find(p=>p.name===currentPathway));});

const states=[
  {min:96,max:100,name:'Superior Clarity',description:'Achievable only through rituals, potion effects, treatments or special abilities.'},
  {min:80,max:95,name:'Stable',description:'A normal, functioning state. The usual natural recovery cap is 95.'},
  {min:65,max:79,name:'Restrained',description:'Minor symptoms: poor sleep, irritability and slight paranoia.'},
  {min:40,max:64,name:'Unstable',description:'Hallucinations, intrusive thoughts and emotional volatility can impair judgement.'},
  {min:20,max:39,name:'Fractured',description:'Symptoms become more severe. Treatment or solid anchors are needed to function.'},
  {min:10,max:19,name:'Half-Mad',description:'The character remains playable, but dangerous instability may require GM intervention.'},
  {min:1,max:9,name:'Critical',description:'Near loss of control. Random actions, obsessions and violent impulses overwhelm the character.'},
  {min:0,max:0,name:'Loss of Control',description:'The character is lost. In Hysteria’s sanity system, reaching zero means death.'}
];
$('#sanity-range').addEventListener('input',event=>{
  const value=Number(event.target.value), state=states.find(s=>value>=s.min&&value<=s.max);
  $('#sanity-output').value=value;
  $('#sanity-state').textContent=state.name;
  $('#sanity-explanation').textContent=`${state.min===state.max?state.min:`${state.min}–${state.max}`}. ${state.description}`;
  event.target.setAttribute('aria-valuetext',`${value}, ${state.name}`);
});

function renderArchive(){
  const query=$('#archive-query').value.trim().toLowerCase();
  const filtered=documents.filter(d=>(category==='All'||d.category===category)&&`${d.title} ${d.category} ${d.summary}`.toLowerCase().includes(query));
  const visible=showAll?filtered:filtered.slice(0,8);
  $('#result-count').textContent=`${visible.length<filtered.length?`Showing ${visible.length} of `:''}${filtered.length} ${filtered.length===1?'reference':'references'}${category==='All'?'':` in ${category.toLowerCase()}`}`;
  $('#archive-list').innerHTML=filtered.length?visible.map(d=>`<a class="archive-row" href="${archiveURL(d.id)}" data-read="${d.id}"><div><strong>${escapeHTML(d.title)}</strong><p>${escapeHTML(d.summary)}</p></div><span>${d.category}</span></a>`).join(''):'<p class="no-results">No references found. Try another title or choose All.</p>';
  $('#archive-more').hidden=visible.length>=filtered.length;
  $('#archive-more').textContent=`Show all ${filtered.length} references`;
}
$('#archive-query').addEventListener('input',()=>{showAll=false;renderArchive();syncURL({q:$('#archive-query').value.trim(),all:null});});
$('#archive-more').addEventListener('click',()=>{showAll=true;renderArchive();syncURL({all:'1'});});
$$('[data-category]').forEach(button=>button.addEventListener('click',()=>{
  category=button.dataset.category;
  showAll=false;
  syncURL({category:category==='All'?null:category,all:null});
  $$('[data-category]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  renderArchive();
}));

Promise.all([fetch('/content/index.json').then(r=>{if(!r.ok)throw Error();return r.json();}),fetch('/content/pathways.json').then(r=>{if(!r.ok)throw Error();return r.json();})]).then(([docs,paths])=>{
  documents=docs;pathways=paths;
  const preferred=['Fool','Error','Door','Darkness'];
  pathways.sort((a,b)=>{const ai=preferred.indexOf(a.name),bi=preferred.indexOf(b.name);return (ai<0?100:ai)-(bi<0?100:bi);});
  $('#pathway-select').innerHTML=pathways.map(p=>`<option value="${escapeHTML(p.name)}">${escapeHTML(p.name)}</option>`).join('');
  if(paths.some(p=>p.name===params.get('pathway')))$('#pathway-select').value=params.get('pathway');
  if(['World','Pathways','Mysticism','Systems'].includes(params.get('category')))category=params.get('category');
  $('#archive-query').value=params.get('q')||'';showAll=params.get('all')==='1';
  $$('[data-category]').forEach(b=>{b.classList.toggle('active',b.dataset.category===category);b.setAttribute('aria-pressed',String(b.dataset.category===category));});
  updatePathway();renderArchive();
  if(docs.some(d=>d.id===params.get('reference')))openReader(params.get('reference'),params.get('sequence')?paths.find(p=>p.name===params.get('sequence')):undefined);
}).catch(()=>{
  $('#result-count').textContent='The collection could not be loaded.';
  $('#archive-list').innerHTML='<p class="no-results">Try refreshing, or <a class="text-link" href="/archive/">browse the archive directly</a>.</p>';
});
