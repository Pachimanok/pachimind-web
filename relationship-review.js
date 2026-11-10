// Compatibility with the existing link-review menu/bookmarks. All checks use Humano.
const linkReview={busy:false};
async function loadLinkReviews(){const h=humanState();h.kind='links';h.page=1;h.detail=null;h.detailKey=null;linkReview.busy=true;try{await loadHuman();}finally{linkReview.busy=false;}}
function renderLinkReviews(){return renderHuman('Vínculos pendientes');}
