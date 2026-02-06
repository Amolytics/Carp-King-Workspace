@echo off
setlocal
cd /d %~dp0

cd backend
npm install

set PORT=4000

echo Starting Node backend on port %PORT% ...
npm run dev

echo.
echo If it stopped, scroll up for the error above.
pause
