export const escapeHTML = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const cleanText = text => String(text)
  .replace(/^\[[^\]\r\n]*・[^\]\r\n]*\]\s*\r?\n/, '')
  .replace(/^[\t ]*:Line(?:Top|Middle|Bottom):[\t ]*/gmi, '- ')
  .replace(/:Pound:/g, '£')
  .replace(/<a?:[A-Za-z0-9_]+:\d+>|:[A-Za-z_][A-Za-z0-9_]*:/g, '')
  .replace(/\s*\u2014\s*/g, ': ');
export const headingId = text => cleanText(text).replace(/[\*_`]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'section';
export const archiveURL = id => `/archive/${id}/`;
const localTopics = {
  'Spirit World':'the-world#spirit-world','Astral World':'the-world#astral-world','Physical World':'the-world#physical-world',
  Underworld:'the-world#underworld','Mind World':'the-world#mind-world','Mirror World':'the-world#mirror-world',
  Pathways:'all-pathway-abilities',Sequence:'all-pathway-abilities','Acting Method':'resonance-record',
  Soul:'soul',Symbolism:'symbolism',Sefirot:'sefirot',Pillars:'pillars',Gods:'gods','Orthodox Gods':'gods',
  Families:'families','Cards of Blasphemy':'cards-of-blasphemy','Secret Organizations':'secret-organizations',
  'Ritualistic Magic':'ritualistic-magic','Divination Art':'divination-art','Honorific Names':'honorific-names',
  'Above the Sequence':'above-the-sequence','Above The Sequence':'above-the-sequence','Laws of Mysticism':'laws-of-mysticism'
};
export function localLink(url) {
  if(!url.startsWith('https://lordofthemysteries.fandom.com/wiki/'))return url;
  let topic;
  try{topic=decodeURIComponent(url.split('/wiki/')[1].split('#')[0]).replaceAll('_',' ');}catch{return url;}
  if(localTopics[topic]){
    const [id,anchor]=localTopics[topic].split('#');return archiveURL(id)+(anchor?`#${anchor}`:'');
  }
  const pathway=topic.match(/^(.+?) Pathway(?:\/Abilities)?$/);
  if(pathway)return `${archiveURL('all-pathway-abilities')}#${headingId(pathway[1]+' Pathway')}`;
  return url;
}
export function inline(text) {
  const saved=[];
  let output=cleanText(text).replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/|#)(?:[^\s()]|\([^)]*\))+)(?:\s+"[^"]*")?\)/g,(_,label,url)=>{
    const target=localLink(url.replace(/\\([()])/g,'$1'));
    const external=/^https?:/.test(target);
    saved.push(`<a href="${escapeHTML(target)}"${external?' target="_blank" rel="noopener noreferrer"':''}>${escapeHTML(label)}${external?'<span class="sr-only"> (opens in a new tab)</span>':''}</a>`);
    return `LINKTOKEN${saved.length-1}ENDTOKEN`;
  });
  output=escapeHTML(output)
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/__([^_]+)__/g,'<strong>$1</strong>')
    .replace(/`([^`]+)`/g,'<code>$1</code>').replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'<em>$1</em>')
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g,'<em>$1</em>')
    .replace(/LINKTOKEN(\d+)ENDTOKEN/g,(_,i)=>saved[Number(i)]);
  return output;
}
function accessibleTable(lines,label) {
  const rows=[];let cells=[];
  const flush=()=>{if(cells.some(Boolean)){rows.push(cells.map(c=>c.trim()));cells=[];}};
  for(const line of lines){
    if(/[╠╚├└]/.test(line[0])){flush();continue;}
    if(!/^[║│]/.test(line.trim()))continue;
    const columns=line.trim().split(/[║│]/).slice(1,-1).map(c=>c.trim());
    columns.forEach((column,index)=>{cells[index]=(cells[index]?cells[index]+' ':'')+column;});
  }
  flush();
  if(!rows.length)return `<pre tabindex="0" role="region" aria-label="${escapeHTML(label)}">${escapeHTML(lines.join('\n'))}</pre>`;
  const count=Math.max(...rows.map(row=>row.length));
  const cell=(row,tag)=>Array.from({length:count},(_,i)=>`<${tag}${tag==='th'?' scope="col"':` data-label="${escapeHTML(rows[0][i]||'Value')}"`}>${inline(row[i]||'')}</${tag}>`).join('');
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${escapeHTML(label)}"><table><caption class="sr-only">${escapeHTML(label)}</caption><thead><tr>${cell(rows[0],'th')}</tr></thead><tbody>${rows.slice(1).map(row=>`<tr>${cell(row,'td')}</tr>`).join('')}</tbody></table></div>`;
}
export function renderMarkdown(source,{baseLevel=2}={}) {
  const lines=cleanText(source).replace(/\r/g,'').split('\n'), headings=[], ids=new Map();
  const levels=lines.map(l=>l.match(/^(#{1,6})\s+/)?.[1].length).filter(Boolean), firstLevel=Math.min(...levels,6);
  let html='', paragraph=[], list=null, pre=[], table=[], fenced=false,tableCount=0,preCount=0,lastHeading='Reference';
  const flushParagraph=()=>{if(paragraph.length){html+=`<p>${inline(paragraph.join(' '))}</p>`;paragraph=[];}};
  const closeList=()=>{if(list){html+=`</${list}>`;list=null;}};
  const flushPre=()=>{if(pre.length){html+=`<pre tabindex="0" role="region" aria-label="${escapeHTML(lastHeading)}, reference excerpt ${++preCount}"><code>${escapeHTML(pre.join('\n'))}</code></pre>`;pre=[];}};
  const flushTable=()=>{if(table.length){html+=accessibleTable(table,`${lastHeading}, table ${++tableCount}`);table=[];}};
  for(const line of lines){
    if(/^```/.test(line)){flushParagraph();closeList();if(fenced)flushPre();fenced=!fenced;continue;}
    if(fenced){pre.push(line);continue;}
    if(/^[╔╠╚║╬╦╩═┌└├│┼┬┴─]/.test(line)){flushParagraph();closeList();table.push(line);continue;}
    flushTable();
    const heading=line.match(/^(#{1,6})\s+(.+)/);
    if(heading){
      flushParagraph();closeList();
      const text=heading[2].replace(/[\*_`]/g,'').trim(), level=Math.min(6,baseLevel+heading[1].length-firstLevel);
      lastHeading=text;
      const key=headingId(text), count=ids.get(key)||0;ids.set(key,count+1);const id=key+(count?`-${count+1}`:'');
      html+=`<h${level} class="source-section" id="${id}" tabindex="-1">${inline(text)}</h${level}>`;
      headings.push({level:heading[1].length,text,id});continue;
    }
    if(!line.trim()||/^[━─═\s]{3,}$/.test(line)){flushParagraph();closeList();continue;}
    const item=line.match(/^\s*([-*]|\d+\.)\s+(.+)/);
    if(item){flushParagraph();const kind=/\d/.test(item[1])?'ol':'ul';if(list!==kind){closeList();html+=`<${kind}>`;list=kind;}html+=`<li>${inline(item[2])}</li>`;continue;}
    closeList();
    if(/^>\s?/.test(line)){flushParagraph();html+=`<blockquote>${inline(line.replace(/^>\s?/,''))}</blockquote>`;continue;}
    paragraph.push(line.trim());
  }
  flushParagraph();closeList();flushPre();flushTable();
  return {html,headings:headings.filter(h=>h.level===firstLevel)};
}
