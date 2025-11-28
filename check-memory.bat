@echo off
echo ================================================
echo SAM 3D Body - Memory Diagnostic Tool
echo ================================================
echo.

REM 激活conda环境
echo Activating conda environment: sam_3d_body
call conda activate sam_3d_body
if errorlevel 1 (
    echo ERROR: Failed to activate conda environment 'sam_3d_body'
    echo Please make sure the environment exists: conda env list
    pause
    exit /b 1
)

echo.
echo Running memory diagnostic...
echo This will check GPU memory usage with different model configurations
echo.
echo Please wait, this may take a few minutes...
echo.

python check_memory.py

echo.
echo ================================================
echo Diagnostic complete!
echo ================================================
echo.
echo Review the output above to understand memory usage.
echo.
echo Recommendations:
echo - If you have 8GB VRAM: Use start-lightweight.bat
echo - If you have 12GB+ VRAM: Use start.bat
echo - If you have less than 6GB: Consider CPU mode or further optimization
echo.
pause
