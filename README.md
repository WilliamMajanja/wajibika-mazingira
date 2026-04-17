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

**Wajibika Mazingira** (Swahili for "Be Responsible for the Environment") is a powerful web application designed to democratize environmental and social impact assessments in Kenya. Built as part of the **minima PiNet OS** ecosystem by **William Majanja**, it leverages GitHub Copilot (via GitHub Models) to provide communities with instant, detailed reports, a secure evidence locker with AI-powered analysis, and an advanced, multi-modal community assistant.

> **Note:** This project is **not** affiliated with or related to Pi Network (the cryptocurrency). It is an independent project under the minima PiNet OS initiative by William Majanja.

---

## ✨ Features Showcase

Wajibika Mazingira is built on three core pillars, each designed to empower local communities:

### 1. AI Impact Assessment Generator
Generate five distinct types of impact assessments. Now featuring a **Deep Analysis** mode powered by `gpt-4o` for tackling the most complex project analyses.

![Screenshot showing the AI Impact Assessment Generator feature of Wajibika Mazingira. The form for project details is on the left, and the generated report is on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-prod/wajibika-mazingira-assessment.png)

### 2. Secure Evidence Locker with Image Analysis
Securely store reports and upload photographic evidence. Use the power of `gpt-4o` to get an instant AI analysis of your images, identifying potential environmental issues.

![Screenshot showing the Evidence Locker feature of Wajibika Mazingira. A list of saved assessments is on the left, and the selected report with an uploaded image is on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-prod/wajibika-mazingira-locker.png)

### 3. Advanced AI Community Assistant
Engage with "Mazingira Rafiki," an AI assistant with new capabilities:
- **Voice-to-Text**: Speak your message directly into the chat using your browser's speech recognition.
- **Text-to-Speech**: Listen to the AI's responses using your browser's speech synthesis.
- **Multi-Mode Operation**:
    - **Fast Mode** (`gpt-4o-mini`): For quick, low-latency answers.
    - **Smart Mode** (`gpt-4o`): For balanced, intelligent conversation.
    - **Grounded Mode** (`gpt-4o`): For factual answers on recent topics.
    - **Maps Mode** (`gpt-4o`): For location-based questions like "find recycling centers near me."

![Screenshot showing the AI Community Assistant feature of Wajibika Mazingira. A chat interface displays a conversation between a user and the AI, with chat mode selectors visible.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-prod/wajibika-mazingira-chat.png)

---

## 🚀 Core Capabilities

-   **Client-Side AI Integration**: Calls the GitHub Models API (OpenAI-compatible) directly from the browser for text generation, image analysis, and chat.
-   **Browser-Native Speech**: Uses the Web Speech API for voice-to-text input and text-to-speech output — no API key needed for speech features.-   **Dynamic AI Assessment Generation**: Create detailed reports with standard or deep-analysis modes.
-   **Visual Evidence Analysis**: Upload and analyze images for environmental context.
-   **Multi-Mode Chat**: Switch between fast, smart, search-grounded, and map-grounded conversation modes.
-   **Accessible Communication**: Use voice-to-text for input and text-to-speech for output.
-   **Secure & Private Storage**: All data is stored exclusively in the browser via `localStorage`.
-   **Fully Responsive**: A seamless experience on desktop, tablet, and mobile devices.

---

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **AI Models**: GitHub Models API (`gpt-4o`, `gpt-4o-mini`) via OpenAI-compatible endpoint
-   **Client-side Storage**: `useLocalStorage` custom hook
-   **Deployment**: GitHub Pages

---

## ⚙️ Getting Started

### Prerequisites

-   Node.js and npm
-   A valid **GitHub Personal Access Token (PAT)**. You can create one at [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens). The token needs access to GitHub Models.

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
3.  **Set up the API Token:**
    Create a `.env` file in the root of the project:
    ```
    VITE_GITHUB_TOKEN=Your-GitHub-PAT-Here
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
3.  Add your GitHub token as a repository secret:
    -   Go to **Settings > Secrets and variables > Actions**.
    -   Add a new repository secret:
        -   **Name**: `VITE_GITHUB_TOKEN`
        -   **Value**: `Your-GitHub-PAT-Here`
4.  Push to the `main` branch (or trigger the workflow manually). Your site will be live at `https://<username>.github.io/wajibika-mazingira/`.

> **Security Note:** Because GitHub Pages is a static host, the GitHub token is embedded in the built JavaScript bundle. Use a fine-grained personal access token with minimal scopes and consider restricting access via GitHub's token settings.