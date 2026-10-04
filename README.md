# G-system — Phase 1 monorepo

Main 與 Pad 為兩個獨立網站，使用同一個 Node 靜態／WebSocket 伺服器。
本階段不更改 UI、模型、shader、動畫、同步協定或對時邏輯。

## 啟動

需要 Node.js 22 以上（實測 24.18.0）。不需要 npm install 或打包。

在 G-system 根目錄執行：

~~~sh
node server/server.mjs
~~~

- Main：http://localhost:5280/main/
- Pad：http://localhost:5280/pad/
- WebSocket：ws://localhost:5280/ws
- 區域網路：http://<主機IP>:5280/main/ 和 http://<主機IP>:5280/pad/
- Pad 自動連至同 host 的 /ws；除錯仍可用 /pad/?server=<主機IP>:5280。
- 舊的根網址 / 會導向 /main/；/main、/pad 會補尾端斜線，保留查詢參數。
- 監聽 0.0.0.0；啟動時列出本機及各張網卡的 LAN 網址。
- 5280 被占用時直接失敗，不會自動換埠。測試可明確指定第二個參數或 PORT。
- 主機與平板需在可互通的網路上；必要時由管理者允許 Node 的私人網路防火牆規則。

## 目錄

~~~text
G-system/
├─ apps/
│  ├─ main/
│  │  ├─ index.html
│  │  ├─ css/
│  │  ├─ js/
│  │  ├─ assets/
│  │  ├─ models/
│  │  ├─ tools/
│  │  ├─ internal/
│  │  └─ layout*.json
│  └─ pad/
│     ├─ index.html
│     ├─ css/
│     ├─ js/
│     ├─ assets/
│     ├─ tools/
│     └─ server.mjs          # 原有舊伺服器，保留歷史相容；正常啟動不用它
├─ shared/.gitkeep           # 尚未抽取共用程式
├─ server/
│  ├─ server.mjs
│  └─ verify.mjs
├─ MIGRATION.md
├─ README.md
└─ package.json
~~~

兩個 app 內的 README/HANDOFF/UI-SPEC 是原版文件，部分啟動／部署路徑仍描述舊 repo。
新的啟動方式以本文件為準。各自 sync.js 保留；沒有合併 bundle，也沒有共用 UI/CSS。

## 版面編輯

原有 E 鍵及 ?edit=1、?page=home&edit=homeBrand 等參數維持原樣。
編輯器相對請求會寫至 /main/layout*.json，對應 apps/main/ 直接子檔案。
保留 GET/PUT/POST/DELETE；只允許 layout.json 或 layout-英數字.json（沿用原命名規則）。
Pad、其他副檔名、子資料夾、符號連結及路徑穿越不能用此 API 寫入。
測試不會保留對既有版面的變更。

## 工具腳本

離線 BIM 原始來源不在 repo 中，需自行提供來源路徑。既有產出的模型未重新轉檔、壓縮或降低品質。

從根目錄執行：

~~~sh
node apps/main/tools/extract-home.mjs "<三層動線.gltf>"
node apps/main/tools/extract-routes.mjs "<單層動線.gltf>"
node apps/main/tools/restyle-flat.mjs "<切平面.gltf>"
node apps/main/tools/restyle-tower.mjs "<三層.gltf>" "<樓梯.gltf>"
node apps/pad/tools/extract-plan.mjs "<切平面.gltf>" ["<routes-home.json>"]
node apps/pad/tools/render-residence.mjs "<切平面.gltf>" > segs.json
powershell -File apps/pad/tools/draw-residence.ps1 -Segs segs.json
~~~

Main 輸出固定相對工具所在位置至 apps/main/models/；restyle 輸出是中間 gltf，後續原有 gltf-transform 流程需另外準備工具，並明確指定該 models 目錄。
Pad extract-plan 預設讀 apps/main/models/routes-home.json，只是離線產製步驟；瀏覽器不載入它或 Main 的 3D 模型。
Pad draw-residence 預設輸出 apps/pad/assets/residence.png。演算法和既有產出均未改動。

## 測試

~~~sh
npm test
~~~

測試在明確指定的 5391 埠啟動隔離伺服器，避免向正在展演的 5280 注入測試指令。
可用 TEST_PORT 指定另一個測試埠，埠占用仍直接失敗。
檢查全部 app 檔案逐位元組讀取、404、路徑防護、版面 API、雙向訊息、動畫欄位、重新連線補送、語音轉播、埠占用與 ping/pong。
會建立並刪除測試專用 layout-monorepotest.json，不應拿此檔名保存正式版面。
實測與尚待實體裝置驗收詳見 [MIGRATION.md](MIGRATION.md)。

## 部署與已知限制

- monorepo 使用現有 VistwinProject/G-main，遠端分支為 monorepo-stage1；不另建 G-system GitHub repo。
- G-main 的 main、Information 分支與 G-pad repo 保持不動。GitHub Pages 改由 pages-stage1 靜態發佈分支提供兩個入口：/G-main/main/、/G-main/pad/，舊 /G-main/ 網址保留參數並導向 Main。
- 以 node tools/build-pages.mjs <空白輸出目錄> 產生靜態發佈內容；將該目錄提交到 pages-stage1 並推送即可更新 Pages。產物只包含前端資源，不含 server、工具或內部筆記；deploy-version.json 記錄來源提交。
- Pages 不能執行 Node/WebSocket 或寫入版面 JSON，另需常駐 Node 主機／代理。兩端可帶 ?server=<受信任的WSS主機> 指向同一同步服務；沒有此服務時，Pages 僅供各自展示。本機 LAN 展演仍使用 node server/server.mjs。
- CDN Three.js 與 Google Fonts 仍需網路，未進行離線打包。
- 語音球沿用 WebGPU；實體平板開 HTTP LAN IP 不屬安全來源，WebGPU 可能不可用。完整語音球需裝置支援並以受信任 HTTPS/WSS 服務，或另訂部署方案。本階段沒有改 shader 或以低畫質替代。
- Main 原 CSS 在窄直式比例下隱藏 3D，主展示請用橫向視窗。未修改此原有行為。
- 同瀏覽器同 origin 的兩頁仍沿用 skin 儲存鍵，重整時可能讀到彼此最後選的深淺色；跨装置不受此影響。未為此重構前端。
- 伺服器沿用無驗證的 LAN 同步／編輯機制，僅供信任的展演網路；不要直接暴露到公網。
- 原有 WebSocket 僅支援未分片文字訊框；G 控制已增加展示 ACK 與 close handshake，但不提供伺服器重啟後的持久化播放恢復。

## X 控制與靜音驗證（2026-10-05）

- 展示靜音入口 `/main/?mute=1`：旁白媒體靜音、輸出 Gain 為 0，畫面顯示 MUTE 標記。Pad 本身不播放音效。
- `/health` 回傳 `g-control/1`、display ready、實際 scene/page/phase、模型載入及 muted 狀態。
- X 維持連 `/ws?role=x-controller`，送 `{scene:'golden30',requestId:'唯一識別碼'}`。舊版無 requestId 的四種 scene 封包仍相容，伺服器會補 ID。
- 支援 `welcome`、`intro`、`golden30`、`aiRoute`、`prevention`、`outro`。控制會中止自動展演；X 的 welcome/intro 皆為 reset：停止旁白、倒數及原動線，顯示 intro 待機，不自播。aiRoute 只進頁面，動線仍由 Main／Pad 按鈕啟動。
- 收到 `x-status` 且 ready=true 才代表唯一展示端已初始化；WS open 不代表 ready。
- `x-ack` 的 `status:'applied',ok:true` 由展示頁切換後，主動呼叫 WebGL renderer，確認 frame 增加且 draw calls > 0 才回覆；不再等待背景分頁可能暫停的 rAF。welcome 無 3D，單獨核對 DOM layout。`display.lastControl` 記錄 requestId、處理時長、實際 render 證據及分頁 visibility；背景分頁的 outputVisible=false。這證明頁面應用命令並提交 WebGL 繪製，並非實體投影機、合成器呈現或聲音設備確認。
- 無展示／多展示／忙碌／非法場景會拒絕；展示 ACK 5 秒逾時，逾時不代表沒有執行。requestId 最近 128 筆結果在記憶體去重，X 指令不進重連快取，不會重播。
- ready 心跳 2 秒、10 秒過期。Main／Pad 原自動重連 1.5 秒；X adapter 建議 3 秒。重啟 G server 仍使用預設狀態；完整重新載入 Main 仍保留原開場流程。
- `npm test` 包含隔離 HTTP/WS 回歸及 X 控制邊界測試；不對 5280 注入自動回歸資料。

### 體驗狀態（供 X 切區判斷）

`x-display-status.experience`（也位於 `/health.display.experience`）為 `idle | active | complete`，附 `experienceEvidence` 說明。這是整段 G 體驗狀態，與 ready、phase、靜音及切頁 ACK 分開。

- `complete`：目前 outro 旁白真正觸發原生 `HTMLMediaElement.ended`，run/page 相符、音軌佇列已結束，且自動展演不再排程。只切入 outro、暫停、播放錯誤、autoplay 阻擋或手動提前結束都仍為 active；重播會清除完成證據。
- `idle`：停在 intro，且該次旁白已真正結束或已明確停止，自動展演不在執行。X intro/welcome 現為專用 reset 待機：取消未完成播放請求、停止旁白與自動流程，回 intro 且不自播，確認 experience=idle 並完成實際渲染才回 applied ACK。idle 狀態先於 ACK 送出。非 X 手動切 intro 保留自動旁白，此時仍 active，播完才 idle。
- 其他情況為 `active`；動線 cleared 或科普單題播完是中間步驟，不直接當作整段 G 完成。音量為 0 也不等於完成。
- 現有 2 秒狀態心跳回報最新語意，與每次命令後立即回報相容；不需要更改或重啟 relay。X 應直接透傳 display.experience，缺欄位不可猜成 idle。
