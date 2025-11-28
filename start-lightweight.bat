@echo off
echo ================================================
echo Starting SAM 3D Body Editor (LIGHTWEIGHT MODE)
echo ================================================
echo.
echo This mode disables the FOV estimator to save VRAM
echo Memory usage: ~4-5GB instead of ~6-8GB
echo.

REM 激活conda环境
echo [1/3] Activating conda environment: sam_3d_body
call conda activate sam_3d_body
if errorlevel 1 (
    echo ERROR: Failed to activate conda environment 'sam_3d_body'
    echo Please make sure the environment exists: conda env list
    pause
    exit /b 1
)
echo Conda environment activated successfully
echo.

REM 启动Flask后端（轻量级模式）
echo [2/3] Starting Flask backend server (lightweight mode)...
start "Flask Backend - Lightweight" cmd /k "conda activate sam_3d_body && set LIGHTWEIGHT_MODE=true && python app.py"

REM 等待后端启动
timeout /t 5 /nobreak >nul

REM 启动React前端
echo [3/3] Starting React frontend dev server...
cd frontend
start "React Frontend - SAM 3D Body" cmd /k "npm run dev"

echo.
echo ========================================
echo Both servers are starting...
echo.
echo Backend:  http://localhost:5000 (Lightweight Mode)
echo Frontend: http://localhost:5173
echo.
echo Open http://localhost:5173 in your browser
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
