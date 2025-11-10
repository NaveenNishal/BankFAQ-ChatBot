# Banking FAQ Chatbot

A multilingual banking chatbot with AI-powered FAQ responses using sentence transformers and FAISS for semantic search.

## Features

- Multilingual support with offline translation
- Semantic search using sentence transformers
- FastAPI backend with session management
- Angular 20 frontend with Bootstrap UI
- Real-time chat interface

## Tech Stack

**Backend:**
- Python with FastAPI
- Sentence Transformers
- FAISS for vector search
- PyTorch
- Pandas

**Frontend:**
- Angular 20
- Bootstrap 5.3
- TypeScript

## Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

## Installation

### Backend Setup

```bash
cd Backend
pip install -r requirements.txt
```

Create a `.env` file in the Backend directory with required environment variables.

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend

```bash
cd Backend
python start_fastapi.py
```

### Start Frontend

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:4200`

## Project Structure

```
bankfaq_chatbot/
├── Backend/
│   ├── enhanced_chatbot.py
│   ├── multilingual_banking_bot.py
│   ├── offline_translator.py
│   ├── start_fastapi.py
│   ├── requirements.txt
│   └── sessions/
└── frontend/
    ├── src/
    ├── angular.json
    └── package.json
```

## License

MIT
