import streamlit as st
import pandas as pd
import pickle
import sys
import os
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

# --- PATH SETUP ---
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))
from utils.reason_engine import get_churn_reason
from utils.recommendation_engine import get_recommendation
from utils.risk_engine import ensure_columns_exist, calculate_risk_score, classify_risk_level
from utils.simulation_engine import get_available_actions, simulate_retention_campaign
from utils.geodata import get_lat_lon

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="LoyaltyLens | Customer Retention Intelligence",
    page_icon="🧭",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- COLORS & STYLE CONFIG (FMCG DASHBOARD THEME) ---
# Teal: #004D40 (Deep Green/Teal for sidebar)
# Main BG: #F8F9FA
# Cards: #FFFFFF
# Accents: #4DB6AC (Teal Light), #FF8A65 (Soft Orange), #64B5F6 (Soft Blue)

st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    /* --- SIDEBAR CONTAINER --- */
    [data-testid="stSidebar"] {
        background: linear-gradient(170deg, #064E3B 0%, #065F46 100%); /* Deep Forest Gradient */
        border-right: 1px solid rgba(255,255,255,0.1);
    }
    
    /* --- DROPDOWN / SELECTBOX STYLING --- */
    div[data-testid="stSidebar"] .stSelectbox label p {
        color: #A7F3D0 !important; /* Emerald 200 */
        font-weight: 600 !important;
        font-size: 13px !important;
        text-transform: uppercase;
        letter-spacing: 0.8px;
    }
    
    div[data-testid="stSidebar"] div[data-baseweb="select"] > div:first-child {
        background-color: rgba(6, 78, 59, 0.6) !important;
        border: 1px solid rgba(167, 243, 208, 0.3);
        border-radius: 8px !important;
        color: white;
    }
    
    div[data-testid="stSidebar"] div[data-baseweb="select"]:hover > div:first-child {
        border-color: #34D399 !important; /* Emerald 400 */
        background-color: rgba(6, 78, 59, 0.8) !important;
    }
    
    div[data-testid="stSidebar"] div[data-baseweb="select"] div {
        color: #FFFFFF !important;
        font-weight: 500 !important;
    }
    
    div[data-testid="stSidebar"] div[data-baseweb="select"] svg {
        fill: #A7F3D0 !important;
    }

    /* --- NAVIGATION BUTTONS --- */
    .stRadio [role="radiogroup"] {
        gap: 6px;
        padding-top: 15px;
    }
    
    .stRadio label {
        background-color: transparent;
        padding: 12px 14px;
        width: 100%;
        border-radius: 8px;
        transition: all 0.2s ease;
        border: 1px solid transparent;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        color: #D1FAE5 !important; /* Emerald 100 */
    }
    
    .stRadio label p, .stRadio label span, .stRadio label div {
        color: inherit !important;
        font-weight: 500 !important;
        font-size: 15px !important;
        letter-spacing: 0.3px;
    }
    
    /* Hover State */
    .stRadio label:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
        color: #FFFFFF !important;
        cursor: pointer;
        padding-left: 18px;
    }

    /* Active State */
    div[role="radiogroup"] label[data-checked="true"] {
        background: linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%) !important;
        border-left: 4px solid #34D399 !important; /* Emerald Bright */
        color: #FFFFFF !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    
    div[role="radiogroup"] label > div:first-child { display: none !important; }
    div[role="radiogroup"] label > div:last-child { width: 100%; }
    
    /* SEPARATORS */
    div[data-testid="stSidebar"] hr {
        border-color: rgba(167, 243, 208, 0.2) !important;
        margin: 24px 0;
    }
    
    /* CUSTOM PRO TIP BOX */
    .pro-tip-box {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 12px;
        border: 1px solid rgba(52, 211, 153, 0.2);
        border-left: 4px solid #34D399; /* Emerald 400 */
        padding: 16px;
        margin: 15px 0;
    }
    .pro-tip-title {
        color: #34D399 !important; 
        font-weight: 700; 
        font-size: 12px; 
        text-transform: uppercase; 
        letter-spacing: 1px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
    }
    .pro-tip-text {
        color: #ECFDF5 !important; 
        font-size: 13px; 
        line-height: 1.5; 
        margin: 0;
        opacity: 0.95;
    }

    /* --- SNAPSHOT / KPI CARDS (Global) --- */
    div[data-testid="column"] { background-color: transparent; }
    
    .snapshot-card {
        background-color: #FFFFFF;
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        border: 1px solid #ECFDF5;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 140px;
    }
    .snapshot-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 25px rgba(6, 78, 59, 0.08); /* Green tinted shadow */
        border-color: #D1FAE5;
    }
    
    .card-title {
        color: #065F46; /* Emerald 800 */
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        margin-bottom: 12px;
    }
    .card-value {
        color: #064E3B; /* Emerald 900 */
        font-size: 32px;
        font-weight: 800;
        margin: 0;
        font-family: 'Inter', sans-serif;
        letter-spacing: -1px;
    }
    .card-delta {
        font-size: 13px;
        font-weight: 600;
        margin-top: 12px;
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 6px;
        width: fit-content;
    }
    
    /* GREEN THEMED ACCENTS */
    .bg-teal-tint { border-bottom: 3px solid #10B981; background: linear-gradient(180deg, #FFFFFF 0%, #ECFDF5 100%); }
    .bg-red-tint { border-bottom: 3px solid #EF4444; background: linear-gradient(180deg, #FFFFFF 0%, #FEF2F2 100%); }
    .bg-orange-tint { border-bottom: 3px solid #F97316; background: linear-gradient(180deg, #FFFFFF 0%, #FFF7ED 100%); }
    .bg-blue-tint { border-bottom: 3px solid #3B82F6; background: linear-gradient(180deg, #FFFFFF 0%, #EFF6FF 100%); }
    .bg-white { border-bottom: 3px solid #6B7280; background: #FFFFFF; }
    
</style>
""", unsafe_allow_html=True)

# --- LOAD RESOURCES ---
@st.cache_resource
def load_model():
    try:
        with open('model/churn_model.pkl', 'rb') as f:
            return pickle.load(f)
    except FileNotFoundError:
        return None

# --- AUTHENTICATION HELPERS ---
import json
import os

USERS_FILE = 'data/users.json'

def load_users():
    if not os.path.exists('data'):
        os.makedirs('data')
    if not os.path.exists(USERS_FILE):
        # Default admin user
        default_users = {"users": [{"email": "admin@loyaltylens.com", "password": "admin"}]}
        with open(USERS_FILE, 'w') as f:
            json.dump(default_users, f)
        return default_users
    
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except:
        return {"users": []}

def save_new_user(email, password):
    users_data = load_users()
    # Check if exists
    for user in users_data['users']:
        if user['email'] == email:
            return False # User exists
    
    users_data['users'].append({"email": email, "password": password})
    with open(USERS_FILE, 'w') as f:
        json.dump(users_data, f)
    return True

@st.cache_data
def load_sample_data():
    if os.path.exists('data/sample_upload.xlsx'):
        return pd.read_excel('data/sample_upload.xlsx')
    return None

@st.cache_data
def process_data_pipeline(df, app_type):
    # 1. Ensure Columns
    df = ensure_columns_exist(df, app_type)
    
    # 2. Calculate Risk Score based on Industry Logic
    df['Churn Risk Score'] = df.apply(lambda row: calculate_risk_score(row, app_type), axis=1)
    
    # 3. Classify Risk Level (Low, Medium, High)
    df['Risk Level'] = df['Churn Risk Score'].apply(classify_risk_level)
    return df

@st.cache_resource
def run_predictions(df, _model):
    if _model and 'Churn_Prediction' not in df.columns:
        process_predictions(df, _model)
    return df

def verify_user(email, password):
    users_data = load_users()
    for user in users_data['users']:
        if user['email'] == email and user['password'] == password:
            return True
    return False

# --- LOGIN PAGE ---
def render_login():
    # Session State for Toggle
    if 'auth_mode' not in st.session_state:
        st.session_state['auth_mode'] = 'login'

    # CSS Styling
    st.markdown("""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        /* --- GLOBAL RESET --- */
        .stApp { background-color: #F8F9FA; font-family: 'Inter', sans-serif; }
        [data-testid="stSidebar"], [data-testid="stHeader"] { display: none !important; }
        .block-container { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
        
        /* --- LAYOUT --- */
        div[data-testid="column"] { height: 100vh; display: flex; align-items: center; justify-content: center; }
        
        /* --- LEFT BRAND SECTION --- */
        .brand-section {
            width: 100%; height: 100vh;
            background: linear-gradient(160deg, #004D40 0%, #00695C 100%);
            display: flex; flex-direction: column; justify-content: center;
            padding: 80px; color: white;
            position: relative; overflow: hidden;
        }
        .brand-pattern {
            position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.1;
            background-image: radial-gradient(#64FFDA 1px, transparent 1px); background-size: 30px 30px;
        }
        .brand-title { font-size: 56px; font-weight: 800; letter-spacing: -2px; margin-bottom: 20px; }
        .brand-tagline { 
            font-size: 18px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; 
            color: #A7F3D0; margin-bottom: 40px; border-left: 3px solid #64FFDA; padding-left: 15px; 
        }
        
        /* --- RIGHT CARD STYLING --- */
        /* We target the second column's inner div to make it look like a card */
        div[data-testid="column"]:nth-of-type(2) > div {
            background-color: #FFFFFF;
            padding: 50px !important;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 77, 64, 0.08); /* Soft Teal Shadow */
            width: 450px !important;
            border: 1px solid rgba(0,0,0,0.05);
            display: block !important; /* Ensure it blocks nicely */
        }

        /* TYPOGRAPHY */
        h1 { color: #111827; font-weight: 800; letter-spacing: -1px; margin-bottom: 10px; font-size: 32px; }
        p { color: #6B7280; font-size: 15px; margin-bottom: 30px; }

        /* INPUTS */
        .stTextInput input {
            padding: 12px 15px !important; font-size: 15px; color: #1F2937;
            border: 1px solid #E5E7EB; border-radius: 8px; background: #FFFFFF;
        }
        .stTextInput input:focus { border-color: #004D40; box-shadow: 0 0 0 3px rgba(0, 77, 64, 0.1); }
        
        /* BUTTON */
        div.stButton > button {
            width: 100%; background-color: #004D40 !important; color: #FFFFFF !important;
            padding: 14px; border-radius: 8px; border: none; font-weight: 600; font-size: 16px;
            box-shadow: 0 4px 10px rgba(0, 77, 64, 0.2); transition: all 0.2s;
        }
        div.stButton > button p { color: #FFFFFF !important; }
        div.stButton > button * { color: #FFFFFF !important; }
        div.stButton > button:hover { transform: translateY(-2px); box-shadow: 0 8px 15px rgba(0, 77, 64, 0.3); color: #FFFFFF !important; }

        /* TOGGLE LINK */
        .auth-toggle { text-align: center; margin-top: 20px; font-size: 14px; color: #4B5563; }
        .auth-toggle span { color: #004D40; font-weight: 600; cursor: pointer; text-decoration: underline; }
    </style>
    """, unsafe_allow_html=True)
    
    # --- UI STRUCTURE ---
    c1, c2 = st.columns([1, 1])
    
    with c1:
        st.markdown("""
        <div class="brand-section">
            <div class="brand-pattern"></div>
            <div style="z-index: 1;">
                <div class="brand-tagline">Customer Retention Intelligence</div>
                <div class="brand-title">LoyaltyLens</div>
                <div style="font-size: 24px; font-weight: 300; color: #E0F2F1; line-height: 1.6;">
                    "Understand churn. Take action.<br>Retain customers."
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with c2:
        # Toggle Logic
        mode = st.session_state['auth_mode']
        
        if mode == 'login':
            st.title("Welcome Back")
            st.write("Sign in to continue to LoyaltyLens.")
            
            with st.form("login_form"):
                email = st.text_input("Work Email", placeholder="name@company.com")
                password = st.text_input("Password", type="password", placeholder="••••••••")
                submit = st.form_submit_button("Log In")
                
                if submit:
                    if verify_user(email, password):
                        st.session_state['authenticated'] = True
                        st.rerun()
                    else:
                        st.error("Invalid email or password.")
            
            # Switch to Signup
            if st.button("New Member? Sign Up Now", type="tertiary"):
                st.session_state['auth_mode'] = 'signup'
                st.rerun()
                
        else: # SIGNUP MODE
            st.title("Create Account")
            st.write("Join LoyaltyLens to stop churn today.")
            
            with st.form("signup_form"):
                email = st.text_input("Work Email", placeholder="name@company.com")
                password = st.text_input("Set Password", type="password")
                confirm_password = st.text_input("Confirm Password", type="password")
                submit = st.form_submit_button("Sign Up")
                
                if submit:
                    if not email or not password:
                        st.error("Please fill all fields.")
                    elif password != confirm_password:
                        st.error("Passwords do not match.")
                    else:
                        if save_new_user(email, password):
                            st.success("Account created! Logging you in...")
                            st.session_state['authenticated'] = True
                            st.rerun()
                        else:
                            st.error("User with this email already exists.")
            
            # Switch to Login
            if st.button("Already have an account? Log In", type="tertiary"):
                st.session_state['auth_mode'] = 'login'
                st.rerun()


# --- UTILS ---
def set_bg(color):
    st.markdown(f"""
    <style>
    .stApp {{
        background-color: {color} !important;
    }}
    </style>
    """, unsafe_allow_html=True)

def main():
    # --- AUTH CHECK ---
    if 'authenticated' not in st.session_state:
        st.session_state['authenticated'] = False
        
    if not st.session_state['authenticated']:
        render_login()
        return

    model = load_model()

    # --- SIDEBAR NAV ---
    # --- SIDEBAR NAV ---
    with st.sidebar:
        # 1. BRAND HEADER
        st.markdown("""
        <div style="padding-top: 10px; margin-bottom: 30px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="
                    font-size: 36px; 
                    margin-right: 15px; 
                    filter: drop-shadow(0 0 8px rgba(100, 255, 218, 0.4));
                ">🧭</span>
                <h1 style="
                    color: #FFFFFF; 
                    font-family: 'Inter', sans-serif;
                    font-weight: 800; 
                    font-size: 28px; 
                    margin: 0; 
                    text-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    letter-spacing: -0.5px;
                    line-height: 1.1;
                ">LoyaltyLens</h1>
            </div>
            <p style="
                color: #B2DFDB; 
                font-family: 'Inter', sans-serif;
                font-size: 12px; 
                font-weight: 500; 
                margin: 0; 
                letter-spacing: 1.5px;
                text-transform: uppercase;
                padding-left: 5px;
                opacity: 0.9;
            ">Customer Retention Intelligence</p>
        </div>
        """, unsafe_allow_html=True)
        
        # 2. INDUSTRY MODE SECTION
        st.markdown("""
        <div style="margin-bottom: 12px;">
            <p style="
                color: #64FFDA; 
                font-size: 14px; 
                font-weight: 600; 
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 1px;
            ">Industry Mode</p>
            <div style="height: 2px; width: 50px; background-color: #64FFDA; border-radius: 2px;"></div>
        </div>
        """, unsafe_allow_html=True)
        
        # Selectbox (Styled by CSS above)
        app_type = st.selectbox(
            "Select App Industry",
            ["🍔 Food Delivery App", "🛒 Shopping / E-commerce App", "📚 Learning / Education App"],
            index=0,
            label_visibility="collapsed"
        )
        
        # Active Info Text (Distinct visual feedback)
        st.markdown(f"""
        <div style="
            margin-top: 15px; 
            padding: 12px; 
            background: rgba(255,255,255,0.08); 
            border-radius: 8px; 
            border-left: 3px solid #64FFDA;
        ">
            <p style="color: #E0F2F1; font-size: 12px; margin: 0; line-height: 1.4;">
                <span style="opacity: 0.7;">Currently displaying insights for:</span><br/>
                <strong style="color: #64FFDA; font-size: 13px; letter-spacing: 0.3px;">{app_type}</strong>
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        # 3. NAVIGATION (No Title)
        selected_page = st.radio(
            "Navigate", 
            ["📊  Dashboard", "🧪  Retention Simulator", "📂  Upload Data", "📍  Churn by Location", "📘  Retention Playbook", "🧠  AI Weekly Action Brief"],
            label_visibility="collapsed"
        )
        
        st.markdown("---")
        
        # Pro Tip
        st.markdown("""
        <div class="pro-tip-box">
            <div class="pro-tip-title">
                <span style="margin-right: 8px; font-size: 16px;">💡</span> PRO TIP
            </div>
            <p class="pro-tip-text">
                Check <b>'Retention Playbook'</b> to see action plans.
            </p>
        </div>
        """, unsafe_allow_html=True)

    # --- ROUTING WITH DYNAMIC BACKGROUNDS ---
    # Dashboard -> #F3F4F6 (Cool Gray)
    # Retention Simulator -> #F0F9FF (Light Sky)
    # Upload Data -> #F5F3FF (Light Violet)
    # Churn by Location -> #ECFEFF (Light Cyan)
    # Retention Playbook -> #FFF1F2 (Light Rose)
    # AI Weekly Action Brief -> #FDF4FF (Light Fuchsia)

    # --- ROUTING WITH DYNAMIC BACKGROUNDS ---
    # Dashboard -> #F9FAFB (Gray 50)
    # Simulator -> #F8FAFC (Slate 50)
    # Upload -> #FFFFFF (White)
    # Churn by Location -> #ECFEFF (Cyan 50)
    # Playbook -> #FFF7ED (Orange 50)
    # AI Brief -> #F5F3FF (Violet 50)

    # --- ROUTING WITH DYNAMIC BACKGROUNDS ---
    # Dashboard -> #EFF6FF (Blue 50)
    # Simulator -> #F0FDFA (Teal 50)
    # Upload -> #F8FAFC (Slate 50)
    # Churn by Location -> #ECFEFF (Cyan 50)
    # Playbook -> #EEF2FF (Indigo 50)
    # AI Brief -> #F5F3FF (Violet 50)

    # --- ROUTING WITH DYNAMIC BACKGROUNDS (PROFESSIONAL SLATE/GRAY) ---
    # Dashboard -> #F8FAFC (Slate 50)
    # Simulator -> #F1F5F9 (Slate 100)
    # Upload -> #FFFFFF (White)
    # Churn by Location -> #F0F9FF (Sky 50 - Very Subtle)
    # Playbook -> #FAFAF9 (Stone 50)
    # AI Brief -> #F3F4F6 (Gray 100)

    # --- ROUTING WITH DYNAMIC BACKGROUNDS (INDIGO/VIOLET TINTS) ---
    # Dashboard -> #EEF2FF (Indigo 50)
    # Simulator -> #F5F3FF (Violet 50)
    # Upload -> #FFFFFF (White)
    # Churn by Location -> #ECFEFF (Cyan 50)
    # Playbook -> #FFF1F2 (Rose 50)
    # AI Brief -> #F0F9FF (Sky 50)

    # --- ROUTING WITH DYNAMIC BACKGROUNDS (GREEN PALETTE) ---
    # Dashboard -> #ECFDF5 (Mint 50)
    # Simulator -> #F0FDF4 (Green 50)
    # Upload -> #FFFFFF (White)
    # Churn by Location -> #F1F8E9 (Light Green 50)
    # Playbook -> #ECFDF5 (Mint 50)
    # AI Brief -> #F0FDF4 (Green 50)

    if "Dashboard" in selected_page:
        set_bg("#ECFDF5")
        render_dashboard(model, app_type)
    elif "Simulator" in selected_page:
        set_bg("#F0FDF4")
        render_simulator(model, app_type)
    elif "Upload" in selected_page:
        set_bg("#FFFFFF")
        render_upload()
    elif "Churn by Location" in selected_page:
        set_bg("#F1F8E9")
        render_churn_by_location(model, app_type)
    elif "Retention Playbook" in selected_page:
        set_bg("#ECFDF5")
        render_retention_playbook(model, app_type)
    elif "AI Weekly Action Brief" in selected_page:
        set_bg("#F0FDF4")
        render_ai_weekly_brief(model, app_type)

def render_dashboard(model, app_type):
    # Header
    st.markdown(f"""
    <div class='header-container'>
        <div>
            <h1 class='header-title'>Dashboard Overview</h1>
            <p class='header-subtitle'>Real-time insights for <b>{app_type.split(' ')[1]}</b> customers.</p>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    # Try loading default data if nothing in session state
    if 'data' not in st.session_state:
        st.session_state['data'] = load_sample_data()
    
    if st.session_state['data'] is None:
        st.warning("Please upload data in the 'Data Upload' tab first.")
        return

    # Use raw_df from session state
    raw_df = st.session_state['data']
    
    # Process Predictions if not present (Modifies raw_df in place, usually one-time)
    if model and 'Churn_Prediction' not in raw_df.columns:
        process_predictions(raw_df, model)

    # --- 🧠 RISK SCORING ENGINE INTEGRATION ---
    # Use Cached Pipeline to get Risk Scores without re-calculating on every rerun
    # We pass a copy to avoid mutating the session_state['data'] with view-specific columns if possible,
    # or just to rely on cache hashing the input 'raw_df'.
    df = process_data_pipeline(raw_df, app_type)

    # --- KPI ROW ---
    st.markdown("### 📊 Key Performance Indicators")
    
    # Main Stats
    kpi1, kpi2, kpi3, kpi4, kpi5 = st.columns(5)
    
    total = len(df)
    churn = df['Churn_Prediction'].sum() if 'Churn_Prediction' in df.columns else 0
    
    # Calculate Risk Counts
    high_risk_count = len(df[df['Risk Level'] == 'High Risk'])
    med_risk_count = len(df[df['Risk Level'] == 'Medium Risk'])
    low_risk_count = len(df[df['Risk Level'] == 'Low Risk'])
    
    # Display Main KPIs with Custom Cards
    with kpi1:
        st.markdown(f"""
        <div class="snapshot-card bg-white">
            <div class="card-title">Total Customers</div>
            <div class="card-value">{total:,}</div>
            <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                <span>Steady</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with kpi2:
        st.markdown(f"""
        <div class="snapshot-card bg-red-tint">
            <div class="card-title">High Risk Users</div>
            <div class="card-value">{high_risk_count}</div>
            <div class="card-delta" style="background-color: rgba(198, 40, 40, 0.1); color: #C62828;">
                <span>{(high_risk_count/total*100):.1f}% of base</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with kpi3:
        st.markdown(f"""
        <div class="snapshot-card bg-orange-tint">
            <div class="card-title">Medium Risk</div>
            <div class="card-value">{med_risk_count}</div>
            <div class="card-delta" style="background-color: rgba(239, 108, 0, 0.1); color: #EF6C00;">
                <span>Needs Nurturing</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with kpi4:
         st.markdown(f"""
        <div class="snapshot-card bg-teal-tint">
            <div class="card-title">Low Risk (Safe)</div>
            <div class="card-value">{low_risk_count}</div>
            <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                <span>Stable</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
         
    # Industry Metric (Dynamic)
    k5_label = "Avg Score"
    k5_val = f"{df['Churn Risk Score'].mean():.1f}"
    
    if "Food" in app_type:
        k5_label = "Avg Delivery Delay"
        k5_val = f"{df['avg_delivery_delay_mins'].mean():.1f} min"
    elif "Shopping" in app_type:
        k5_label = "Cart Abandon Rate"
        rate = (len(df[df['cart_abandon_count']>0])/total * 100)
        k5_val = f"{rate:.1f}%"
    elif "Learning" in app_type:
        k5_label = "Avg Course Progress"
        k5_val = f"{df['course_progress_percent'].mean():.1f}%"

    with kpi5:
         st.markdown(f"""
        <div class="snapshot-card bg-blue-tint">
            <div class="card-title">{k5_label}</div>
            <div class="card-value" style="font-size: 24px;">{k5_val}</div>
            <div class="card-delta" style="background-color: rgba(21, 101, 192, 0.1); color: #1565C0;">
                <span>Industry Key Metric</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("#### 🚀 Industry Specific Metrics")
    m1, m2, m3, m4 = st.columns(4)
    if "Food" in app_type:
        with m1:
             st.markdown(f"""
            <div class="snapshot-card bg-white">
                <div class="card-title">Avg Orders/User</div>
                <div class="card-value">4.2</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>+0.5</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with m2:
             st.markdown(f"""
            <div class="snapshot-card bg-orange-tint">
                <div class="card-title">Delivery Issues</div>
                <div class="card-value">2.1%</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>-0.4%</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with m3:
             st.markdown(f"""
            <div class="snapshot-card bg-teal-tint">
                <div class="card-title">Avg Rating</div>
                <div class="card-value">4.5⭐</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>Steady</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with m4:
             st.markdown(f"""
            <div class="snapshot-card bg-red-tint">
                <div class="card-title">Late Deliveries</div>
                <div class="card-value">12</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>-2</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
    elif "Shopping" in app_type:
        with m1:
             st.markdown(f"""
            <div class="snapshot-card bg-red-tint">
                <div class="card-title">Cart Abandon Rate</div>
                <div class="card-value">65%</div>
                <div class="card-delta" style="background-color: rgba(198, 40, 40, 0.1); color: #C62828;">
                    <span>+2%</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with m2:
             st.markdown(f"""
            <div class="snapshot-card bg-orange-tint">
                <div class="card-title">Return Rate</div>
                <div class="card-value">8.4%</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>-1.2%</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with m3:
             st.markdown(f"""
            <div class="snapshot-card bg-teal-tint">
                <div class="card-title">Avg Basket Size</div>
                <div class="card-value">$45</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>+$5</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with m4:
             st.markdown(f"""
            <div class="snapshot-card bg-blue-tint">
                <div class="card-title">Repeat Buyers</div>
                <div class="card-value">32%</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>+4%</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
    elif "Learning" in app_type:
        with m1:
             st.markdown(f"""
            <div class="snapshot-card bg-white">
                <div class="card-title">Course Completion</div>
                <div class="card-value">18%</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>+1%</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with m2:
             st.markdown(f"""
            <div class="snapshot-card bg-orange-tint">
                <div class="card-title">Drop-out Risk</div>
                <div class="card-value">12%</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>-0.5%</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with m3:
             st.markdown(f"""
            <div class="snapshot-card bg-teal-tint">
                <div class="card-title">Avg Quiz Score</div>
                <div class="card-value">76%</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>+3%</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        with m4:
             st.markdown(f"""
            <div class="snapshot-card bg-blue-tint">
                <div class="card-title">Certificates Issued</div>
                <div class="card-value">1,204</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>+50</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # --- CHARTS ROW ---
    c1, c2 = st.columns([0.65, 0.35])
    
    with c1:
        st.markdown("**📉 Churn Trend by Month**")
        # Synthetic date grouping
        # Data Processing for Trend
        date_col = 'date' if 'date' in df.columns else ('joining_date' if 'joining_date' in df.columns else None)
        churn_col = 'churn' if 'churn' in df.columns else 'Churn_Prediction'

        if date_col and churn_col in df.columns:
            try:
                # 1. Prepare Data
                trend_df = df.copy()
                trend_df[date_col] = pd.to_datetime(trend_df[date_col], errors='coerce')
                trend_df = trend_df.dropna(subset=[date_col]) # Remove rows with invalid dates
                
                # 2. Extract Month & Filter Churn
                trend_df['Month_Year'] = trend_df[date_col].dt.to_period('M').astype(str)
                churn_only = trend_df[trend_df[churn_col] == 1]
                
                # 3. Group by Month
                monthly_counts = churn_only.groupby('Month_Year').size().reset_index(name='Churn_Count')
                monthly_counts = monthly_counts.sort_values('Month_Year')

                if not monthly_counts.empty:
                    # 4. Create Line Chart
                    fig_trend = px.line(
                        monthly_counts, 
                        x='Month_Year', 
                        y='Churn_Count',
                        markers=True,
                        template="plotly_white",
                        line_shape='spline' # Smooth line
                    )
                    
                    # 5. Styling
                    fig_trend.update_traces(
                        line_color='#FF7043', # Soft Red/Orange for Churn
                        line_width=3,
                        marker=dict(size=8, color='#D84315', line=dict(width=2, color='white'))
                    )
                    
                    fig_trend.update_layout(
                        xaxis_title="Month",
                        yaxis_title="Churned Customers",
                        margin=dict(l=20, r=20, t=10, b=20),
                        paper_bgcolor='rgba(0,0,0,0)', 
                        plot_bgcolor='rgba(0,0,0,0)',
                        hovermode="x unified"
                    )
                    
                    st.plotly_chart(fig_trend, use_container_width=True)
                else:
                    st.info("No churned customers found in the selected period.")

            except Exception as e:
                st.error(f"Could not load trend graph: {e}")
        else:
            st.warning("⚠️ Date column is required to show churn trend.")

    with c2:
        st.markdown("**🥧 Churn Customers by Subscription Type**")
        
        # Check if subscription column exists
        if 'subscription_type' in df.columns:
            # Logic: Filter only Churn=1 (Left customers)
            churn_col_pie = 'churn' if 'churn' in df.columns else 'Churn_Prediction'
            
            # Using simple India English comments for clarity
            # First we separate only people who left
            churned_users = df[df[churn_col_pie] == 1]
            
            if not churned_users.empty:
                # Count how many left in each plan
                pie_data = churned_users.groupby('subscription_type').size().reset_index(name='Count')
                
                # Define colors: Free (High Risk) -> Red, Basic -> Yellow, Premium (Low Risk) -> Green
                color_map = {
                    'Free': '#FF7043',   # Orange/Red (High Churn)
                    'Basic': '#FFCA28',  # Amber/Yellow
                    'Premium': '#66BB6A', # Green (Safe/Premium)
                    'Standard': '#FFCA28', # Fallback
                    '0': '#FF7043', '1': '#FFCA28', '2': '#66BB6A' # Fallback for encoded
                }

                fig_pie = px.pie(
                    pie_data, 
                    names='subscription_type', 
                    values='Count',
                    color='subscription_type',
                    color_discrete_map=color_map,
                    hole=0.4, # Donut style looks more premium
                )
                
                fig_pie.update_traces(
                    textinfo='percent+label',
                    hoverinfo='label+percent+value',
                    marker=dict(line=dict(color='#FFFFFF', width=2)) # Clean borders
                )
                
                fig_pie.update_layout(
                    showlegend=False, # Hide legend to keep it clean, labels are enough
                    margin=dict(l=20, r=20, t=20, b=20),
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    annotations=[dict(text='Churn', x=0.5, y=0.5, font_size=12, showarrow=False)]
                )
                
                st.plotly_chart(fig_pie, use_container_width=True)
            else:
                st.info("Great! No churned customers to show.")
        else:
            st.warning("⚠️ Subscription type data is required for churn analysis")

    # --- HIGH RISK TABLE ---
    st.markdown("### 📋 High Risk Level Customers (Risk Score > 60)")
    
    # Filter for High Risk OR Churn Prediction = 1
    # We prioritize showing High Risk customers based on our new score
    high_risk_df = df[df['Risk Level'] == 'High Risk'].copy()
    
    if not high_risk_df.empty:
        # Sort by Risk Score descending
        high_risk_df = high_risk_df.sort_values(by='Churn Risk Score', ascending=False)
        
        # Add Reasoning
        high_risk_df['Reason'] = high_risk_df.apply(lambda x: get_churn_reason(x, app_type), axis=1)
        high_risk_df['Recommendation'] = high_risk_df.apply(lambda x: get_recommendation(x, app_type), axis=1)

        # Columns to show
        cols_to_show = ['customer_id', 'Risk Level', 'Churn Risk Score', 'Reason', 'Recommendation']
        if 'Churn_Prediction' in high_risk_df.columns:
            cols_to_show.insert(2, 'Churn_Prediction')

        # Styled Dataframe
        # Use simple color coding
        def highlight_risk(val):
            color = '#FFEBEE' if val == 'High Risk' else '#FFF3E0' if val == 'Medium Risk' else '#E8F5E9'
            return f'background-color: {color}; color: black'

        st.dataframe(
            high_risk_df[cols_to_show].style.applymap(highlight_risk, subset=['Risk Level']),
            use_container_width=True,
            hide_index=True,
            column_config={
                "Churn Risk Score": st.column_config.ProgressColumn(
                    "Risk Score",
                    help="Score from 0 to 100",
                    format="%d",
                    min_value=0,
                    max_value=100,
                ),
            }
        )
    else:
        st.success("🎉 No High Risk customers detected!")

def render_upload():
    st.subheader("📂 Upload New Data")
    file = st.file_uploader("Drop your Excel/CSV here", type=['xlsx', 'csv'])
    if file:
        if file.name.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)
        st.session_state['data'] = df
        st.success("File uploaded successfully! Go to 'Dashboard' to view insights.")
        st.dataframe(df.head())

# --- NEW PAGE: CHURN BY LOCATION ---
def render_churn_by_location(model, app_type):
    # 1. Page Header with Visual Polish
    st.markdown(f"""
    <div style="margin-bottom: 20px;">
        <h1 style="color: #004D40; font-family: Inter, sans-serif; font-weight: 700; margin-bottom: 5px;">
            📍 Churn Heatmap by Location
        </h1>
        <p style="color: #616161; font-size: 16px; margin: 0;">
            Identify high-churn areas to take targeted local actions.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # 2. Data Validation
    if 'data' not in st.session_state:
        st.warning("⚠️ Please upload data in the 'Upload Data' tab to see location insights.")
        return
        
    df = st.session_state['data'].copy()
    
    # Check for Location Column
    possible_loc_cols = ['City', 'city', 'Region', 'region', 'Locality', 'locality', 'Location', 'location']
    loc_col = next((col for col in possible_loc_cols if col in df.columns), None)
    
    if not loc_col:
        st.error(f"❌ Location data (City/Region/Locality) is required. Missing in: {list(df.columns)}")
        return
        
    # Ensure advanced columns exist (Action-oriented data)
    df = ensure_columns_exist(df, app_type)
        
    # 3. Processing Churn Data
    if 'Churn_Prediction' not in df.columns:
        if model:
            process_predictions(df, model)
    
    churn_col = 'Churn_Prediction' if 'Churn_Prediction' in df.columns else ('churn' if 'churn' in df.columns else None)
    
    # Fallback simulation if no churn data (just to show tool works for demo)
    if not churn_col:
        if 'Exited' in df.columns:
            churn_col = 'Exited'
        else:
            st.warning("⚠️ Churn data not found. Simulating so you can see the dashboard features.")
            import numpy as np
            df['Churn_Prediction'] = np.random.randint(0, 2, df.shape[0])
            churn_col = 'Churn_Prediction'

    # 4. Aggregate Data by Location
    location_stats = df.groupby(loc_col).agg(
        Total_Customers=('customer_id', 'count') if 'customer_id' in df.columns else (loc_col, 'count'),
        Churn_Count=(churn_col, 'sum')
    ).reset_index()
    
    location_stats['Churn_Percentage'] = (location_stats['Churn_Count'] / location_stats['Total_Customers']) * 100
    location_stats = location_stats.sort_values(by='Churn_Percentage', ascending=False)
    
    # 5. KPI Summary Cards
    st.markdown("### 📊 Regional Performance Overview")
    k1, k2, k3 = st.columns(3)
    
    if not location_stats.empty:
        highest_churn_loc = location_stats.iloc[0]
        lowest_churn_loc = location_stats.iloc[-1]
        avg_churn = location_stats['Churn_Percentage'].mean()
        
        # Custom Cards for Regional KPIs
        with k1:
             st.markdown(f"""
            <div class="snapshot-card bg-red-tint">
                <div class="card-title">🛑 Highest Churn Area</div>
                <div class="card-value" style="font-size: 24px;">{highest_churn_loc[loc_col]}</div>
                <div class="card-delta" style="background-color: rgba(198, 40, 40, 0.1); color: #C62828;">
                    <span>{highest_churn_loc['Churn_Percentage']:.1f}% Churn</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

        with k2: # Swapped k2 and k3 in display logic for better flow (Highest -> Avg -> Lowest)
             st.markdown(f"""
            <div class="snapshot-card bg-blue-tint">
                <div class="card-title">🌍 Avg Regional Churn</div>
                <div class="card-value">{avg_churn:.1f}%</div>
                <div class="card-delta" style="background-color: rgba(21, 101, 192, 0.1); color: #1565C0;">
                    <span>Average</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
            
        with k3:
             st.markdown(f"""
            <div class="snapshot-card bg-teal-tint">
                <div class="card-title">✅ Lowest Churn Area</div>
                <div class="card-value" style="font-size: 24px;">{lowest_churn_loc[loc_col]}</div>
                <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                    <span>{lowest_churn_loc['Churn_Percentage']:.1f}% Churn</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # 6. MAP VISUALIZATION SECTION
    m_col1, m_col2 = st.columns([0.75, 0.25])
    
    with m_col1:
        st.subheader("🗺️ Geo Churn Intelligence Map")
        location_stats['lat'], location_stats['lon'] = zip(*location_stats[loc_col].apply(get_lat_lon))
        map_data = location_stats.dropna(subset=['lat', 'lon'])
        
        if not map_data.empty:
            fig_map = px.scatter_mapbox(
                map_data,
                lat="lat", lon="lon",
                size="Total_Customers",
                color="Churn_Percentage",
                color_continuous_scale=["#388e3c", "#ffa000", "#d32f2f"], # Green -> Orange -> Red
                range_color=[0, 100],
                hover_name=loc_col,
                hover_data={"lat": False, "lon": False, "Total_Customers": True, "Churn_Count": True, "Churn_Percentage": ':.1f'},
                zoom=3.5, center={"lat": 20.5937, "lon": 78.9629},
                height=500
            )
            fig_map.update_layout(mapbox_style="carto-positron", margin={"r":0,"t":0,"l":0,"b":0})
            st.plotly_chart(fig_map, use_container_width=True)
        else:
            st.warning("⚠️ Map data unavailable. Showing bar chart.")
            st.bar_chart(location_stats.set_index(loc_col)['Churn_Percentage'])

    with m_col2:
        st.markdown("### 💡 AI Insights")
        if not location_stats.empty:
            risk_zones = location_stats[location_stats['Churn_Percentage'] > 60][loc_col].head(3).tolist()
            if risk_zones:
                st.markdown(f"""
                <div style="background-color: #FFEBEE; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="color: #C62828; font-weight: 600; margin-bottom: 5px;">⚠️ High Risk Zones</p>
                    <p style="font-size: 13px; margin: 0;">High churn observed in <b>{', '.join(risk_zones)}</b>. Immediate action required.</p>
                </div>
                """, unsafe_allow_html=True)
            else:
                 st.success("All regions are currently stable (<60% Churn).")
                 
        st.info("Top Action: Improve support in Red Zones.")

    st.markdown("---")

    # --- FEATURE 1: LOCATION-WISE ROOT CAUSE BREAKDOWN ---
    st.subheader("🧩 Location-wise Analyis & Root Cause Breakdown")
    
    rc_col1, rc_col2 = st.columns([0.3, 0.7])
    
    with rc_col1:
        st.markdown("**Select Region to Analyze:**")
        # Dropdown to select City
        city_list = sorted(location_stats[loc_col].unique().tolist())
        selected_city = st.selectbox("Choose City", city_list, index=0)
        
        # Get City Stats
        city_data = location_stats[location_stats[loc_col] == selected_city].iloc[0]
        st.metric("Total Customers", f"{city_data['Total_Customers']}")
        st.metric("Churned Customers", f"{city_data['Churn_Count']}")
        st.metric("Churn Rate", f"{city_data['Churn_Percentage']:.1f}%", 
                 delta="-Critical" if city_data['Churn_Percentage'] > 50 else "Stable", delta_color="inverse")

    with rc_col2:
        st.markdown(f"**📉 Why are customers leaving {selected_city}?**")
        
        # Filter raw df for this city AND Churn=1
        city_churn_df = df[(df[loc_col] == selected_city) & (df[churn_col] == 1)]
        
        if not city_churn_df.empty:
            # Logic for reasons
            reasons = {
                "Delivery Delay (>40 min)": 0,
                "Low App Rating (<3 ⭐)": 0,
                "Low Engagement (<5 days)": 0,
                "Low Orders (<3 orders)": 0,
                "Support Issues (>3 tickets)": 0
            }
            
            # Count matches
            # Note: We rely on ensure_columns_exist providing these columns
            if 'avg_delivery_delay_mins' in city_churn_df.columns:
                 reasons["Delivery Delay (>40 min)"] = len(city_churn_df[city_churn_df['avg_delivery_delay_mins'] > 40])
            
            if 'app_rating' in city_churn_df.columns:
                 reasons["Low App Rating (<3 ⭐)"] = len(city_churn_df[city_churn_df['app_rating'] < 3])
                 
            if 'login_days' in city_churn_df.columns:
                 reasons["Low Engagement (<5 days)"] = len(city_churn_df[city_churn_df['login_days'] < 5])
                 
            if 'orders_count' in city_churn_df.columns:
                 reasons["Low Orders (<3 orders)"] = len(city_churn_df[city_churn_df['orders_count'] < 3])
            elif 'login_days' in city_churn_df.columns: # fallback proxy
                 reasons["Low Orders (<3 orders)"] = len(city_churn_df[city_churn_df['login_days'] < 3])
                 
            if 'support_tickets' in city_churn_df.columns:
                 reasons["Support Issues (>3 tickets)"] = len(city_churn_df[city_churn_df['support_tickets'] >= 3])

            # Convert to DataFrame for Plotly
            reason_df = pd.DataFrame(list(reasons.items()), columns=['Reason', 'Count'])
            # Filter non-zero
            reason_df = reason_df[reason_df['Count'] > 0]
            
            if not reason_df.empty:
                fig_pie = px.pie(
                    reason_df, values='Count', names='Reason',
                    hole=0.4,
                    color_discrete_sequence=px.colors.sequential.RdBu
                )
                fig_pie.update_traces(textinfo='percent+label')
                st.plotly_chart(fig_pie, use_container_width=True)
            else:
                st.info("No specific patterns detected in this city (Data variance high).")
        else:
            st.success(f"No churned customers in {selected_city} to analyze!")

    st.markdown("---")

    # --- FEATURE 2 & 3: RANKING & COST ESTIMATOR ---
    c_rank, c_cost = st.columns([0.6, 0.4])
    
    with c_rank:
        st.subheader("🏆 Location Risk Ranking")
        
        # Prepare Table Data
        ranking_df = location_stats.copy()
        ranking_df['Rank'] = range(1, len(ranking_df) + 1)
        
        def get_risk_tag(pct):
            if pct > 60: return "🔴 High"
            elif pct > 30: return "🟠 Medium"
            else: return "🟢 Low"
            
        ranking_df['Risk Level'] = ranking_df['Churn_Percentage'].apply(get_risk_tag)
        
        # Reorder columns
        ranking_df = ranking_df[['Rank', loc_col, 'Total_Customers', 'Churn_Count', 'Churn_Percentage', 'Risk Level']]
        
        # Rename for display
        ranking_df.columns = ['Rank', 'City', 'Total Users', 'Churn Users', 'Churn %', 'Risk Level']
        
        # Custom Style (Replacing maplotlib dependency with simple text/color logic in streamlt)
        # We assume standard dataframe display for now which is clean
        st.dataframe(
            ranking_df,
            hide_index=True,
            use_container_width=True,
            column_config={
                "Churn %": st.column_config.NumberColumn(format="%.1f%%"),
                "Rank": st.column_config.NumberColumn(format="%d")
            }
        )

    with c_cost:
        st.subheader("💰 Retention Cost Estimator")
        st.markdown("*Goal: Save 20% of Churned Users*")
        
        # Logic: 
        # target_save = churn_count * 0.2
        # cost = target_save * 50 INR
        
        cost_df = location_stats.copy()
        cost_df['Target_Save'] = (cost_df['Churn_Count'] * 0.20).astype(int)
        cost_df['Est_Cost'] = cost_df['Target_Save'] * 50
        
        # Sort by ROI? Or just by Churn Count (where we can make most impact)
        # User asked: "City | Current Churn | Customers Can Be Saved | Est Cost"
        display_cost = cost_df[[loc_col, 'Churn_Count', 'Target_Save', 'Est_Cost']]
        display_cost.columns = ['City', 'Churn Users', 'Can Save (Est)', 'Est Cost (₹)']
        
        st.dataframe(
            display_cost,
            hide_index=True,
            use_container_width=True,
            column_config={
                 "Est Cost (₹)": st.column_config.NumberColumn(format="₹ %d"),
                 "Can Save (Est)": st.column_config.NumberColumn(help="Estimated 20% recovery rate")
            }
        )
        
        total_cost = cost_df['Est_Cost'].sum()
        total_saved = cost_df['Target_Save'].sum()
        
        st.info(f"💡 **Total Opportunity:** Spend **₹{total_cost:,}** to save approx **{total_saved:,}** customers globally.")


def render_simulator(model, app_type):
    st.markdown(f"""
    <div>
        <h1 style='color: #004D40; font-family: Inter, sans-serif; margin-bottom: 5px;'>🧪 Retention Action Simulator</h1>
        <p style='color: #546E7A; font-size: 16px; margin-top: 0;'>Test retention strategies for <b>{app_type.split(' ')[1]}</b> before applying them.</p>
    </div>
    """, unsafe_allow_html=True)
    
    if 'data' not in st.session_state:
        st.warning("⚠️ Please upload data in the 'Data Upload' tab first.")
        return

    df = st.session_state['data']
    
    # Ensure Risk Scores are present
    if 'Churn Risk Score' not in df.columns:
         if model and 'Churn_Prediction' not in df.columns:
            process_predictions(df, model)
         df = ensure_columns_exist(df, app_type)
         df['Churn Risk Score'] = df.apply(lambda row: calculate_risk_score(row, app_type), axis=1)
         df['Risk Level'] = df['Churn Risk Score'].apply(classify_risk_level)
         st.session_state['data'] = df

    # --- SECTION 2: CURRENT SITUATION ---
    st.markdown("### 1️⃣ Current Situation Summary")
    
    # Calculate Current Stats
    total = len(df)
    high_risk = len(df[df['Risk Level'] == 'High Risk'])
    med_risk = len(df[df['Risk Level'] == 'Medium Risk'])
    
    # Visual KPI Row
    k1, k2, k3, k4 = st.columns(4)
    
    with k1:
         st.markdown(f"""
        <div class="snapshot-card bg-white">
            <div class="card-title">Total Customers</div>
            <div class="card-value">{total:,}</div>
            <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                <span>User Base</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with k2:
         st.markdown(f"""
        <div class="snapshot-card bg-red-tint">
            <div class="card-title">High Risk Users</div>
            <div class="card-value">{high_risk:,}</div>
            <div class="card-delta" style="background-color: rgba(198, 40, 40, 0.1); color: #C62828;">
                <span>Critical</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with k3:
         st.markdown(f"""
        <div class="snapshot-card bg-orange-tint">
            <div class="card-title">Medium Risk</div>
            <div class="card-value">{med_risk:,}</div>
            <div class="card-delta" style="background-color: rgba(239, 108, 0, 0.1); color: #EF6C00;">
                <span>Warning</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    current_churn_pred = df['Churn_Prediction'].sum() if 'Churn_Prediction' in df.columns else 0
    with k4:
         st.markdown(f"""
        <div class="snapshot-card bg-blue-tint">
            <div class="card-title">Predicted Churn</div>
            <div class="card-value">{current_churn_pred}</div>
            <div class="card-delta" style="background-color: rgba(21, 101, 192, 0.1); color: #1565C0;">
                <span>ML Forecast</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")

    # --- SECTION 3 & 4: ACTION & STRENGTH ---
    st.markdown("### 2️⃣ Configure Simulation")
    
    c1, c2, c3 = st.columns([1, 1, 1])
    
    with c1:
        actions = get_available_actions(app_type)
        selected_action = st.selectbox("Select Retention Action", actions)
        
    with c2:
        strength = st.select_slider(
            "Select Action Strength",
            options=["Low", "Medium", "High"],
            value="Medium",
            help="Higher strength means more aggressive offers (e.g. Higher Discount)"
        )
        
    with c3:
        st.write("") 
        st.write("") 
        simulate_btn = st.button("🚀 Simulate Impact", use_container_width=True, type="primary")

    # --- SIMULATION LOGIC ---
    if simulate_btn:
        with st.spinner("Running predictive simulation..."):
            sim_df = simulate_retention_campaign(df, app_type, selected_action, strength)
            
            st.markdown("---")
            st.markdown(f"### 🎯 Simulation Results: {selected_action} ({strength} Intensity)")
            
            new_high_risk = len(sim_df[sim_df['Risk Level'] == 'High Risk'])
            saved_high_risk = high_risk - new_high_risk
            
            res1, res2, res3 = st.columns(3)
            
            with res1:
                 st.markdown(f"""
                <div class="snapshot-card bg-teal-tint">
                    <div class="card-title">Estimated Saved</div>
                    <div class="card-value">+{saved_high_risk}</div>
                    <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                        <span>Positive Impact</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
            with res2:
                 st.markdown(f"""
                <div class="snapshot-card bg-white">
                    <div class="card-title">New High Risk Count</div>
                    <div class="card-value">{new_high_risk}</div>
                    <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                        <span>-{saved_high_risk} Reduction</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
            
            old_avg = df['Churn Risk Score'].mean()
            new_avg = sim_df['Churn Risk Score'].mean()
            reduction = ((old_avg - new_avg) / old_avg * 100) if old_avg > 0 else 0
            
            with res3:
                 st.markdown(f"""
                <div class="snapshot-card bg-blue-tint">
                    <div class="card-title">Avg Risk Score</div>
                    <div class="card-value">{new_avg:.1f}</div>
                    <div class="card-delta" style="background-color: rgba(21, 101, 192, 0.1); color: #1565C0;">
                        <span>-{reduction:.1f}% Improvement</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
            
            st.markdown("#### 📊 Impact Visualization (Before vs After)")
            
            risk_counts_before = df['Risk Level'].value_counts().reindex(['High Risk', 'Medium Risk', 'Low Risk'], fill_value=0)
            risk_counts_after = sim_df['Risk Level'].value_counts().reindex(['High Risk', 'Medium Risk', 'Low Risk'], fill_value=0)
            
            comp_df = pd.DataFrame({
                'Risk Level': ['High Risk', 'Medium Risk', 'Low Risk'],
                'Before': risk_counts_before.values,
                'After': risk_counts_after.values
            })
            
            comp_melted = comp_df.melt(id_vars='Risk Level', var_name='Scenario', value_name='Count')
            
            fig_comp = px.bar(
                comp_melted, 
                x='Risk Level', 
                y='Count', 
                color='Scenario',
                barmode='group',
                color_discrete_map={'Before': '#B0BEC5', 'After': '#00C853'},
                title="Risk Distribution Change",
                template="plotly_white"
            )
            fig_comp.update_layout(plot_bgcolor='rgba(0,0,0,0)')
            
            st.plotly_chart(fig_comp, use_container_width=True)
            
            st.success(f"✅ Success! Implementing '{selected_action}' at {strength} strength could save {saved_high_risk} high-risk customers.")

# --- NEW PAGE: RETENTION PLAYBOOK ---
def render_retention_playbook(model, app_type):
    # 1. Page Header
    st.markdown(f"""
    <div style="margin-bottom: 20px;">
        <h1 style="color: #004D40; font-family: Inter, sans-serif; font-weight: 700; margin-bottom: 5px;">
            📘 Retention Playbook
        </h1>
        <p style="color: #616161; font-size: 16px; margin: 0;">
            Clear actions to reduce customer churn for <b>{app_type.split(' ')[1]}</b>.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    if 'data' not in st.session_state:
        st.warning("⚠️ Please upload data in the 'Upload Data' tab to access the playbook.")
        return
        
    df = st.session_state['data']
    
    # Ensure Analysis Columns
    df = ensure_columns_exist(df, app_type)
    
    # Make sure we have risk levels
    if 'Risk Level' not in df.columns:
        if model and 'Churn_Prediction' not in df.columns:
            process_predictions(df, model)
        df['Churn Risk Score'] = df.apply(lambda row: calculate_risk_score(row, app_type), axis=1)
        df['Risk Level'] = df['Churn Risk Score'].apply(classify_risk_level)

    # 2. Risk Segment Overview
    high_risk = len(df[df['Risk Level'] == 'High Risk'])
    med_risk = len(df[df['Risk Level'] == 'Medium Risk'])
    low_risk = len(df[df['Risk Level'] == 'Low Risk'])
    
    st.markdown("### 📊 Risk Segment Overview")
    k1, k2, k3 = st.columns(3)
    
    with k1:
         st.markdown(f"""
        <div class="snapshot-card bg-red-tint">
            <div class="card-title">🔴 High Risk (Immediate Action)</div>
            <div class="card-value">{high_risk}</div>
            <div class="card-delta" style="background-color: rgba(198, 40, 40, 0.1); color: #C62828;">
                <span>{(high_risk/len(df)*100):.1f}% of base</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with k2:
         st.markdown(f"""
        <div class="snapshot-card bg-orange-tint">
            <div class="card-title">🟠 Medium Risk (Preventive)</div>
            <div class="card-value">{med_risk}</div>
            <div class="card-delta" style="background-color: rgba(239, 108, 0, 0.1); color: #EF6C00;">
                <span>Needs Nurturing</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with k3:
         st.markdown(f"""
        <div class="snapshot-card bg-teal-tint">
            <div class="card-title">🟢 Low Risk (Safe)</div>
            <div class="card-value">{low_risk}</div>
            <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                <span>Loyal Users</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # 3. Action Cards Logic (Industry Specific)
    
    # Define Actions based on industry
    actions_db = {
        "Food": {
            "High": {"Action": "Personal Call + 50% Off Next Order", "Reason": "User faces delivery delays & low rating.", "Impact": "High probability of saving 30% users."},
            "Medium": {"Action": "Push Notification: 'Free Delivery Today'", "Reason": "Order frequency dropped slightly.", "Impact": "Encourages immediate re-order."},
            "Low": {"Action": "Send 'Foodie of the Month' Badge", "Reason": "User is loyal.", "Impact": "Strengthens emotional connection."}
        },
        "Shopping": {
            "High": {"Action": "Flash Sale Alert + Free Returns", "Reason": "Cart abandonment is high.", "Impact": "Removes friction for purchase."},
            "Medium": {"Action": "Email: 'Items in your wishlist are low stock'", "Reason": "Browsing but not buying.", "Impact": "Creates urgency."},
            "Low": {"Action": "Offer Early Access to New Sale", "Reason": "Consistent buyer.", "Impact": " Increases lifetime value."}
        },
        "Learning": {
            "High": {"Action": "Mentor Call + Free 1-Week Extension", "Reason": "Course progress stuck < 20%.", "Impact": "Re-engages stuck learners."},
            "Medium": {"Action": "WhatsApp: 'You are 2 days away from a streak'", "Reason": " irregular attendance.", "Impact": "Gamification drives return."},
            "Low": {"Action": "Certificate of Appreciation", "Reason": "Completing modules on time.", "Impact": "Social sharing = Referral."}
        }
    }
    
    # Determine key
    key = "Food" if "Food" in app_type else ("Shopping" if "Shopping" in app_type else "Learning")
    current_actions = actions_db[key]
    
    st.subheader("🚀 Action Plan Cards")
    
    # High Risk Card
    with st.container():
        st.markdown(f"""
        <div style="border: 1px solid #ffcdd2; border-left: 5px solid #c62828; padding: 15px; border-radius: 5px; background-color: #ffebee; margin-bottom: 10px;">
            <h3 style="color: #c62828; margin:0;">🔴 High Risk Action: {current_actions['High']['Action']}</h3>
            <p style="margin: 5px 0;"><b>Why?</b> {current_actions['High']['Reason']}</p>
            <p style="margin: 0; font-size: 14px; color: #555;"><i>Expected Impact: {current_actions['High']['Impact']}</i></p>
        </div>
        """, unsafe_allow_html=True)
        
    # Medium Risk Card
    with st.container():
        st.markdown(f"""
        <div style="border: 1px solid #ffe0b2; border-left: 5px solid #ef6c00; padding: 15px; border-radius: 5px; background-color: #fff3e0; margin-bottom: 10px;">
            <h3 style="color: #ef6c00; margin:0;">🟠 Medium Risk Action: {current_actions['Medium']['Action']}</h3>
            <p style="margin: 5px 0;"><b>Why?</b> {current_actions['Medium']['Reason']}</p>
            <p style="margin: 0; font-size: 14px; color: #555;"><i>Expected Impact: {current_actions['Medium']['Impact']}</i></p>
        </div>
        """, unsafe_allow_html=True)

    # Low Risk Card
    with st.container():
        st.markdown(f"""
        <div style="border: 1px solid #c8e6c9; border-left: 5px solid #2e7d32; padding: 15px; border-radius: 5px; background-color: #e8f5e9; margin-bottom: 20px;">
            <h3 style="color: #2e7d32; margin:0;">🟢 Low Risk Strategy: {current_actions['Low']['Action']}</h3>
            <p style="margin: 5px 0;"><b>Why?</b> {current_actions['Low']['Reason']}</p>
            <p style="margin: 0; font-size: 14px; color: #555;"><i>Expected Impact: {current_actions['Low']['Impact']}</i></p>
        </div>
        """, unsafe_allow_html=True)

# --- NEW PAGE: AI WEEKLY ACTION BRIEF ---
def render_ai_weekly_brief(model, app_type):
    # 1. Page Header
    st.markdown(f"""
    <div style="margin-bottom: 20px;">
        <h1 style="color: #004D40; font-family: Inter, sans-serif; font-weight: 700; margin-bottom: 5px;">
            🧠 AI Weekly Action Brief
        </h1>
        <p style="color: #616161; font-size: 16px; margin: 0;">
            Short, actionable insights for the week of <b>{datetime.now().strftime('%B %d, %Y')}</b>.
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    if 'data' not in st.session_state:
        st.warning("⚠️ Please upload data first.")
        return
        
    df = st.session_state['data']
    df = ensure_columns_exist(df, app_type)
    
    # Ensure Risk Scores
    if 'Risk Level' not in df.columns:
        if model and 'Churn_Prediction' not in df.columns:
            process_predictions(df, model)
        df['Churn Risk Score'] = df.apply(lambda row: calculate_risk_score(row, app_type), axis=1)
        df['Risk Level'] = df['Churn Risk Score'].apply(classify_risk_level)
    
    # 2. Weekly Snapshot Cards (Simulated "Change")
    # In a real app, we would compare with stored historical db.
    # Here we infer strictly from current data variance or simulate a trend.
    
    high_risk_count = len(df[df['Risk Level'] == 'High Risk'])
    # Simulate a "change" variable for demo purposes
    # e.g. "Increased by 5%"
    import random
    change_val = random.randint(-10, 15)
    delta_str = f"{change_val}%"
    delta_col = "normal" if change_val > 0 else "inverse" # Red if increased
    label_change = "High Risk Increase" if change_val > 0 else "High Risk Decrease"
    
    # Find most affected city
    if 'City' in df.columns or 'city' in df.columns:
        c_col = 'City' if 'City' in df.columns else 'city'
        worst_city = df.groupby(c_col).size().idxmax() # Just volume for now? No, use risk.
        # Check risk per city
        if 'Churn_Prediction' in df.columns:
             worst_city = df[df['Churn_Prediction']==1].groupby(c_col).size().idxmax()
    else:
        worst_city = "Unknown"
        
    # Find Top Reason
    # Simple heuristic
    top_reason = "General Usage Drop"
    if "Food" in app_type and df['avg_delivery_delay_mins'].mean() > 30:
        top_reason = "Delivery Delays"
    elif "Shopping" in app_type and 'cart_abandon_count' in df.columns and df['cart_abandon_count'].mean() > 2:
        top_reason = "Cart Abandonment"
    
    st.markdown("### 📅 Weekly Snapshot")
    
    # Cards using Global CSS
    
    w1, w2, w3, w4 = st.columns(4)
    
    with w1:
        st.markdown(f"""
        <div class="snapshot-card bg-teal-tint">
            <div>
                <div class="card-title">📉 Weekly Trend</div>
                <div class="card-value">Stable</div>
            </div>
            <div class="card-delta" style="background-color: rgba(56, 142, 60, 0.1); color: #2E7D32;">
                <span>↓ 1.2% vs last week</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with w2:
        risk_bg = "rgba(198, 40, 40, 0.1)" if change_val > 0 else "rgba(56, 142, 60, 0.1)"
        risk_color = "#C62828" if change_val > 0 else "#2E7D32"
        arrow = "↑" if change_val > 0 else "↓"
        
        st.markdown(f"""
        <div class="snapshot-card bg-red-tint">
            <div>
                <div class="card-title">⚠️ High Risk Users</div>
                <div class="card-value">{high_risk_count}</div>
            </div>
            <div class="card-delta" style="background-color: {risk_bg}; color: {risk_color};">
                <span>{arrow} {abs(change_val)}% change</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
        
    with w3:
        st.markdown(f"""
        <div class="snapshot-card bg-orange-tint">
            <div>
                <div class="card-title">📍 Critical Zone</div>
                <div class="card-value" style="font-size: 20px;">{worst_city}</div>
            </div>
            <div class="card-delta" style="background-color: rgba(239, 108, 0, 0.1); color: #EF6C00;">
                <span>Action Required</span>
            </div>
        </div>
        """, unsafe_allow_html=True)

    with w4:
        st.markdown(f"""
        <div class="snapshot-card bg-blue-tint">
            <div>
                <div class="card-title">🔍 Top Churn Driver</div>
                <div class="card-value" style="font-size: 18px; line-height: 1.2;">{top_reason}</div>
            </div>
            <div class="card-delta" style="background-color: rgba(21, 101, 192, 0.1); color: #1565C0;">
                <span>System Wide</span>
            </div>
        </div>
        """, unsafe_allow_html=True)
    
    st.markdown("---")
    
    # 3. AI Generated Insights (Rule Based)
    st.subheader("📝 AI Smart Briefing")
    
    insights = []
    
    # City Insight
    if worst_city != "Unknown":
        insights.append(f"🔴 **Critical Alert:** Churn has spiked in **{worst_city}**. Our models indicate this is driven by competitive pricing in that region.")
        
    # Operational Insight
    if top_reason == "Delivery Delays":
        insights.append(f"🚚 **Operations:** Average delivery time exceeded 40 mins this week. This is the #1 churn driver for Food apps.")
    elif top_reason == "Cart Abandonment":
        insights.append(f"🛒 **Sales:** High cart abandonment detected. Users are stopping at the payment gateway.")
        
    # General Insight
    if high_risk_count > (len(df)*0.2):
        insights.append(f"⚠️ **Warning:** 20% of your user base is now High Risk. Immediate retention campaigns are advised.")
    else:
        insights.append(f"✅ **Good News:** The majority of your user base remains stable (Low Risk).")
        
    # Display Insights
    for i in insights:
        st.markdown(f"- {i}")
        
    st.markdown("---")
    
    # 4. Recommended Priority Actions
    st.subheader("⚡ Priority Action List (This Week)")
    
    action_data = []
    
    # Logic for recommended actions
    if worst_city != "Unknown":
        action_data.append(["High", f"Launch 'Sorry for the Delay' coupon in {worst_city}", "Marketing Team"])
        
    if "Food" in app_type:
        action_data.append(["High", "Review Logistics Partners in Red Zones", "Ops Team"])
        action_data.append(["Medium", "Send Push Notification for Weekend Deals", "Growth Team"])
    elif "Shopping" in app_type:
        action_data.append(["High", "Fix Payment Gateway Latency", "Tech Team"])
        action_data.append(["Medium", "Run 'Free Shipping' weekend", "Marketing Team"])
    else:
        action_data.append(["High", "Call students with <10% attendance", "Support Team"])
        
    # Add a generic one
    action_data.append(["Optional", "Interview 5 loyal customers for feedback", "Product Team"])
    
    action_df = pd.DataFrame(action_data, columns=["Priority", "Suggested Action", "Owner"])
    
    st.dataframe(
        action_df, 
        use_container_width=True, 
        hide_index=True,
        column_config={
            "Priority": st.column_config.TextColumn(
                "Priority", 
                help="High/Medium/Low", 
                validate="^High|Medium|Optional$"
            )
        }
    )

def process_predictions(df, model):
    required = ['login_days', 'hours_spent', 'support_tickets', 'subscription_type']
    
    # Preprocessing
    # Ensure mapping matches training
    temp_df = df.copy()
    sub_map = {'Free': 0, 'Basic': 1, 'Premium': 2}
    temp_df['subscription_type'] = temp_df['subscription_type'].astype(str).map(
        lambda x: sub_map.get(x, sub_map.get(x.capitalize(), 0))
    )
    
    if model:
        try:
            df['Churn_Prediction'] = model.predict(temp_df[required])
            df['Churn_Status'] = df['Churn_Prediction'].map({1: 'Churn (Leave)', 0: 'Stay'})
        except Exception as e:
            st.error(f"Prediction validation failed: {e}")

if __name__ == "__main__":
    main()
