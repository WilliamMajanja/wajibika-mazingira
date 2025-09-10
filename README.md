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
  <img alt="Technology" src="https://img.shields.io/badge/Deploy_to_Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white">
</p>

**Wajibika Mazingira** (Swahili for "Be Responsible for the Environment") is a powerful, serverless web application designed to democratize environmental and social impact assessments in Kenya. It leverages the Google Gemini API to provide communities, activists, and planners with instant, detailed reports, a secure place to store evidence, and an AI-powered assistant for community discussions.

---

## ✨ Features Showcase

### 1. AI Impact Assessment Generator
Generate five distinct types of impact assessments (Environmental, Social, Health, Climate, Cumulative) tailored to your project. The form uses the **Global Industry Classification Standard (GICS)** for standardized, high-quality inputs.

![Screenshot of the AI Impact Assessment Generator interface, showing the form on the left and a generated report on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/assessment-generator.png)

### 2. Professional PDF Exports
Export any generated assessment as a polished, professional PDF. The document is branded and includes all project metadata, proponent details, and optional assessor information, ready for printing and official use.

![Screenshot of the professionally formatted PDF document, showing a clear header, metadata section, and formatted report content.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/pdf-export.png)

### 3. Secure Evidence Locker
All generated assessments are saved directly in your browser's local storage. The Evidence Locker provides a secure, private, and offline-accessible space to review, manage, delete, and re-export your reports.

![Screenshot of the Evidence Locker, displaying a list of saved assessments on the left and the content of the selected report on the right.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/evidence-locker.png)

### 4. AI Community Assistant
Engage in a real-time conversation with "Mazingira Rafiki," an AI assistant fine-tuned to discuss environmental and social topics within the Kenyan context. It's a safe space to ask questions, share concerns, and get informative feedback.

![Screenshot of the AI Community Assistant chat interface, showing a conversation between a user and the AI bot.](https://storage.googleapis.com/aistudio-programmable-ui-project-assets/wajibika-mazingira-demo/ai-assistant.png)

---

## 🚀 Core Capabilities

-   **Dynamic AI Assessment Generation**: Create detailed reports for various impact categories.
-   **Customizable PDF Reports**: Add project proponents and optional assessor details for official documentation.
-   **Standardized Industry Input**: Uses GICS for accurate and consistent project classification.
-   **Secure & Private Storage**: All data is stored exclusively in the browser via `localStorage`. No data ever leaves your machine.
-   **Real-time AI Chat**: Get instant, context-aware responses from a specialized AI assistant.
-   **Fully Responsive**: A seamless experience on desktop, tablet, and mobile devices.
-   **User-Friendly Feedback**: Toast notifications confirm actions like saving or deleting reports.
-   **Zero Backend**: A truly serverless application, ensuring privacy and ease of deployment.

---

## 🛠️ Technology Stack

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS
-   **AI Model**: Google Gemini API (`gemini-2.5-flash`)
-   **Client-side Storage**: `useLocalStorage` custom hook
-   **Architecture**: No-build, CDN-based, serverless Single-Page Application (SPA)

---

## ⚙️ Getting Started

This project is configured to run without a local build step, using CDN-hosted libraries.

### Prerequisites

-   A modern web browser (Chrome, Firefox, Safari, Edge).
-   A valid **Google Gemini API Key**.

### Running the Application

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/wajibika-mazingira.git
    cd wajibika-mazingira
    ```
2.  **Set up the API Key:**
    The application is designed to run in an environment where the `process.env.API_KEY` is already available (e.g., Netlify environment variables, Google's Project IDX). **Do not hardcode your key in the source code.**
3.  **Serve the files:**
    You can use a simple static file server to run the project locally.
    ```bash
    # If you have Python 3
    python -m http.server

    # Or use the Live Server extension in VS Code
    ```
4.  Open your browser and navigate to the provided local address (e.g., `http://localhost:8000`).

---

## ☁️ Deployment to Netlify

This application is optimized for a seamless deployment to Netlify.

1.  Push your cloned repository to your own GitHub account.
2.  Connect your GitHub account to Netlify.
3.  Select the repository and configure the build settings.
4.  Add your Gemini API key as an environment variable in the Netlify UI:
    -   **Key**: `API_KEY`
    -   **Value**: `Your-Gemini-API-Key-Here`

The project includes a `netlify.toml` file that correctly configures the site for a single-page application.

```toml
# netlify.toml

[build]
  command = "echo 'No build command required'"
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```