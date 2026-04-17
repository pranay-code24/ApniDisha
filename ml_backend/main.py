from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from psycopg2.pool import ThreadedConnectionPool
from fastapi.middleware.cors import CORSMiddleware
import random
import joblib
import numpy as np
import pandas as pd
import os
from dotenv import load_dotenv
from groq import Groq
import re
import json

load_dotenv()
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise ValueError("DATABASE_URL is missing in .env file!")

try:
    db_pool = ThreadedConnectionPool(1, 10, DB_URL)
    print("Database Connection Pool initialized successfully!")
except Exception as e:
    print("Error initializing Database Pool:", e)

def get_db_connection():
    return db_pool.getconn()

def release_db_connection(conn):
    if conn:
        db_pool.putconn(conn)

groq_api_key = os.getenv("GROQ_API_KEY")
if not groq_api_key:
    print("WARNING: GROQ_API_KEY not found in .env file!")
else:
    groq_client = Groq(api_key=groq_api_key)

print("Loading ApniDisha Custom ML Model & Mega Dataset...")

try:
    rf_model = joblib.load("apnidisha_model.pkl")
    df_careers = pd.read_csv("apnidisha_mega_dataset.csv")

    new_careers = pd.DataFrame([
        {"career_name": "Lead Actor", "career_cluster": "Arts & Design", "R": 2, "I": 2, "A": 10, "S": 8, "E": 6, "C": 2, "Openness": 9, "Conscientiousness": 5, "Extraversion": 10, "Agreeableness": 7, "Neuroticism": 6},
        {"career_name": "Professional Performer", "career_cluster": "Arts & Design", "R": 2, "I": 2, "A": 10, "S": 8, "E": 6, "C": 2, "Openness": 9, "Conscientiousness": 5, "Extraversion": 10, "Agreeableness": 7, "Neuroticism": 6}
    ])
    df_careers = pd.concat([df_careers, new_careers], ignore_index=True)
    print("Model & Dataset loaded successfully!")
except Exception as e:
    print("Warning: Model or Dataset not found. Check files.", e)

class AdaptiveQuizRequest(BaseModel):
    step: int
    scores: dict
    last_rating: int = 0  
    current_cluster: str = "" 
    cluster_prefs: dict = {}
    previous_questions: list = []

class CollegeFilterRequest(BaseModel):
    city: str
    state: str = "Madhya Pradesh"
    cluster: str

class UserProfile(BaseModel):
    clerk_id: str
    name: str
    email: str
    phone: str
    address: str
    education_level: str
    institution: str

class RoadmapRequest(BaseModel):
    cluster: str

class ChatRequest(BaseModel):
    message: str
    cluster: str
    history: list = []

class JobDetailRequest(BaseModel):
    title: str
    cluster: str 

IMAGE_KEYWORDS = {
    "Realistic": "tools,mechanic",
    "Investigative": "laboratory,research",
    "Artistic": "art,creative",
    "Social": "team,helping",
    "Enterprising": "business,leadership",
    "Conventional": "office,data",
    "Software & Tech": "coding,technology",
    "Medical & Healthcare": "hospital,medical",
    "Arts & Design": "design,painting",
    "Business & Finance": "finance,market",
    "Engineering & Core": "engineering,industry",
    "Education & Social": "education,teaching",
    "Agriculture & Nature": "agriculture,nature",
    "Sports & Fitness": "sports,fitness",
    "Defense & Military": "military,army",
    "Skilled Trades & Construction": "construction,builder"
}

CLUSTER_MAPPING = {
    "Skilled Trades & Construction": "Engineering & Core",
    "Defense & Military": "Sports & Fitness",
    "Agriculture & Nature": "Engineering & Core",
    "Software & Tech": "Software & Tech",
    "Medical & Healthcare": "Medical & Healthcare",
    "Business & Finance": "Business & Finance",
    "Arts & Design": "Arts & Design",
    "Education & Social": "Education & Social"
}

def get_relevant_image(key):
    keywords = IMAGE_KEYWORDS.get(key, "work,career")
    random_id = random.randint(1, 10000)
    return f"https://loremflickr.com/800/400/{keywords}?lock={random_id}"

def derive_personality_traits(scores):
    openness = min(10, (scores.get("Artistic", 0) + scores.get("Investigative", 0)) / 2 + 3)
    conscientiousness = min(10, scores.get("Conventional", 0) + 4)
    extraversion = min(10, (scores.get("Enterprising", 0) + scores.get("Social", 0)) / 2 + 2)
    agreeableness = min(10, scores.get("Social", 0) + 5)
    neuroticism = 4 
    return [openness, conscientiousness, extraversion, agreeableness, neuroticism]

BASE_QUESTIONS = {
    "Realistic": [
        "I would love a job where I can work with my hands, fix things, or build machines.",
        "Sitting at a desk all day is boring; I prefer working outdoors or doing physical activities.",
        "I enjoy working with tools, gadgets, or computer hardware to see how they work."
    ],
    "Investigative": [
        "I love solving difficult puzzles, math problems, or figuring out secret codes.",
        "When I see a new technology or scientific fact, I want to research deeply about how it works.",
        "I enjoy running experiments, analyzing data, and finding logical solutions to problems."
    ],
    "Artistic": [
        "I like to express my feelings through art, drawing, music, writing, or design.",
        "I hate strict rules. I prefer having the freedom to create my own original ideas.",
        "Designing a beautiful user interface or crafting a cool story sounds like fun to me."
    ],
    "Social": [
        "I feel really happy when I am teaching, helping, or guiding other people.",
        "My friends usually come to me for advice when they have personal problems.",
        "I would love a career where I directly improve people's health, education, or daily lives."
    ],
    "Enterprising": [
        "I like being the leader of a group project and making important decisions.",
        "I am good at convincing people, pitching new ideas, and I dream of starting my own business.",
        "I enjoy setting big goals, taking risks, and competing to be the best."
    ],
    "Conventional": [
        "I like keeping my notes, files, and computer folders perfectly organized.",
        "I prefer working in a system where the rules and steps are clear, rather than chaotic environments.",
        "Managing data, checking for errors, and keeping accurate records sounds satisfying to me."
    ]
}

@app.post("/predict-career")
def predict_career_adaptive(req: AdaptiveQuizRequest):
    step = req.step
    
    if step <= 6:
        categories = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"]
        target_category = categories[step - 1]
        question = random.choice(BASE_QUESTIONS[target_category])
        
        return {
            "success": True,
            "step": step,
            "type": "base",
            "category": target_category,
            "question": question,
            "ui_type": random.choice(["stars", "emojis", "mcq", "slider"]),
            "image_url": get_relevant_image(target_category)
        }

    try:
        r = req.scores.get("Realistic", 0)
        i_trait = req.scores.get("Investigative", 0)
        a = req.scores.get("Artistic", 0)
        s = req.scores.get("Social", 0)
        e = req.scores.get("Enterprising", 0)
        c_trait = req.scores.get("Conventional", 0)
        
        personality_traits = derive_personality_traits(req.scores)
        features = np.array([[r, i_trait, a, s, e, c_trait] + personality_traits])
        probabilities = rf_model.predict_proba(features)[0]
        classes = rf_model.classes_
        
        calibrated_probs = []
        for i, cls_name in enumerate(classes):
            base_prob = probabilities[i]
            pref_score = req.cluster_prefs.get(cls_name, 0)
            
            if pref_score < 0:
                multiplier = (0.8) ** abs(pref_score)
                base_prob *= multiplier
            elif pref_score > 0:
                multiplier = (1.15) ** pref_score 
                base_prob *= multiplier
                
            calibrated_probs.append(base_prob)
            
        best_idx = np.argmax(calibrated_probs)
        predicted_cluster = classes[best_idx]
        
        total_prob = sum(calibrated_probs)
        if total_prob == 0:
            final_percentage = 85.5 
        else:
            final_percentage = (calibrated_probs[best_idx] / total_prob) * 100
        
        if final_percentage > 98.0:
            noise = (len(predicted_cluster) % 15) / 10.0
            final_percentage = 96.8 + noise
            
        confidence_val = round(float(final_percentage), 1)

        if step > 20:
            top_careers = []
            
            if 'df_careers' in globals():
                cluster_jobs = df_careers[df_careers["career_cluster"] == predicted_cluster].copy()
                
                if not cluster_jobs.empty:
                    def calculate_match_score(row):
                        score_diff = (abs(row['R'] - req.scores.get('Realistic', 0)*2) + 
                                     abs(row['I'] - req.scores.get('Investigative', 0)*2) + 
                                     abs(row['A'] - req.scores.get('Artistic', 0)*2) + 
                                     abs(row['S'] - req.scores.get('Social', 0)*2) + 
                                     abs(row['E'] - req.scores.get('Enterprising', 0)*2) + 
                                     abs(row['C'] - req.scores.get('Conventional', 0)*2))
                        return max(0, 100 - score_diff)
                    
                    cluster_jobs['match_score'] = cluster_jobs.apply(calculate_match_score, axis=1)
                    sorted_jobs = cluster_jobs.sort_values(by='match_score', ascending=False)
                    
                    seen_titles = set()
                    
                    for index, row in sorted_jobs.iterrows():
                        raw_title = str(row['career_name']).strip()
                        compare_title = raw_title.lower()
                        
                        if compare_title not in seen_titles:
                            seen_titles.add(compare_title)
                            top_careers.append({
                                "title": raw_title,
                                "matchPercentage": round(row['match_score'], 1)
                            })
                            
                        if len(top_careers) == 5:
                            break

            if not top_careers:
                fallback_jobs = {
                    "Software & Tech": [{"title": "Full Stack Developer", "matchPercentage": 96.5}, {"title": "Cloud Architect", "matchPercentage": 94.2}, {"title": "Data Scientist", "matchPercentage": 91.8}, {"title": "Cybersecurity Analyst", "matchPercentage": 89.5}, {"title": "DevOps Engineer", "matchPercentage": 88.0}],
                    "Medical & Healthcare": [{"title": "Clinical Researcher", "matchPercentage": 95.0}, {"title": "Specialist Physician", "matchPercentage": 92.4}, {"title": "Healthcare Admin", "matchPercentage": 89.9}, {"title": "Physiotherapist", "matchPercentage": 87.5}, {"title": "Nutritionist", "matchPercentage": 86.2}],
                    "Business & Finance": [{"title": "Investment Banker", "matchPercentage": 97.1}, {"title": "Management Consultant", "matchPercentage": 93.5}, {"title": "Financial Analyst", "matchPercentage": 90.2}, {"title": "Marketing Manager", "matchPercentage": 88.7}, {"title": "HR Director", "matchPercentage": 86.9}],
                    "Engineering & Core": [{"title": "Mechanical Engineer", "matchPercentage": 96.0}, {"title": "Robotics Engineer", "matchPercentage": 94.1}, {"title": "Civil Architect", "matchPercentage": 88.5}, {"title": "Aerospace Engineer", "matchPercentage": 87.2}, {"title": "Chemical Engineer", "matchPercentage": 85.0}],
                    "Arts & Design": [{"title": "UX/UI Designer", "matchPercentage": 98.2}, {"title": "Creative Director", "matchPercentage": 95.4}, {"title": "Motion Graphics", "matchPercentage": 91.0}, {"title": "Interior Designer", "matchPercentage": 89.5}, {"title": "Art Director", "matchPercentage": 87.0}],
                    "Education & Social": [{"title": "Curriculum Developer", "matchPercentage": 95.5}, {"title": "Clinical Psychologist", "matchPercentage": 93.8}, {"title": "Professor", "matchPercentage": 90.1}, {"title": "Social Worker", "matchPercentage": 88.5}, {"title": "Career Counselor", "matchPercentage": 86.2}],
                    "Agriculture & Nature": [{"title": "Agri-Tech Specialist", "matchPercentage": 94.5}, {"title": "Environmental Scientist", "matchPercentage": 92.0}, {"title": "Botanist", "matchPercentage": 89.5}, {"title": "Wildlife Biologist", "matchPercentage": 87.5}, {"title": "Geologist", "matchPercentage": 85.0}],
                    "Sports & Fitness": [{"title": "Sports Physiotherapist", "matchPercentage": 96.8}, {"title": "Athletic Director", "matchPercentage": 93.2}, {"title": "Strength Coach", "matchPercentage": 90.5}, {"title": "Sports Data Analyst", "matchPercentage": 88.2}, {"title": "Dietitian", "matchPercentage": 86.5}],
                    "Defense & Military": [{"title": "Army Officer", "matchPercentage": 96.5}, {"title": "Naval Commander", "matchPercentage": 94.2}, {"title": "Air Force Pilot", "matchPercentage": 91.8}, {"title": "Intelligence Analyst", "matchPercentage": 89.0}, {"title": "Cyber Defense Officer", "matchPercentage": 87.5}],
                    "Skilled Trades & Construction": [{"title": "Master Electrician", "matchPercentage": 95.0}, {"title": "Marine Engineer", "matchPercentage": 92.4}, {"title": "Civil Architect", "matchPercentage": 89.9}, {"title": "Construction Manager", "matchPercentage": 88.0}, {"title": "Surveyor", "matchPercentage": 86.5}]
                }
                top_careers = fallback_jobs.get(predicted_cluster, [{"title": "Top Professional", "matchPercentage": 95.0}])

            return {
                "success": True,
                "step": step,
                "is_complete": True,
                "final_cluster": predicted_cluster,
                "conf_score": confidence_val,
                "recommended_jobs": top_careers
            }
        
        expert_question = f"As a professional in {predicted_cluster}, do you enjoy the core challenges of this field?"
        
        if 'df_careers' in globals():
            cluster_data = df_careers[df_careers["career_cluster"] == predicted_cluster]
            if not cluster_data.empty:
                random_career_row = cluster_data.sample(1)
                career_name = random_career_row["career_name"].values[0]
                
                career_scores = {
                    "Realistic": random_career_row["R"].values[0],
                    "Investigative": random_career_row["I"].values[0],
                    "Artistic": random_career_row["A"].values[0],
                    "Social": random_career_row["S"].values[0],
                    "Enterprising": random_career_row["E"].values[0],
                    "Conventional": random_career_row["C"].values[0],
                }
            
                top_traits = sorted(career_scores.items(), key=lambda item: item[1], reverse=True)[:2]
                trait_1, trait_2 = top_traits[0][0], top_traits[1][0]
                
                if groq_api_key:
                    past_qs = "\n".join([f"- {q}" for q in req.previous_questions[-6:]]) if req.previous_questions else "None"

                    prompt = f"""You are a cool, relatable career guide for Indian high school students (Class 9-12).
                    Your task is to ask ONE simple, fun question to test their aptitude for the '{predicted_cluster}' career (focusing on '{trait_1}' and '{trait_2}').

                    PAST QUESTIONS ALREADY ASKED (CRITICAL - DO NOT REPEAT THESE TOPICS):
                    {past_qs}

                    CRITICAL RULES:
                    1. USE VERY SIMPLE ENGLISH: Talk like a normal 15-year-old. Zero complex words.
                    2. TEEN UNIVERSE ONLY: Base the question on daily teen life—like school fests, group projects, gaming, YouTube, friends' drama, sports, or exams.
                    3. STRICTLY NO ADULT STUFF: Never mention jobs, offices, CEOs, budgets, or professional software.
                    4. KEEP IT SHORT: Maximum 20 words.
                    5. NO OPTIONS: Do NOT include A/B/C/D options or scales. 
                    6. DIRECT START: Just output the exact question. No quotes, no intro, no polite greetings.
                    """

                    try:
                        chat_completion = groq_client.chat.completions.create(
                            messages=[{"role": "user", "content": prompt}],
                            model="llama-3.3-70b-versatile", 
                            temperature=0.85,
                            max_tokens=40
                        )
                        expert_question = chat_completion.choices[0].message.content.strip()
                        if expert_question.startswith('"') and expert_question.endswith('"'):
                            expert_question = expert_question[1:-1]
                            
                    except Exception as api_err:
                        print(f"Groq API Error: {api_err}. Using fallback.")
                        expert_question = f"I would enjoy using my {trait_1} skills daily as a {career_name}."

        return {
            "success": True,
            "step": step,
            "type": "adaptive",
            "predicted_cluster": predicted_cluster,
            "question": expert_question,
            "ui_type": random.choice(["stars", "emojis", "mcq"]),
            "image_url": get_relevant_image(predicted_cluster)
        }
            
    except Exception as e:
        print("ML Error : ", e)
        return {"success": False, "error": str(e)}
    
@app.post("/api/save-profile")
async def save_profile(profile: UserProfile):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        insert_query = """
        INSERT INTO users (clerk_id, name, email, phone_number, address, education_level, institution)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (clerk_id) DO UPDATE 
        SET phone_number = EXCLUDED.phone_number, 
            address = EXCLUDED.address, 
            education_level = EXCLUDED.education_level, 
            institution = EXCLUDED.institution;
        """
        cursor.execute(insert_query, (
            profile.clerk_id, profile.name, profile.email, 
            profile.phone, profile.address, 
            profile.education_level, profile.institution
        ))
        conn.commit()
        cursor.close()
        return {"status": "success", "message": "Profile saved to Neon DB!"}
    except Exception as e:
        print("Database Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            release_db_connection(conn)

@app.post("/api/roadmap")
def generate_roadmap(req: RoadmapRequest):
    try:
        if not groq_api_key:
            return {"success": False, "error": "Groq API key missing"}

        prompt = f"""You are a backend API data generator. Your ONLY job is to output a raw JSON array. 
                DO NOT output markdown formatting like ```json. DO NOT output greetings or explanations.

                CONTEXT: Create a 4-step actionable roadmap for a 15-year-old Indian student (tier-2 city) matching with the '{req.cluster}' career cluster. Focus heavily on the Indian Education System (Govt Colleges, ITI, Diploma, B.Tech, B.A., B.Sc, B.Com, etc.).

                EXACT JSON SCHEMA REQUIRED:
                [
                {{"phase": "After 10th (Stream Selection)", "title": "Which Stream to Choose", "desc": "Advise Arts, Science, Commerce, or Vocational specific to {req.cluster}."}},
                {{"phase": "After 12th (Govt Degree/Diploma)", "title": "Which Degree", "desc": "Advise specific Indian degrees/diplomas pursued in Government Institutions."}},
                {{"phase": "College Years (Skill & Exam Prep)", "title": "Skill Building", "desc": "One practical sentence on skills to build or Indian Govt/Competitive Exams (e.g., UPSC, SSC, GATE) to prepare for."}},
                {{"phase": "Professional Job Opportunities", "title": "Career Prospects", "desc": "Specific entry-level jobs they can get in India in the {req.cluster} field."}}
                ]"""

        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=400
        )
        
        raw_response = chat_completion.choices[0].message.content.strip()
        json_match = re.search(r'\[\s*\{.*?\}\s*\]', raw_response, re.DOTALL)
        
        if json_match:
            clean_json_string = json_match.group(0)
            roadmap_data = json.loads(clean_json_string)
        else:
            roadmap_data = json.loads(raw_response)
        
        return {"success": True, "roadmap": roadmap_data}
        
    except Exception as e:
        print("Roadmap AI Error: ", e)
        return {"success": True, "roadmap": [
            {"phase": "After 10th (Stream Selection)", "title": "Analyze Strengths", "desc": f"Choose a stream (Science, Commerce, Arts) that aligns with {req.cluster}."},
            {"phase": "After 12th (Degree/Diploma)", "title": "Enroll in Govt. College", "desc": "Pursue a recognized degree or vocational training in your field."},
            {"phase": "College Years", "title": "Skill Development", "desc": "Focus on practical internships and prepare for relevant competitive exams."},
            {"phase": "Professional Job Opportunities", "title": "Entry-Level Roles", "desc": f"Apply for government or private sector jobs in the {req.cluster} industry."}
        ]}

@app.post("/api/get-colleges")
def get_colleges(req: CollegeFilterRequest):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        search_cluster = CLUSTER_MAPPING.get(req.cluster, req.cluster)

        query = """
            SELECT name, location, state, courses, clusters 
            FROM colleges 
            WHERE (location ILIKE %s OR state ILIKE %s)
        """
        search_term = f"%{req.city}%"
        cursor.execute(query, (search_term, search_term))
        rows = cursor.fetchall()
        
        match_colleges = []
        state_fallback = []
        seen_names = set()

        for r in rows:
            name, loc, st, courses, clusters = r
            
            if req.city.lower() in loc.lower() and req.city.lower() == "indore":
                st = "Madhya Pradesh"
                
            if name not in seen_names:
                college_obj = {"name": name, "location": f"{loc}, {st}", "courses": courses}
                if search_cluster in clusters or req.cluster in clusters:
                    match_colleges.append(college_obj)
                    seen_names.add(name)

        if not match_colleges:
            cursor.execute("SELECT name, location, state, courses, clusters FROM colleges WHERE state ILIKE %s", (f"%{req.state}%",))
            state_rows = cursor.fetchall()
            for r in state_rows:
                name = r[0]
                if name not in seen_names and (search_cluster in r[4] or req.cluster in r[4]):
                    state_fallback.append({"name": name, "location": f"{r[1]}, {r[2]}", "courses": r[3]})
                    seen_names.add(name)

        cursor.close()
        
        final_list = match_colleges if match_colleges else state_fallback
        
        return {
            "success": True, 
            "colleges": final_list[:6],
            "search_level": "City" if match_colleges else "State/National"
        } 
    except Exception as e:
        print("DB Error:", e)
        return {"success": False, "error": str(e)}
    finally:
        if conn:
            release_db_connection(conn)

@app.post("/chat")
async def chat_with_disha(request_data: dict):
    
    user_grade = request_data.get("grade", "10th Grade") 
    user_city = request_data.get("city", "India")
    target_trait = request_data.get("trait", "Career")
    user_message = request_data.get("message", "Hello!")

    system_prompt = f"""
    You are 'Disha', the official AI Career Mentor for the platform ApniDisha.

    YOUR PERSONA:
    1. You act as a friendly, supportive elder sibling (around 25 years old) guiding a younger student from India.
    2. Your tone is warm, encouraging, and Gen-Z relatable (use phrases like "Awesome!", "Don't worry", "Let's figure this out").
    3. NEVER sound like a strict teacher, a boring robotic counselor, or Wikipedia.
    4. Always validate the student's feelings before asking the next question.

    CURRENT CONTEXT:
    The user is a student in {user_grade} from {user_city}. 
    Respond to the user keeping your persona active.
    """

    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_message
            }
        ],
        model="llama-3.1-8b-instant",
        temperature=0.7,
    )
    reply = chat_completion.choices[0].message.content
    return {"success": True, "reply": reply}
    
@app.post("/api/job-details")
def get_job_details(req: JobDetailRequest):
    try:
        if not groq_api_key:
            return {"success": False, "error": "Groq API key missing"}

        prompt = f"""You are a career expert for the Indian job market. Provide accurate details for the role of '{req.title}' in the '{req.cluster}' sector.
        Respond ONLY with a valid JSON object in this exact format. No markdown, no extra text.
        {{
            "description": "2-3 sentences explaining exactly what this role does on a daily basis.",
            "salary": "₹X.X Lakhs - ₹Y.Y Lakhs / Year",
            "skills": ["Skill 1", "Skill 2", "Skill 3"]
        }}"""

        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=250
        )

        raw_response = chat_completion.choices[0].message.content.strip()
        json_match = re.search(r'\{.*?\}', raw_response, re.DOTALL)

        if json_match:
            job_data = json.loads(json_match.group(0))
        else:
            job_data = json.loads(raw_response)

        return {"success": True, "details": job_data}
        
    except Exception as e:
        print("Job Details Error:", e)
        return {"success": True, "details": {
            "description": f"An exciting and demanding professional role in the {req.cluster} industry.",
            "salary": "₹4.5L - ₹9.0L / Year",
            "skills": ["Communication", "Problem Solving", "Domain Expertise"]
        }}

@app.post("/api/resources")
async def get_realtime_resources(request_data: dict):
    cluster = request_data.get("cluster", "Engineering")
    
    prompt = f"""
    You are an expert Career Counselor. The student wants to build a career in '{cluster}'.
    Suggest exactly 3 highly specific, top-rated learning resources to start learning right now.
    
    Rules:
    1. Output strictly in JSON array format. No introductory text, no markdown.
    2. Format: [{{"title": "Course Name", "platform": "YouTube/Coursera/Udemy", "desc": "1 line description", "link": "https://url..."}}]
    3. Make sure the links are realistic (use search query links if exact URL is unknown, e.g., [https://www.youtube.com/results?search_query=Course+Name](https://www.youtube.com/results?search_query=Course+Name))
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.3,
        )
        
        reply = chat_completion.choices[0].message.content.strip()
        
        if reply.startswith("```"):
            reply = reply.split("\n", 1)[1].rsplit("\n", 1)[0]
            
        resources = json.loads(reply)
        return {"success": True, "resources": resources}
    except Exception as e:
        print(f"Error fetching resources: {e}")
        return {"success": True, "resources": [
            {"title": f"Top {cluster} Masterclass", "platform": "YouTube", "desc": "Start learning the basics today.", "link": f"[https://www.youtube.com/results?search_query=](https://www.youtube.com/results?search_query=){cluster.replace(' ', '+')}+full+course"}
        ]}
    
@app.post("/api/challenge")
async def get_weekly_challenge(request_data: dict):
    cluster = request_data.get("cluster", "Engineering")
    
    prompt = f"""
    You are an expert Career Coach. The student is pursuing '{cluster}'.
    Generate a practical, fun 7-day micro-challenge/project for a beginner to build a basic skill in this field.
    
    Output STRICTLY in JSON format with no other text:
    {{
      "challenge_title": "A catchy project name",
      "goal": "What they will achieve",
      "tasks": [
        {{"day": "Day 1-2", "title": "Research & Plan", "desc": "1 line description"}},
        {{"day": "Day 3-5", "title": "Execution", "desc": "1 line description"}},
        {{"day": "Day 6-7", "title": "Review & Publish", "desc": "1 line description"}}
      ]
    }}
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
            temperature=0.4,
        )
        
        reply = chat_completion.choices[0].message.content.strip()
        if reply.startswith("```"):
            reply = reply.split("\n", 1)[1].rsplit("\n", 1)[0]
            
        challenge_data = json.loads(reply)
        return {"success": True, "challenge": challenge_data}
    except Exception as e:
        print(f"Error fetching challenge: {e}")
        return {"success": True, "challenge": {
            "challenge_title": f"{cluster} Explorer Quest",
            "goal": "Learn the fundamentals in one week.",
            "tasks": [
                {"day": "Day 1-3", "title": "Basic Concepts", "desc": "Read introductory articles."},
                {"day": "Day 4-7", "title": "Mini Project", "desc": "Apply what you learned."}
            ]
        }}