<div align="center">
  <img src="https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/logo.svg" alt="Wajibika Mazingira Logo" width="150">
  <h1>Wajibika Mazingira</h1>
  <p><strong>Empowering Kenyan communities with AI-driven environmental oversight.</strong></p>
  <p>
    <a href="https://idx.google.com/from/github.com/google-dev-demos/wajibika-mazingira" target="_blank"><img alt="Open in Project IDX" src="https://idx.google.com/assets/badge.svg" /></a>
  </p>
</div>

<p align="center">
  <img alt="Technology" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Technology" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white">
</p>

**Wajibika Mazingira** (Swahili for "Be Responsible for the Environment") is a powerful, serverless web application designed to democratize environmental and social impact assessments in Kenya. It leverages the Google Gemini API to provide communities with instant, detailed reports, a secure evidence locker with AI-powered analysis, and an advanced, multi-modal community assistant.

---

## ✨ Features Showcase

Wajibika Mazingira is built on three core pillars, each designed to empower local communities:

### 1. AI Impact Assessment Generator
Generate five distinct types of impact assessments. Now featuring a **Deep Analysis** mode powered by `gemini-2.5-pro` with a maxed-out `thinkingBudget` for tackling the most complex project analyses.

![Screenshot showing the AI Impact Assessment Generator feature of Wajibika Mazingira. The form for project details is on the left, and the generated report is on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-prod/wajibika-mazingira-assessment.png)

### 2. Secure Evidence Locker with Image Analysis
Securely store reports and upload photographic evidence. Use the power of `gemini-2.5-flash` to get an instant AI analysis of your images, identifying potential environmental issues.

![Screenshot showing the Evidence Locker feature of Wajibika Mazingira. A list of saved assessments is on the left, and the selected report with an uploaded image is on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-prod/wajibika-mazingira-locker.png)

### 3. Advanced AI Community Assistant
Engage with "Mazingira Rafiki," an AI assistant with new capabilities:
- **Voice-to-Text**: Speak your message directly into the chat for transcription.
- **Text-to-Speech**: Listen to the AI's responses.
- **Multi-Mode Operation**:
    - **Fast Mode** (`gemini-2.5-flash-lite`): For quick, low-latency answers.
    - **Smart Mode** (`gemini-2.5-flash`): For balanced, intelligent conversation.
    - **Grounded Mode** (`gemini-2.5-flash` with Google Search): For up-to-date, factual answers on recent topics, complete with citations.
    - **Maps Mode** (`gemini-2.5-flash` with Google Maps): For location-based questions like "find recycling centers near me," with links to places on Google Maps.

![Screenshot showing the AI Community Assistant feature of Wajibika Mazingira. A chat interface displays a conversation between a user and the AI, with chat mode selectors visible.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-prod/wajibika-mazingira-chat.png)

---

## 🚀 Core Capabilities

-   **Multi-Modal AI Backend**: Uses a versatile Netlify Function to securely handle requests for text generation, image analysis, audio transcription, and text-to-speech with various Gemini models.
-   **Dynamic AI Assessment Generation**: Create detailed reports with standard or deep-analysis modes.
-   **Visual Evidence Analysis**: Upload and analyze images for environmental context.
-   **Multi-Mode Chat**: Switch between fast, smart, search-grounded, and map-grounded conversation modes.
-   **Accessible Communication**: Use voice-to-text for input and text-to-speech for output.
-   **Secure & Private Storage**: All data is stored exclusively in the browser via `localStorage`.
-   **Fully Responsive**: A seamless experience on desktop, tablet, and mobile devices.

---

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **AI Models**: Google Gemini API (`gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.5-flash-preview-tts`)
-   **Backend**: Serverless via Netlify Functions
-   **Client-side Storage**: `useLocalStorage` custom hook
-   **Deployment**: Netlify

---

## ⚙️ Getting Started

This project is now configured with a standard build process.

### Prerequisites

-   Node.js and npm
-   A valid **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).
-   [Netlify CLI](https://docs.netlify.com/cli/get-started/) (for local development)

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/wajibika-mazingira.git
    cd wajibika-mazingira
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up the API Key:**
    The application requires the `API_KEY` to be available as an environment variable. For local development with the Netlify CLI, create a `.env` file in the root of the project:
    ```
    # .env
    API_KEY="Your-Gemini-API-Key-Here"
    ```
4.  **Run the development server:**
    Use the Netlify CLI to run the Vite dev server and the serverless functions together.
    ```bash
    ntl dev
    ```
5.  Open your browser and navigate to the local address provided by the CLI (e.g., `http://localhost:8888`).

---

## ☁️ Deployment to Netlify

1.  Push your repository to GitHub, GitLab, or Bitbucket.
2.  Connect your Git provider to Netlify.
3.  Select the repository. The `netlify.toml` file in the project will automatically configure the build command (`npm run build`) and the publish directory (`dist`).
4.  Add your Gemini API key as an environment variable in the Netlify site settings:
    -   Go to **Site configuration > Environment variables**.
    -   Add a new variable:
        -   **Key**: `API_KEY`
        -   **Value**: `Your-Gemini-API-Key-Here`
5.  Trigger a deploy. Your site will be live!