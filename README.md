# 🎓 AI Lecture Companion

### An AI-Powered Assistant for Smarter Learning

AI Lecture Companion is an intelligent learning assistant that converts lecture videos and PDF materials into structured study notes and learning resources using Artificial Intelligence.

The application combines speech-to-text processing, slide extraction, transcript synchronization, and Google Gemini AI to help students understand lecture content more effectively and save time during revision.

---

## 🚀 Features

- **Lecture Video Upload:** Upload lecture videos for automatic processing.
- **PDF Upload:** Upload PDF materials to support lecture learning.
- **Audio Transcription:** Convert lecture audio into text.
- **Slide Extraction:** Extract important slides from lecture videos.
- **Transcript Synchronization:** Connect lecture transcripts with corresponding slides.
- **AI-Generated Notes:** Generate structured notes using Google Gemini AI.
- **AI Chatbot:** Ask questions about lecture content and receive AI-generated answers.
- **Lecture History:** View previously processed lectures.
- **Download Notes:** Download generated lecture notes as PDF.
- **Learning Resources:** Generate useful learning materials from lecture content.

---

## 🛠️ Technologies Used

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Python
- FastAPI
- Uvicorn

### Artificial Intelligence
- Google Gemini AI
- Speech-to-Text Processing
- AI-Based Text Generation

### Database
- SQLite

### Development Tools
- Visual Studio Code
- Git
- GitHub
- Python Virtual Environment

---

## 📂 Project Structure

```text
AI-Lecture-Companion/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── api.py
├── app.py
├── audio_processor.py
├── database.py
├── notes_generator.py
├── slide_processor.py
├── synchronizer.py
├── timeline_builder.py
├── test_gemini.py
│
├── .gitignore
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation and Setup

Follow these steps to run the project locally.

### 1. Clone the Repository

```bash
git clone https://github.com/ShaikJilani/AI-Lecture-Companion.git
```

### 2. Navigate to the Project Folder

```bash
cd AI-Lecture-Companion
```

### 3. Create a Virtual Environment

```bash
python -m venv venv
```

### 4. Activate the Virtual Environment

For Windows PowerShell:

```powershell
venv\Scripts\activate
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

### 6. Configure Gemini API Key

Create a `.env` file in the root directory.

Add your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Replace `your_gemini_api_key` with your actual API key.

**Important:** Never upload your `.env` file or API key to GitHub.

### 7. Start the Backend Server

```bash
python -m uvicorn api:app --reload --port 8000
```

Backend server:

```text
http://127.0.0.1:8000
```

API documentation:

```text
http://127.0.0.1:8000/docs
```

### 8. Start the Frontend

Open another terminal and execute:

```bash
python -m http.server 5501 --directory frontend
```

Open your browser:

```text
http://127.0.0.1:5501/
```

The AI Lecture Companion application is now ready to use.

---

## 📸 Application Screenshots

Add screenshots of your actual application in this section.

### 1. Home Page
<!-- Add your home page screenshot here -->

### 2. Lecture Upload
<!-- Add your lecture upload screenshot here -->

### 3. AI-Generated Notes
<!-- Add your generated notes screenshot here -->

### 4. AI Chatbot
<!-- Add your chatbot screenshot here -->

---

## 🔄 Application Workflow

1. Upload a lecture video and PDF material.
2. Process the lecture audio and generate a transcript.
3. Extract important slides from the video.
4. Synchronize transcript segments with extracted slides.
5. Send lecture content to Google Gemini AI.
6. Generate structured lecture notes and learning materials.
7. Ask questions using the AI chatbot.
8. View previous lectures and download notes.

---

## 🎯 Project Objective

The main objective of AI Lecture Companion is to simplify the learning process by transforming lengthy lecture videos and PDF materials into organized and accessible learning resources.

It helps students save revision time, understand important concepts, and interact with their lecture content through Artificial Intelligence.

---

## 🔮 Future Enhancements

- Support for multiple languages.
- Real-time lecture transcription.
- Automatic quiz and question generation.
- Student progress tracking.
- Cloud-based lecture storage.
- Improved lecture summarization.

---

## 👨‍💻 Developer

**Shaik Jilani**

GitHub: https://github.com/ShaikJilani

---

## 📄 License

This project is developed for educational and learning purposes.
