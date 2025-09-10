<div align="center">
  <img src="https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/logo.svg" alt="Wajibika Mazingira Logo" width="150">
  <h1>Wajibika Mazingira</h1>
  <p><strong>Empowering Kenyan communities with AI-driven environmental oversight.</strong></p>
  <p>
    <a href="https://app.aistudio.google.com/github/googlestaging/prodx-apps/blob/main/demos/wajibika-mazingira?branch=main" target="_blank"><img alt="Open in Project IDX" src="https://lh3.googleusercontent.com/some-random-string/w210-h40-p/G-C-black-lockup-2x.png" /></a>
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

**Wajibika Mazingira** (Swahili for "Be Responsible for the Environment") is a powerful, serverless web application designed to democratize environmental and social impact assessments in Kenya. It leverages the Google Gemini API to provide communities, activists, and planners with instant, detailed reports, a secure place to store evidence, and an AI-powered assistant for community discussions.

---

## ✨ Features Showcase

### 1. AI Impact Assessment Generator
Generate five distinct types of impact assessments (Environmental, Social, Health, Climate, Cumulative) tailored to your project. 

![Screenshot of the AI Impact Assessment Generator interface, showing the form on the left and a generated report on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/assessment-generator.png)

### 2. Professional PDF Exports
Export any generated assessment as a polished, professional PDF, ready for printing and official use.

![Screenshot of the professionally formatted PDF document, showing a clear header, metadata section, and formatted report content.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/pdf-export.png)

### 3. Secure Evidence Locker
All generated assessments are saved directly in your browser's local storage. The Evidence Locker provides a secure, private, and offline-accessible space to review, manage, delete, and re-export your reports.

![Screenshot of the Evidence Locker, displaying a list of saved assessments on the left and the content of the selected report on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/evidence-locker.png)

### 4. AI Community Assistant
Engage in a real-time conversation with "Mazingira Rafiki," an AI assistant fine-tuned to discuss environmental and social topics within the Kenyan context.

![Screenshot of the AI Community Assistant chat interface, showing a conversation between a user and the AI bot.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/ai-assistant.png)

---

## 🚀 Core Capabilities

-   **Secure AI Backend**: Uses Netlify Functions to protect the Gemini API key, ensuring it's never exposed to the browser.
-   **Dynamic AI Assessment Generation**: Create detailed reports for various impact categories.
-   **Customizable PDF Reports**: Add project proponents and optional assessor details for official documentation.
-   **Secure & Private Storage**: All data is stored exclusively in the browser via `localStorage`.
-   **Real-time Streaming Chat**: Get instant, streaming responses from the specialized AI assistant.
-   **Fully Responsive**: A seamless experience on desktop, tablet, and mobile devices.

---

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **AI Model**: Google Gemini API (`gemini-2.5-flash`)
-   **Backend**: Serverless via Netlify Functions
-   **Client-side Storage**: `useLocalStorage` custom hook
-   **Deployment**: Netlify

---

## ⚙️ Getting Started

This project is now configured with a standard build process.

### Prerequisites

-   Node.js and npm
-   A valid **Google Gemini API Key**.
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
