const UA='Mozilla/5.0 (compatible; PublicEvidenceResearch/1.0)';
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,OPTIONS'};
const cats=[
 ['法院/判决',['法院','裁判','判决','民初','民终','案号','诉讼']],['执行风险',['执行','被执行人','限制高消费','失信']],['政府/监管',['政府','市场监督','行政处罚','信用中国','公示']],['工商线索',['企业信用','法定代表人','股东','统一社会信用代码','工商']],['新闻/官网',['新闻','官网','公告','采访','活动']],['人物/职业',['董事','经理','创始人','CEO','员工','任职']]
];
function catOf(t){for(const [c,ks] of cats)if(ks.some(k=>t.includes(k)))return c;return '其他公开资料'}
function authority(url){let d='';try{d=new URL(url).hostname}catch{};if(/court\.gov\.cn|gov\.cn|samr\.gov\.cn|creditchina\.gov\.cn|sse\.com\.cn|szse\.cn/.test(d))return ['一级','高'];if(/people\.com\.cn|xinhuanet\.com|thepaper\.cn|caixin\.com|21jingji\.com/.test(d))return ['二级','中高'];return ['三级','中']}
function strip(s=''){return s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim()}
function domain(u){try{return new URL(u).hostname}catch{return ''}}
function decodeXml(s=''){return strip(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1'))}
async function bingRss(q){
 const u='https://www.bing.com/search?format=rss&count=10&q='+encodeURIComponent(q);
 const r=await fetch(u,{headers:{'User-Agent':UA,'Accept':'application/rss+xml,text/xml'}});if(!r.ok)throw new Error('bing '+r.status);const x=await r.text();const items=[...x.matchAll(/<item>([\s\S]*?)<\/item>/gi)];return items.map(m=>{const z=m[1];const g=t=>{const mm=z.match(new RegExp(`<${t}>([\\s\\S]*?)<\\/${t}>`,'i'));return mm?decodeXml(mm[1]):''};return {title:g('title'),url:g('link'),snippet:g('description')}}).filter(a=>a.url)
}
async function ddg(q){
 const u='https://html.duckduckgo.com/html/?q='+encodeURIComponent(q);const r=await fetch(u,{headers:{'User-Agent':UA}});if(!r.ok)throw new Error('ddg '+r.status);const h=await r.text();const re=/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;const arr=[];for(const m of h.matchAll(re))arr.push({url:m[1],title:strip(m[2]),snippet:strip(m[3])});return arr
}
async function oneSearch(q){try{const a=await bingRss(q);if(a.length)return a}catch{}try{return await ddg(q)}catch{return []}}
function buildQueries(q){return [q,`"${q}" 法院 判决 民初 民终`,`"${q}" 执行 限制高消费 失信`,`"${q}" 行政处罚 市场监督`,`"${q}" 法定代表人 股东 工商`,`"${q}" 新闻 官网`].slice(0,6)}
function entityType(q){if(/公司|集团|企业|中心|事务所|学校|医院|银行|科技|教育|咨询/.test(q))return '公司/机构';if(/[（(]20\d{2}[）)].*民/.test(q))return '案号';if(q.trim().split(/\s+/).length<=3&&q.length<=12)return '人物/短名称';return '待确认'}
function extractDate(s){const m=s.match(/(20\d{2})[-年/.](0?[1-9]|1[0-2])[-月/.](0?[1-9]|[12]\d|3[01])/);return m?`${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`:''}
export default {async fetch(req,env,ctx){if(req.method==='OPTIONS')return new Response('',{headers:CORS});const url=new URL(req.url);if(url.pathname==='/health')return Response.json({ok:true,service:'public-evidence-search',free_mode:true},{headers:CORS});if(url.pathname!=='/api/search')return new Response('Not found',{status:404,headers:CORS});const q=(url.searchParams.get('q')||'').trim();if(!q)return Response.json({error:'missing q'},{status:400,headers:CORS});
 const queries=buildQueries(q);const batches=await Promise.all(queries.map(oneSearch));const seen=new Set(), results=[];for(const arr of batches){for(const r of arr){let u=r.url;try{const parsed=new URL(u);const uddg=parsed.searchParams.get('uddg');if(uddg)u=decodeURIComponent(uddg)}catch{}if(!u||seen.has(u))continue;seen.add(u);const text=`${r.title} ${r.snippet}`;const [a,c]=authority(u);results.push({title:r.title||u,url:u,snippet:r.snippet||'',domain:domain(u),category:catOf(text),authority:a,confidence:c,date:extractDate(text)});if(results.length>=40)break}if(results.length>=40)break}
 results.sort((x,y)=>({一级:3,二级:2,三级:1}[y.authority]-({一级:3,二级:2,三级:1}[x.authority])));const counts={};for(const r of results)counts[r.category]=(counts[r.category]||0)+1;const timeline=results.filter(r=>r.date).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,20).map(r=>({date:r.date,title:r.title,url:r.url}));return Response.json({query:q,entity_type:entityType(q),queries,counts,results,timeline,generated_at:new Date().toISOString(),note:'公开网页检索结果，仅供证据发现与交叉核验，不作事实或法律结论。'},{headers:{...CORS,'Cache-Control':'public, max-age=300'}})}};
