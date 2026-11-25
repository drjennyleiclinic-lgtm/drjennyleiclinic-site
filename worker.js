/* ============================================================
   舊網址轉址：drjennyleiclinic.drjennyleiclinic.workers.dev → jennyleiclinic.com
   ------------------------------------------------------------
   10/29 正式網址從 workers.dev 換成 jennyleiclinic.com，但舊網址一直沒有轉址，
   Google 把舊網址從搜尋結果拿掉後，排名沒有轉移到新網域。
   這支程式讓舊網址的每一頁都用 301（永久搬家）導到新網域的同一頁，
   Google 會把舊網址累積的排名轉給新網址。

   - 只認「正式站的 workers.dev 網址」這一個主機名稱。
     練習站（practicemoving.joyseeker9453.workers.dev）就算複製這個檔案過去也不會被轉走。
   - /admin（內容後台）不轉址：後台登入綁在 workers.dev 網址上，轉走可能會登不進去。
   - 其他主機名稱（jennyleiclinic.com）一律照原本方式提供網站檔案，
     _redirects（/en → /en/indexen 等短網址）和 _headers 照常生效。
   ============================================================ */
const OLD_HOST = 'drjennyleiclinic.drjennyleiclinic.workers.dev';
const NEW_ORIGIN = 'https://jennyleiclinic.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isAdmin = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
    if (url.hostname === OLD_HOST && !isAdmin) {
      return Response.redirect(NEW_ORIGIN + url.pathname + url.search, 301);
    }
    return env.ASSETS.fetch(request);
  }
};
