// Navigation state is ephemeral; no vault data is stored on the device.
const MOBILE_PRIMARY=['tablero','todo','inbox','grafo'];
function renderMobileNavigation(){
 if(!S.navOpen)return '';
 return `<dialog id="navigation-dialog" class="navigation-dialog" aria-labelledby="navigation-title"><header><div><p class="mobile-eyebrow">PACHIMIND</p><h2 id="navigation-title">Todas las secciones</h2></div><button type="button" class="btn btn-ghost" onclick="closeNavigation()" aria-label="Cerrar navegación">✕</button></header><nav class="navigation-grid" aria-label="Secciones de PachiMind">${VIEWS.map(v=>`<button type="button" class="${v.id===S.view?'on':''}" data-navigation-view="${v.id}" onclick="setView(this.dataset.navigationView)" ${v.id===S.view?'aria-current="page"':''}><span aria-hidden="true">${v.icon}</span><span>${esc(v.label)}</span>${v.id==='humano'&&humanState().countData?.total_pending?`<small>${humanState().countData.total_pending}</small>`:v.id==='inbox'&&S.drafts_count?`<small>${S.drafts_count}</small>`:''}</button>`).join('')}</nav><footer>Tu memoria, tus pendientes y sus conexiones.</footer></dialog>`;
}
function openNavigation(){S.navOpen=true;render();}
function closeNavigation(){S.navOpen=false;render();document.querySelector('.mobile-more')?.focus({preventScroll:true});}
function mountMobileNavigation(){const dialog=document.getElementById('navigation-dialog');if(!dialog)return;dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();closeNavigation()});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeNavigation();}});}
function toggleMobileSearch(){S.searchOpen=!S.searchOpen;render();if(S.searchOpen)document.getElementById('search-inp')?.focus();}
