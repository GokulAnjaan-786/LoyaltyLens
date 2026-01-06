# LoyaltyLens - Customer Retention Intelligence

LoyaltyLens is an AI-powered analytics dashboard designed to predict customer churn and provide actionable retention strategies.

## 🚀 How to Run

### **Option 1: One-Click Run (Windows)**
Simply double-click the **`run_loyaltylens.bat`** file in this folder.

### **Option 2: Manual Run**
1. Open a terminal/command prompt in this folder.
2. Activate the virtual environment:
   ```bash
   .\venv\Scripts\activate
   ```
3. Run the application:
   ```bash
   streamlit run app.py
   ```

## 🛠 Deployment (Streamlit Cloud)

To deploy this application to the web for free using Streamlit Cloud:

1. **Push to GitHub**: Upload this entire project folder to a GitHub repository.
2. **Sign up/Login**: Go to [share.streamlit.io](https://share.streamlit.io/).
3. **Deploy**:
   - Click "New App".
   - Select your GitHub repository.
   - Set the main file path to `app.py`.
   - Click "Deploy".

## 🔑 Default Credentials
- **Email**: `admin@loyaltylens.com`
- **Password**: `admin`

## 📂 Project Structure
- `app.py`: Main application entry point.
- `requirements.txt`: Python dependencies.
- `model/`: Contains the pre-trained Machine Learning models.
- `data/`: Stores local user data and sample datasets.
- `utils/`: Helper scripts for risk engine and simulation.
