@echo off
echo Starting LoyaltyLens...
cd /d "%~dp0"
call venv\Scripts\activate
streamlit run app.py
pause
