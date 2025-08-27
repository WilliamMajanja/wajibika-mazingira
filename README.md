# Wajibika Mazingira

**Wajibika Mazingira** is an intuitive web application designed to assist environmental legal practitioners, government officials, and the public in Kenya. It provides AI-powered tools to perform various impact assessments (Climate, Environmental, etc.), a community forum for discussion, and a public evidence locker to foster transparency and accountability.

---

## Features

- **AI-Powered Assessments**: Generate comprehensive Environmental, Climate, Social, and Health Impact Assessments using Google's Gemini AI, grounded in Kenyan law.
- **Community Forum**: A dedicated space for practitioners, officials, and the public to discuss environmental issues, share knowledge, and collaborate.
- **Public Evidence Locker**: A platform for anyone to submit evidence of environmental incidents—including images and documents—creating a public record for accountability.
- **AI Legal Assistant**: An interactive chat assistant trained to answer questions specifically about Kenyan environmental legislation.
- **Secure Authentication**: User management is handled securely via Auth0, supporting social logins and modern security standards.
- **Resource Hub**: A curated list of links to key Kenyan environmental bodies and legal resources.

---

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Backend**: Netlify Functions (Node.js)
- **Database**: Neon (Serverless PostgreSQL)
- **Authentication**: Auth0
- **AI**: Google Gemini API (`gemini-2.5-flash`)

---

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/):
  ```bash
  npm install netlify-cli -g
  ```

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd wajibika-mazingira
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of your project by copying the example file:

```bash
cp .env.example .env
```

Now, open the `.env` file and fill in the values for each variable. All variables are required for the application to function correctly.

- **Auth0**: Get your Domain, Client ID, and Audience from your Auth0 application settings.
- **Database**: Get your connection string from your Neon DB project.
- **Google AI**: Get your API Key from the [Google AI Studio](https://aistudio.google.com/app/apikey).

```ini
# .env file

# Auth0 Configuration
VITE_AUTH0_DOMAIN="your-auth0-domain.us.auth0.com"
VITE_AUTH0_CLIENT_ID="your-auth0-client-id"
VITE_AUTH0_AUDIENCE="your-auth0-api-audience"

# Neon Database Connection String
DATABASE_URL="postgresql://user:password@host/dbname"

# Google Gemini API Key
API_KEY="your-google-api-key"
```

### 4. Set Up the Database Schema

Connect to your Neon database using the provided SQL editor in your Neon dashboard. Run the following SQL script to create the necessary tables for the application.

```sql
-- Creates the table to store user-generated assessments
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    type VARCHAR(50) NOT NULL,
    report JSONB,
    manual_form JSONB
);

-- Creates the table for the public evidence locker
-- Evidence can be stand-alone or linked to a specific assessment
CREATE TABLE evidence (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    date_of_evidence DATE NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    file_content TEXT,
    file_mime_type VARCHAR(255),
    tags TEXT[],
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE CASCADE
);

-- Creates the table for forum discussion threads
-- Threads can be general or linked to a specific assessment
CREATE TABLE forum_threads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMPTZ DEFAULT NOW(),
    assessment_id INTEGER REFERENCES assessments(id) ON DELETE SET NULL
);

-- Creates the table for messages within a forum thread
CREATE TABLE forum_messages (
    id SERIAL PRIMARY KEY,
    thread_id INTEGER NOT NULL REFERENCES forum_threads(id) ON DELETE CASCADE,
    author JSONB NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    likes INTEGER DEFAULT 0,
    liked_by VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[]
);
```

### 5. Run the Development Server

The `netlify dev` command starts both the Vite frontend server and the Netlify Functions server, creating a development experience that mirrors the production environment.

```bash
netlify dev
```

Your application should now be running at `http://localhost:8888`.

---

## Deployment

This project is configured for one-click deployment to [Netlify](https://www.netlify.com/).

1.  Push your code to a GitHub repository.
2.  Connect the repository to a new site in your Netlify dashboard.
3.  Configure the same environment variables from your `.env` file in the Netlify site's **Site configuration > Environment variables** section.
4.  Trigger a new deploy. Netlify will automatically build and deploy your site and functions.