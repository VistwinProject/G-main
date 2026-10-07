@echo off
rem ASCII only on purpose: cmd.exe decodes .bat files with the OEM codepage
rem before chcp can take effect, so UTF-8 Chinese here turns into mojibake.
rem All the real logic and the Chinese banner live in tools\start-show.ps1.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\start-show.ps1" %*
