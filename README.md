<div align="center">
  <img src="https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/logo.svg" alt="Wajibika Mazingira Logo" width="150">
  <h1>Wajibika Mazingira</h1>
  <p><strong>Empowering Kenyan communities with AI-driven environmental oversight.</strong></p>
  <p><em>A minima PiNet OS project by William Majanja</em></p>
  <p>
    <a href="https://idx.google.com/from/github.com/google-dev-demos/wajibika-mazingira" target="_blank"><img alt="Open in Project IDX" src="https://idx.google.com/assets/badge.svg" /></a>
  </p>
</div>

<p align="center">
  <img alt="Technology" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Technology" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/GitHub_Copilot-000000?style=for-the-badge&logo=github-copilot&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="Technology" src="https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white">
</p>

**Wajibika Mazingira** (Swahili for "Be Responsible for the Environment") is a powerful web application designed to democratize environmental and social impact assessments in Kenya. Built as part of the **minima PiNet OS** ecosystem by **William Majanja**, it leverages the Google Gemini API to provide communities with instant, detailed reports, a secure evidence locker with AI-powered analysis, and an advanced, multi-modal community assistant.

> **Note:** This project is **not** affiliated with or related to Pi Network (the cryptocurrency). It is an independent project under the minima PiNet OS initiative by William Majanja.

---

## ✨ Features Showcase

Wajibika Mazingira is built on three core pillars, each designed to empower local communities:

### 1. AI Impact Assessment Generator
Generate five distinct types of impact assessments. Now featuring a **Deep Analysis** mode powered by `gemini-2.5-flash` for tackling the most complex project analyses.

![Screenshot showing the AI Impact Assessment Generator feature of Wajibika Mazingira. The form for project details is on the left, and the generated report is on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-prod/wajibika-mazingira-assessment.png)

### 2. Secure Evidence Locker with Image Analysis
Securely store reports and upload photographic evidence. Use the power of `gemini-2.0-flash` to get an instant AI analysis of your images, identifying potential environmental issues.

![Screenshot showing the Evidence Locker feature of Wajibika Mazingira. A list of saved assessments is on the left, and the selected report with an uploaded image is on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-prod/wajibika-mazingira-locker.png)

### 3. Advanced AI Community Assistant
Engage with "Mazingira Rafiki," an AI assistant with new capabilities:
- **Voice-to-Text**: Speak your message directly into the chat using your browser's speech recognition.
- **Text-to-Speech**: Listen to the AI's responses using your browser's speech synthesis.
- **Multi-Mode Operation**:
    - **Fast Mode** (`gemini-2.0-flash-lite`): For quick, low-latency answers.
    - **Smart Mode** (`gemini-2.0-flash`): For balanced, intelligent conversation.
    - **Grounded Mode** (`gemini-2.0-flash`): For factual answers grounded with Google Search.
    - **Maps Mode** (`gemini-2.0-flash`): For location-based questions like "find recycling centers near me."

![Screenshot showing the AI Community Assistant feature of Wajibika Mazingira. A chat interface displays a conversation between a user and the AI, with chat mode selectors visible.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-prod/wajibika-mazingira-chat.png)

---

## 🚀 Core Capabilities

-   **Client-Side AI Integration**: Calls the Google Gemini API directly from the browser via the `@google/genai` SDK for text generation, image analysis, and chat.
-   **Google Search Grounding**: Grounded and Maps chat modes use Gemini's built-in Google Search tool for factual, up-to-date answers.
-   **Browser-Native Speech**: Uses the Web Speech API for voice-to-text input and text-to-speech output — no API key needed for speech features.
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
-   **AI Models**: Google Gemini API (`gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-2.5-flash`) via `@google/genai` SDK
-   **Client-side Storage**: `useLocalStorage` custom hook
-   **Deployment**: GitHub Pages

---

## ⚙️ Getting Started

### Prerequisites

-   Node.js and npm
-   A valid **Google Gemini API Key**. You can get one for free at [Google AI Studio](https://aistudio.google.com/apikey).

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/WilliamMajanja/wajibika-mazingira.git
    cd wajibika-mazingira
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up the API Key:**
    Create a `.env` file in the root of the project:
    ```
    VITE_GEMINI_API_KEY=Your-Gemini-API-Key-Here
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
5.  Open your browser and navigate to the local address provided (e.g., `http://localhost:5173`).

---

## ☁️ Deployment to GitHub Pages

This project is configured for automatic deployment via GitHub Actions.

1.  Push your repository to GitHub.
2.  Go to **Settings > Pages** and set the source to **GitHub Actions**.
3.  Add your Gemini API key as a repository secret:
    -   Go to **Settings > Secrets and variables > Actions**.
    -   Add a new repository secret:
        -   **Name**: `VITE_GEMINI_API_KEY`
        -   **Value**: `Your-Gemini-API-Key-Here`
4.  Push to the `main` branch (or trigger the workflow manually). Your site will be live at `https://<username>.github.io/wajibika-mazingira/`.

> **Note:** Because GitHub Pages is a static host, the API key is embedded in the built JavaScript bundle. Use API key restrictions in [Google AI Studio](https://aistudio.google.com/apikey) to limit usage to your deployment domain.