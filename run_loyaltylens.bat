@echo off
echo Starting LoyaltyLens...
cd /d "%~dp0"
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)
streamlit run app.py
pause
