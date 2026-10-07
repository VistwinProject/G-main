<#
  G 區展演啟動器。雙擊根目錄的「啟動展演.bat」會跑到這裡。

  要做的事：
    1. 確認 node 在
    2. 確認連接埠沒被佔用 —— 同時開兩台伺服器會變成兩個互不相通的轉播站，
       Pad 會顯示「已連線」但畫面永遠不動，這個坑踩過，所以直接擋
    3. 印出 Main / Pad 的網址（含主機名網址，IP 變了也不用改）
    4. 啟動伺服器，視窗關掉就等於關伺服器
#>
param([int]$Port = 5280)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host ''
  Write-Host '  [錯誤] 找不到 node。請先安裝 Node.js 再試一次：https://nodejs.org/' -ForegroundColor Red
  Write-Host ''
  Read-Host '  按 Enter 關閉'; exit 1
}

if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) {
  Write-Host ''
  Write-Host "  [擋下來了] 連接埠 $Port 已經有程式在用。" -ForegroundColor Yellow
  Write-Host ''
  Write-Host '  很可能是上一次的伺服器還開著。請先把那個視窗關掉。'
  Write-Host '  不要同時開兩台 —— 兩個轉播站互不相通，Pad 會連到空的那一個，'
  Write-Host '  症狀是「顯示已連線，但畫面永遠不動」。'
  Write-Host ''
  Read-Host '  按 Enter 關閉'; exit 1
}

$ips = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } |
  Select-Object -ExpandProperty IPAddress

Write-Host ''
Write-Host '  ===========================================================' -ForegroundColor Cyan
Write-Host "   G 區展演伺服器　連接埠 $Port" -ForegroundColor Cyan
Write-Host '  ===========================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host '   這台電腦開 Main：'
Write-Host "     http://localhost:$Port/main/" -ForegroundColor White
Write-Host ''
Write-Host '   iPad／平板開 Pad（擇一，建議第一個）：'
Write-Host "     http://$env:COMPUTERNAME.local:$Port/pad/" -ForegroundColor Green -NoNewline
Write-Host '   <- 主機名，IP 變了也不用改'
foreach ($ip in $ips) { Write-Host "     http://${ip}:$Port/pad/" }
Write-Host ''
Write-Host '   平板要跟這台連同一個 Wi-Fi。Pad 不用帶 ?server= 參數。'
Write-Host '   關掉這個視窗就等於關掉伺服器。'
Write-Host '  -----------------------------------------------------------'
Write-Host ''

node server\server.mjs $Port

Write-Host ''
Write-Host '  伺服器已停止。'
Read-Host '  按 Enter 關閉'
