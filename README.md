# ORION v2.0 🌌

> Intelligent automation that adapts to your workflow. Evolving in real-time.

ORION is a full-stack AI-powered web application that enables users to **upload PDF documents**, **process them into semantic vector embeddings**, and **interact with their content through a conversational AI interface** powered by Google's Gemini. Built with a modern RAG (Retrieval-Augmented Generation) pipeline, ORION delivers context-aware answers grounded in your documents.

---

## ✨ Features

- **🔐 Secure Authentication** – JWT-based auth with Argon2 password hashing
- **📄 PDF Upload & Cloud Storage** – Drag-and-drop PDF upload via Cloudinary
- **🧠 AI-Powered Document Q&A** – Ask natural language questions about your PDFs
- **⚡ Semantic Vector Search** – Sentence-transformer embeddings with Upstash Vector for lightning-fast retrieval
- **🤖 Gemini LLM Integration** – Multi-key round-robin Gemini API for intelligent response generation
- **📊 Rate Limiting** – Fair usage controls (2 uploads / 10 searches per 12 hours) via Redis
- **🔄 Async Background Processing** – PDF download, text extraction, and vectorization happen asynchronously
- **📱 Responsive UI** – Dark-themed, animated React frontend with particle backgrounds
- **🐳 Docker Support** – Multi-stage Dockerfile for optimized production builds

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 19 + Vite | UI framework & build tool |
| Tailwind CSS v4 | Utility-first styling |
| Framer Motion | Animations |
| React Router DOM v7 | Client-side routing |
| Axios | HTTP client |
| Cloudinary | PDF file storage |

### Backend
| Technology | Purpose |
|------------|---------|
| FastAPI | Python async web framework |
| MongoDB Atlas + MongoEngine | User data persistence |
| Upstash Vector | Vector database for semantic search |
| Upstash Redis | Caching, job queues, rate limiting |
| Google Gemini 2.5 Flash Lite | LLM for answer generation |
| SentenceTransformers (`all-MiniLM-L6-v2`) | Text embedding model |
| PyMuPDF (fitz) | PDF text extraction |
| python-jose + Argon2 | JWT tokens & password hashing |
| Uvicorn | ASGI server |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Vercel | Frontend deployment |
| Render / VPS | Backend deployment |

---

## 🏗 Architecture

```
┌─────────────────┐      ┌─────────────────────────────┐
│   React Client  │──────▶│      FastAPI Backend        │
│   (Vite/Vercel) │◀──────│      (Python 3.12)          │
└─────────────────┘      └─────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐      ┌───────────────┐      ┌───────────────┐
│ MongoDB Atlas │      │ Upstash Redis │      │ Upstash Vector│
│   (Users)     │      │ (Cache/Queue) │      │  (Embeddings) │
└───────────────┘      └───────────────┘      └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │  Job Queue    │
                        │  (Broker)     │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ PDF Processor │
                        │  (PyMuPDF)    │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │   Gemini AI   │
                        │   (LLM)       │
                        └───────────────┘
```

### Data Flow
1. **Upload** → PDF uploaded to Cloudinary → Backend queues job in Redis → Background worker downloads PDF, extracts text, generates embeddings, upserts to Upstash Vector
2. **Search/Ask** → User query is embedded → Vector similarity search in Upstash → Top-k chunks retrieved → Gemini generates contextual answer → Cached in Redis for 30 min

---

## 📁 Project Structure

```
ORION/
├── orion-backend/                  # FastAPI Backend
│   ├── Dockerfile                  # Multi-stage Docker build
│   ├── requirements.txt            # Python dependencies
│   └── Server/
│       ├── main.py                 # FastAPI app entry point
│       ├── DataBase/
│       │   └── MongoDBAtlas.py     # MongoDB connection manager
│       ├── Model/
│       │   └── models.py           # MongoEngine User model
│       ├── RedisCache/
│       │   └── RedisConfig.py      # Upstash Redis client
│       ├── Routers/
│       │   ├── routes.py           # API route definitions
│       │   ├── Controller.py       # Business logic & orchestration
│       │   ├── SecurityUtils.py    # Auth, JWT, password hashing
│       │   └── Components/
│       │       ├── LLM.py          # Gemini API wrapper
│       │       └── RateLimiter.py  # Redis-based rate limiting
│       └── Schemas/
│           └── RequestResponseModel.py  # Pydantic models
│
├── orion-frontend/                 # React Frontend
│   └── Client/
│       ├── package.json
│       ├── vite.config.js
│       ├── vercel.json             # Vercel deployment config
│       └── src/
│           ├── main.jsx
│           ├── app/App.jsx
│           ├── components/         # Navbar, ParticleBackground
│           ├── pages/              # Home, Login, Signup, Upload, SearchAndAsk
│           ├── routes/             # RouteManager, ProtectedRoute
│           ├── services/           # API service functions
│           └── styles/index.css
│
├── README.md
└── .gitignore
```

---

## ⚙️ Prerequisites

- **Python** 3.12+
- **Node.js** 20+
- **MongoDB Atlas** cluster
- **Upstash** account (Redis + Vector)
- **Google AI Studio** API key(s)
- **Cloudinary** account

---

## 🔑 Environment Variables

### Backend `.env`
Create a `.env` file inside `orion-backend/`:

```env
# Server
serverHost=https://your-backend-domain.com
pingMan=https://your-backend-domain.com/

# MongoDB
MONGODB=mongodb+srv://<user>:<password>@cluster.mongodb.net/ChatBot?retryWrites=true&w=majority

# Upstash Redis
UPSTASH_REDIS_URL=https://<your-redis-url>.upstash.io
UPSTASH_REDIS_TOKEN=<your-redis-token>

# Upstash Vector
UPSTASH_SEARCH_REST_URL=https://<your-vector-url>.upstash.io
UPSTASH_SEARCH_REST_TOKEN=<your-vector-token>

# Gemini AI
GeminiApiKeyList=KEY1,KEY2,KEY3
NumberOfGeminiKeys=3

# Auth
SECRETKEY=your-super-secret-jwt-key-min-32-chars

# Search Prompt Template
SearchQuery="Based on the following paragraphs, answer the user's question concisely and accurately."
```

### Frontend `.env`
Create a `.env` file inside `orion-frontend/Client/`:

```env
VITE_CLOUDINARY_URL=https://api.cloudinary.com/v1_1/<your-cloud-name>/auto/upload
VITE_UPLOAD_PRESET=<your-upload-preset>
```

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repo-url>
cd ORION
```

### 2. Backend Setup
```bash
cd orion-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn Server.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 3. Frontend Setup
```bash
cd orion-frontend/Client

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🐳 Docker Deployment

Build and run the backend using Docker:

```bash
cd orion-backend

# Build image
docker build -t orion-backend .

# Run container
docker run -d -p 8000:8000 --env-file .env --name orion-backend orion-backend
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Health check | No |
| `POST` | `/orion/api/v1/signup` | User registration | No |
| `POST` | `/orion/api/v1/login` | User login | No |
| `GET` | `/orion/api/v1/users/me` | Get current user | Bearer JWT |
| `POST` | `/orion/api/v1/upload` | Queue PDF for processing | Bearer JWT |
| `POST` | `/orion/api/v1/upload-status` | Check processing status | Bearer JWT |
| `POST` | `/orion/api/v1/search` | Semantic search & AI answer | Bearer JWT |

---

## 🎯 Usage Flow

1. **Sign Up** – Create an account at `/signup`
2. **Log In** – Authenticate at `/login`
3. **Upload PDF** – Go to `/upload`, drag & drop a PDF (max ~10-20MB). File is stored on Cloudinary and queued for processing.
4. **Wait for Processing** – The backend asynchronously downloads the PDF, extracts text page-by-page, generates vector embeddings, and stores them in Upstash Vector.
5. **Ask Questions** – Navigate to `/ask-orion` and ask natural language questions about your document. ORION retrieves the most relevant pages and generates an AI-powered answer.

---

## 🚦 Rate Limits

| Action | Limit | Window |
|--------|-------|--------|
| PDF Uploads | 2 | 12 hours |
| Search Queries | 10 | 12 hours |

Limits are tracked per user via Upstash Redis.

---

## 🛡 Security

- **Argon2id** password hashing (time_cost=2, memory_cost=16384)
- **JWT Bearer tokens** with 60-minute expiration
- **CORS** configured for frontend origins
- **Rate limiting** to prevent abuse
- **Environment-based secrets** – no hardcoded credentials

---

## 🧪 Future Enhancements

- [ ] Support for multiple simultaneous PDFs per user
- [ ] Chat history persistence in MongoDB
- [ ] Admin dashboard for usage analytics
- [ ] Support for DOCX, TXT, and other file formats
- [ ] WebSocket-based real-time processing updates
- [ ] OAuth 2.0 / Social login integration

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <p>Built with 💚 by <strong>ARNAB</strong></p>
  <p>ORION v2.0 IS LIVE 🚀</p>
</div>

