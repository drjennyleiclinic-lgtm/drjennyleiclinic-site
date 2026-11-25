# 給 AI 助手的專案須知

**先讀完這份再動手。這個專案有兩個平行的 repo，很多「看起來像 bug」的東西是刻意的。**

---

## 一、這個 repo 的身分

| 項目 | 值 |
|---|---|
| 角色 | 正式站（對外營運中） |
| GitHub | `drjennyleiclinic-lgtm/drjennyleiclinic-site` |
| Cloudflare Worker 名稱 | `drjennyleiclinic` |
| 正式網址 | `https://jennyleiclinic.com`（2026-10-29 起） |
| 舊網址 | `https://drjennyleiclinic.drjennyleiclinic.workers.dev`：由 `worker.js` 301 轉到正式網址（`/admin` 除外，後台照舊從這裡登入） |

另一個 repo 是 **練習站**：`joyseeker9453-sketch/PRACTICEMOVING`（網址 `https://practicemoving.joyseeker9453.workers.dev`）。
兩邊程式碼幾乎相同，改動流程是「先在練習站做、驗證過再搬到正式站」。

---

## 二、baseUrl —— 不要再說它需要修正 ⚠️

`content/site.json` 的 `baseUrl` 目前是：

```
https://jennyleiclinic.com
```

**這是正確的，不要改。** 它必須等於正式網址（自訂網域）。**絕對不要改回 workers.dev 網址**：
canonical、sitemap、hreflang 都跟著它走，改回去 Google 會再搬一次家，搜尋排名又要重來。

歷史背景（git 紀錄）：
- 2026-09-15 ～ 10-27：baseUrl 誤填成練習站網址，canonical 指向練習站。
- 10-27：改成 workers.dev 網址；10-29：綁定自訂網域，改成 `https://jennyleiclinic.com`。
- 換網址時舊網址沒有轉址，約 11 月中 Google 把舊網址從搜尋結果拿掉，新網域還沒接上排名，
  搜「晨昕診所」一度找不到。之後補了 `worker.js` 把 workers.dev 舊網址 301 轉到新網域。

要換網域時，由診所人員到後台「診所資料 → 網站網址」改，**不要改 code**；
同時要讓舊網址 301 轉到新網址（見 `worker.js`），不能只改 baseUrl。

注意：舊站 `jenny-clinic.com` 是另一組人做的網站，跟這個 repo 無關。

---

## 三、絕對不要在兩個 repo 之間複製的檔案 ⚠️

搬移改動時，這三個一複製就會把兩個站接錯線：

| 檔案 | 為什麼 |
|---|---|
| `wrangler.jsonc` | `name` 綁 Cloudflare 專案，複製會讓部署指到另一個站 |
| `content/site.json` 的 `baseUrl` | 見上一節 |
| `admin/config.yml` 的 `repo` / `base_url` / `site_url` / `display_url` | 綁 GitHub repo 與登入中繼 Worker，複製會讓後台去改另一個 repo |

`content/announcements.json`、`content/articles/`、`content/about.json` 是各站自己的內容，
除非明確要求同步內容，否則也不要複製。

---

## 四、build.js 會自動產生的檔案 —— 不要手改

部署時 Cloudflare 執行 `npm run build`。`build.js` 會寫出：

```
data/articles.json      data/announcements.json    data/content.js
styles.css              sitemap.xml                robots.txt
article/<slug>/index.html                          notices/index.html
team/index.html
index.html 的 <!--OG:START--> ~ <!--OG:END--> 區段
```

重點：

- **`index.html` 會被 build.js 回頭覆寫一部分**。`OG:START` 到 `OG:END` 之間的
  canonical / og:url / og:image / schema.org 由 `baseUrl` 和 `site.json` 重新產生。
  在那區段裡手動改東西沒有意義，下次部署就沒了。那兩個標記也不能刪。
- **首頁內文也會預先寫入（SEO）**：`SVC`、`HOURS`、`HOURS-NOTE`、`HOURS-EXTRA`、`TEAM`、
  `HOME-ARTICLES`、`NEWS-GRID`、`CONTACT`、`F-ADDR` 這幾組 `<!--XXX:START/END-->` 標記之間，
  由 build.js 的 `injectHomeBody()` 用跟首頁 JavaScript（`initStatic()`、`cardHTML()`）一樣的 HTML 填入，
  讓 Google 不執行 JavaScript 也看得到內容和每篇文章的連結。改了其中一邊的 HTML，另一邊要一起改。
- **連結一律要有 `href`**：Google 只會跟著 `<a href>` 走。首頁選單、文章卡片保留 onclick 做站內切換，
  但都有真正的 href（文章卡片連到 `/article/<slug>/`），不要改回只有 onclick。
- 外文頁的 hreflang 與 canonical 由 `HREFLANG` 標記區塊產生，網址一律是完整網址（Google 規定）。
- repo 裡 committed 的 `data/*.json` 是**過期殘留**，跟 `content/` 對不上是正常的。
  每次部署都會重新產生，不需要修、也不需要 commit 更新版本。

---

## 五、Markdown 渲染 —— 已經統一過，不要改回去

公告與文章的 Markdown 由 `build.js` 的 `renderMarkdown()` 處理：
`marked`（解析）→ `sanitize-html`（白名單過濾）。

首頁公告條、`/notices/` 公告頁、文章頁**共用同一顆引擎**。
Sveltia 後台預覽用的也是 marked，所以預覽跟實際輸出一致。

刻意的設計，不要「修正」：

- **標題降一級**：後台的 `#` 輸出成 `<h2>`、`#####` 和 `######` 都收斂到 `<h6>`。
  因為頁面本身已有一個 `h1`，避免重複。
- **不碰 marked 的 renderer API**：改用「前處理文字 + 後處理 HTML」。
  這是為了跨大版本相容（marked 12 與 18 輸出已驗證逐字相同）。
- **白名單不含表格**：`<table>` 系列會被過濾掉。診所人員不使用表格語法。
- **FB 貼文殘留處理**：fbcdn 表情圖示還原成文字、facebook.com/hashtag 連結拿掉外連留文字。

---

## 六、首頁公告的高度策略

`content/site.json` 的 `announcementHeightMode` 是全站預設（目前 `scroll`），
每則公告可用 `heightMode` 覆蓋（`inherit` / `scroll` / `clip` / `full`）。
兩者都有對應的後台選單，**不是寫死的值，不要改成常數**。

`/notices/` 公告頁一律完整顯示，不受這個設定影響。

---

## 七、工作方式

- 診所人員不是工程師。解釋要講「改哪個檔、哪一行、為什麼」，但不用教寫 code。
- **不要自行 commit 或 push。** 產出檔案交給對方自行上傳到 GitHub，並明確說明每個檔案
  要放到 repo 的哪個路徑。
- 驗證要用實測：Cloudflare build 完之後開線上版確認
  （看 `/data/content.js` 第一行建置時間、網址加 `?v=數字` 避快取），
  不要用「應該沒問題」交差。
- 不要用下載到本機的 `index.html` 雙擊開來驗證。`/images/...` 是絕對路徑，
  只有在真正的網站根目錄下才找得到，本機開一定會破圖，那不是 bug。
