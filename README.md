# DATAPILOT AI

Welcome to this repository! This project bridges the gap between plain English and your database, allowing anyone to ask questions about their data and receive instant, visualized answers.

## Features

- **Natural Language to SQL**: Ask questions in plain English, and the AI generates and executes optimized SQL queries.
- **Multi-Database Support**: Connect to **MySQL** databases or upload **CSV files** (automatically converted to SQLite) for instant analysis.
- **Interactive Visualizations**:
  - **Dynamic Charts**: Automatically renders Bar, Line, Pie, and Area charts based on query results.
  - **Schema Viewer**: Explore your database tables and columns.
  - **ERD (Entity Relationship Diagram)**: Visualize table relationships with an interactive diagram.
- **Smart Context**:
  - **Chat History**: Maintains conversation context for follow-up questions.
  - **Favorites**: Pin your most important queries.
  - **Sample Questions**: AI generates relevant sample questions for your specific schema.
- **Secure**:
  - **Authentication**: Secure Login/Register with JWT.
  - **Code Safety**: Read-only database access and strictly scoped queries.

## Tech Stack

This project uses a modern, microservices-based architecture:

- **Frontend**:
  - **Next.js (App Router)** with **TypeScript** for a responsive, server-side rendered UI.
  - **Tailwind CSS** & **Lucide React** for a sleek, dark-mode-first design.
  - **Recharts** for data visualization.
  - **React Flow** for ERD visualization.
- **Backend**:
  - **Node.js** & **Express** with **TypeScript**.
  - **MongoDB** for storing user sessions, project metadata, and chat history.
  - **Modular Controller/Route Structure** for maintainability.
- **AI Service**:
  - **Python (FastAPI)** based microservice.
  - **LangChain** for orchestrating LLM interactions.
  - **Google Gemini Flash** for high-speed, cost-effective SQL generation.
  - **SQLAlchemy** & **Pandas** for robust data handling.

## Getting Started

### Prerequisites

- **Docker** & **Docker Compose** installed on your machine.

### Installation

1.  **Clone the repository**:

    ```bash
    git clone <repository-url>
    cd TextToSQL
    ```

2.  **Environment Setup**:
    - Create a `.env` file in the root directory (optional, defaults provided in `docker-compose.yml` for development).
    - Ensure you have a valid `GOOGLE_API_KEY` for the AI Service.

3.  **Run with Docker**:

    ```bash
    docker-compose up --build
    ```

4.  **Access the App**:
    - Frontend: `http://localhost:3001`
    - Backend API: `http://localhost:3000`
    - AI Service Docs: `http://localhost:5001/docs`

## Usage

1.  **Sign Up/Login**: Create an account to isolate your projects.
2.  **Create a Project**:
    - **MySQL**: Enter your database credentials (host, user, password, database).
    - **CSV**: Simply upload a CSV file.
3.  **Start Querying**:
    - Select your project from the sidebar.
    - Type a question like "Show me the top 5 users by sales".
    - View the SQL, the raw data table, and any generated charts!
4.  **Explore**: Use the sidebar to view the Schema/ERD or manage your chat history.

## Architecture

The system is split into three containers:

- `frontend`: Serves the Next.js application.
- `backend`: Handles API requests, auth, and communicates with the AI service.
- `ai-service`: The "brain" that generates SQL and inspects schemas.

Everything is orchestrated via `docker-compose` for a seamless developer experience.
