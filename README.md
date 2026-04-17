<h1 align="center">
  ApniDisha 🧭
</h1>

<p align="center">
  <b>A Hyper-Personalized, AI-Driven Career Ecosystem for the Students of Bharat.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-Black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Llama_3-0466C8?style=for-the-badge&logo=meta&logoColor=white" alt="Llama 3" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="Neon DB" />
  <img src="https://img.shields.io/badge/Authentication-Clerk-6C47FF?style=for-the-badge" alt="Clerk" />
</p>

---

## 🚀 The Problem & Our Solution
In a country where career counseling is often limited to expensive PDF reports or generic advice, **ApniDisha** introduces a dynamic, AI-led journey for students. We solve the engagement gap in Tier-2 and Tier-3 cities by providing:
* **Adaptive AI Assessments:** No more static forms. Our ML model generates the next question based on your previous answer.
* **Empathetic Guidance:** A live voice mentor to talk you through your confusion.
* **Actionable Retention:** Turning career goals into 7-day gamified quests.

## ✨ Key Features
* 🧠 **Adaptive ML Career Quiz:** A generative assessment engine that uses **Llama 3** to route questions dynamically for 100% personalized career cluster prediction.
* 🎙️ **Live AI Voice Mentor ("Disha"):** Real-time conversational AI powered by **ElevenLabs** and **Vapi.ai**. Talk to Disha directly for empathetic guidance.
* 🎮 **Gamified Micro-Quests:** AI-generated 7-day actionable challenges with UI dopamine hits (Confetti 🎉) to ensure students stay on track.
* 📚 **Real-Time Resource Engine:** Dynamically scrapes and ranks the best YouTube and Coursera learning materials specific to the user's predicted path.
* 🗺️ **Interactive Roadmap:** A step-by-step career timeline taking students from absolute beginners to industry professionals.

## 🛠️ Tech Stack Architecture

### **Frontend**
- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS (Modern SaaS UI)
- **State & UI:** Lucide React (Icons), Canvas-Confetti (Gamification)
- **Auth:** Clerk (Secure User Management)

### **Backend & Database**
- **Server:** Python FastAPI (High-performance API)
- **Database:** **PostgreSQL via Neon DB** (Serverless, scalable storage)

### **AI & Machine Learning**
- **Core Intelligence:** Custom ML Engine for cluster prediction.
- **LLM Engine:** **Llama 3 via Groq API** for sub-second generation speed.
- **Voice AI:** Vapi.ai & ElevenLabs (Hyper-realistic voice synthesis).
- **Protocol:** WebRTC for low-latency voice communication.

---

## ⚙️ Setup & Installation :-

### 1. Clone the Project : 
git clone [https://github.com/your-username/apnidisha.git](https://github.com/your-username/apnidisha.git)

cd apnidisha

### 2. Frontend Setup (Next.js) : 
Install dependencies : 
npm install

Start the development server : 
npm run dev

🌐 Frontend runs on: http://localhost:3000

### 3. Backend Setup (FastAPI) :
Navigate to backend directory : 
cd backend

Create and activate virtual environment :

python -m venv venv

source venv/bin/activate  

Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload

⚙️ Backend runs on: http://localhost:8000

### 4. Environment Variables : 
Create .env files in both directories with these keys:

1) NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

2) DATABASE_URL (Your Neon DB URI)

3) GROQ_API_KEY (For Llama 3)

4) VAPI_API_KEY (For Voice Mentor)

---

> **Built with ❤️ by [Pranay Gumashta](https://github.com/pranaygumashta)** > *Dedicated to revolutionizing career counselling for the next generation.*

<p align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/rainbow.png" width="100%" />
</p>

```bash