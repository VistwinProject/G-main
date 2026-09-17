# 第一階段遷移紀錄（2026-09-17）

## 來源與歷史

- Main：G-main / Information，0342d15cb054bff96939d1ee31baddfa731eecf2。
- Pad：G-pad / main，f4e3eb4041fbf777242cbd2348d68bd8e6b9bbeb。
- 新本機分支：monorepo-stage1。
- 8033b2d：Main 80 個受追蹤檔案原樣移至 apps/main（100% renames）。
- ba5d708：以保留父提交的 merge 匯入 Pad 到 apps/pad；第二父提交為 f4e3eb4。
- 兩個來源提交均通過 merge-base --is-ancestor；沒有 filter/rebase/force push。
- 新 repo 不保留指向原 repo 的 origin，以免誤推。原 repo／遠端／Pages 未刪除、改寫或封存。
- 來源工作目錄內未受追蹤的實驗檔、舊音檔及筆記沒有擅自納入新 repo。
- Main 75、Pad 20 個非工具／搬移伺服器的受追蹤檔案已與來源 Git blob 比對相同；包含 UI、CSS、JS、音檔、模型、shader、layout JSON。

## 搬移與修改清單

全量搬移：原 G-main 的受追蹤檔案 → apps/main；原 G-pad → apps/pad。
Main 的 server.mjs 再移至根目錄 server/server.mjs。

有內容修改的既有檔案：

| 新路徑 | 修改內容 |
|---|---|
| server/server.mjs | 雙 app HTTP 路由、Main layout 寫入限制、路徑防護、LAN 監聽、網址輸出、埠占用錯誤 |
| apps/main/tools/extract-home.mjs | 原始 BIM 來源改用參數、輸出改為 app 相對位置 |
| apps/main/tools/extract-routes.mjs | 同上 |
| apps/main/tools/restyle-flat.mjs | 同上 |
| apps/main/tools/restyle-tower.mjs | 主體／樓梯來源改用參數、中間產物輸出至 app models |
| apps/pad/tools/extract-plan.mjs | BIM 來源參數、離線動線來源指向 monorepo Main |
| apps/pad/tools/render-residence.mjs | BIM 來源改用參數 |
| apps/pad/tools/draw-residence.ps1 | 預設輸出相對於 Pad 工具所在資料夾 |

新增：README.md、MIGRATION.md、package.json、.gitignore、shared/.gitkeep、server/verify.mjs。
兩端 sync.js 完全未改；從 WS_GUID 至心跳區塊與原 server 逐字比對相同（只忽略 CRLF）。

## 驗收

環境：Windows、Node 24.18.0；本機主服務 5280，自動測試隔離服務 5391。

| 項目 | 結果與證據 |
|---|---|
| node server/server.mjs 啟動 | 通過，預設 5280，0.0.0.0 |
| /main/、/pad/ | 200，瀏覽器成功載入兩入口 |
| Main CSS／圖／模型／JS | 自動遍歷檔案，逐位元組 HTTP 回讀；3D 與紅色構件實際可見 |
| Pad CSS／圖／JS | 同上；住戶端與科普內容實際可見 |
| 全部 app 檔案 | 98 個非隱藏檔案 HTTP 200、內容相同，包括音檔與 layout |
| /ws 兩端連線 | 通過，Pad 顯示已連線，預設無 server 參數 |
| 双向切頁／選題 | 實測 Main 03、02 → Pad；Pad 04 → Main；Main 防火區劃 → Pad；Pad 梁柱抗震 → Main |
| Pad 路線控制 | 點逃生指引，Main 收到一次 route-next 並展示，Pad 進入出口指引並抵達 0m |
| 動畫進度 | anim.kind/t0/dur/now 欄位原樣轉播測試通過；實際動線可完成。未進行跨實體裝置逐幀精度／延遲量測 |
| Pad 重新整理 | 保留 04 地震／梁柱抗震，重連取得最新內容 |
| Main 重新整理 | 回原有開場流程，沒有自動重播先前 route-next；伺服器測試確認新連線不向其他連線重發快取指令 |
| 版面編輯器 | ?page=home&edit=homeBrand 可操作；右移後 layout-home.json 的 x 變更已落盤；復原後檔案與原版相同 |
| layout PUT／POST／DELETE | 測試専用 layout-monorepotest.json 寫讀刪成功，非 JSON 400；Pad 或非 layout 寫入 405 |
| 路徑與錯誤 | 原始 /%2e%2e/、反斜線、隱藏路徑及磁碟路徑被拒；不存在檔案 404；不對外提供根 server 目錄 |
| Main／Pad 資源分離 | 前端原始檔未改且皆使用各自相對路徑；Main 未匯入 Pad；Pad 只用自己的 2D plan-data／圖片／orb，無 Main 模型依賴。/pad/models/tower.glb 為 404 |
| ping/pong | 自動客戶端存活超過 25 秒心跳週期且能繼續取狀態；原斷線清理程式未改 |
| 埠占用 | 第二個同埠 server 以 exit 1 失敗，不換埠 |
| LAN | 本機經 LAN IP 172.20.10.3 存取兩頁 200，WS 可取 snapshot。IP 會隨網路改變 |
| 實體平板跨機連線 | 尚待驗收：本機自連不能證明 Wi-Fi 隔離、防火牆或平板瀏覽器支援 |
| 原 URL／除錯參數 | sync.js、editor 及頁面參數解析完全保留；?server= 覆寫程式仍在 |
| 原部署方式 | 舊 repo Pages 未變；新 monorepo 發佈尚未遷移，見 README |

自動測試執行 node server/verify.mjs；不對正在展演的主服務注入測試資料。
測試時發現的窄視窗無模型是原 CSS @media(max-aspect-ratio:5/4) 隱藏 .stage，非搬移後模型遺失；未改版面。

## 待人工／下一階段決定

1. 新 GitHub repo 的擁有者、名稱與可見性；確認前不新增遠端或推送。
2. 用實體平板在同一 LAN 開啟 /pad/，確認互動、動畫、語音球和 Wi-Fi 連線。
3. 受信任 HTTPS/WSS 的展演部署（HTTP LAN 上 WebGPU 可能不可用），以及外部 CDN 可用性。
4. 新 Pages／Node 主機發佈流程；只有驗證且人工確認後，才考慮封存舊 repo。
5. 如需嚴格跨裝置動畫同步精度，另排量測；本階段未重構協定、ACK、恢復或動畫對時。

已知相容性包含同 origin 的 skin 儲存鍵、窄螢幕隱藏 3D、CDN 依賴、WebGPU 安全來源和既有 WebSocket 限制，詳見 README。

