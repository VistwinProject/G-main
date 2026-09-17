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
- 原有 WebSocket 僅支援未分片文字訊框、close 行為等限制保留；沒有進入協定統一、ACK 或狀態恢復重構。
