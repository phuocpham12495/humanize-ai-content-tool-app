# Project: Humanization Engine

## 1. Introduction
The Humanization Engine is a multi-layered system designed to transform AI-generated text into content that closely mimics human writing styles. Leveraging the Google Gemini 2.5 Flash LLM, Next.js for the frontend, Node.js for the backend, and SQLite for data storage, this tool aims to provide a natural, imperfect, and contextually relevant output by simulating a real human mind rather than merely paraphrasing. The system operates without explicit user authentication.

## 2. Architecture Overview
The system follows a modular, pipeline-based architecture, processing input text through a series of humanization layers orchestrated by a Node.js backend. The Next.js frontend provides the user interface for interaction.

```
+----------------+       +-------------------+       +-------------------+       +-------------------+       +-------------------+       +-------------------+       +----------------+
|    Frontend    |       |      Backend      |       |  Gemini 2.5 Flash |       |      SQLite       |       |       Cache       |       |     Output      |       |  External APIs |
|  (Next.js App) |       |     (Node.js)     |       |       (LLM)       |       |     (Database)    |       |                   |       |                 |       | (e.g., AI Detect) |
+----------------+       +-------------------+       +-------------------+       +-------------------+       +-------------------+       +-------------------+       +----------------+
        | User Interaction          | API Requests              | LLM Inference             | Data Storage              | Temporary Data            | Rendered Text   |         |
        v                           v                           v                           v                           v                           v                 v
+-----------------------+     +-----------------------+
|     User Input        |     |   API Gateway /       |
|  (Text, Settings)     |<--->|   Request Handler     |
+-----------------------+     +-----------------------+
                                    |
                                    v
                            +-----------------------+
                            |   Humanization        |
                            |     Orchestrator      |
                            |   (Core Pipeline)     |
                            +-----------------------+
                                    |
          +------------------------------------------------------------------------------------------------------------------------------------------------+
          |                                                                                                                                                |
          |       +------------------------------------+      +------------------------------------+      +------------------------------------+       |
          |       | 1. AI Detection Analysis Layer     |----->| 2. Writing Style Injection Layer |----->| 3. Imperfection Engine Layer     |----->|
          |       | (Burstiness, Perplexity, Variance) |      | (Casual, Professional, Messy)    |      | (Grammar looseness, Bias)          |       |
          |       +------------------------------------+      +------------------------------------+      +------------------------------------+       |
          |                 |                                             |                                           |                                |
          |                 v                                             v                                           v                                |
          |       +------------------------------------+      +------------------------------------+      +------------------------------------+       |
          |       | 4. Contextual Personalization Layer|----->| 5. Platform Optimization Layer   |----->|      Output Processing / Scoring   |----->|
          |       | (Experiences, Emotions, Audience)  |      | (Facebook, TikTok, LinkedIn)     |      |                                    |       |
          |       +------------------------------------+      +------------------------------------+      +------------------------------------+       |
          |                                                                                                                                                |
          +------------------------------------------------------------------------------------------------------------------------------------------------+
                                    |
                                    v
                            +-----------------------+
                            | Response Formatting / |
                            |     Streaming         |
                            +-----------------------+
                                    |
                                    v
                            +-----------------------+
                            |      API Response     |
                            +-----------------------+
                                    |
                                    v
                            +-----------------------+
                            |  Frontend Rendering   |
                            +-----------------------+
```

## 3. Technology Stack

*   **Frontend:** Next.js (React Framework for SSR/SSG, efficient UI)
*   **Backend:** Node.js (Express.js for API, asynchronous processing)
*   **Database:** SQLite (Lightweight, file-based database for local storage, no authentication needed)
*   **AI Model:** Google Gemini 2.5 Flash (for all generative text transformations and analysis)
*   **Deployment:** (Implicitly assumed to be self-hosted given SQLite, e.g., on a VPS or cloud instance without complex scaling needs initially).

## 4. Core Components and Data Flow

### 4.1. Input Layer
*   **Frontend:** Textarea for user input. Controls for humanization settings (styles, imperfections, context, platforms, advanced features).
*   **Backend API:** `POST /api/humanize` endpoint receives raw text and a JSON payload of desired humanization parameters.

### 4.2. Humanization Orchestrator (Backend)
This module sequences the various humanization layers based on user-selected settings. Each layer communicates with the Gemini 2.5 Flash model through carefully crafted prompts.

### 4.3. Layer 1: AI Detection Analysis
*   **Purpose:** Assess the "AI-likeness" of the input text.
*   **Mechanism:**
    *   Utilize Gemini 2.5 Flash for text analysis, prompting it to evaluate aspects like:
        *   **Burstiness:** Predictability of sentence length and structure.
        *   **Perplexity:** How predictable the next word is.
        *   **Sentence Variance:** Repetitive phrasing or syntax.
    *   The LLM can be prompted to output a score (e.g., 0-100) and identify specific sentences/phrases exhibiting AI patterns.
*   **Output:** `aiLikenessScore` (integer), `suspiciousSentences` (array of objects with `text`, `reason`, `start_char`, `end_char`).

### 4.4. Layer 2: Writing Style Injection (Pattern Breaker)
*   **Purpose:** Transform content based on selected human writing styles.
*   **Mechanism:**
    *   Gemini 2.5 Flash is instructed with specific style guidelines:
        *   **Casual (Gen Z / social media):** Use slang, emojis, informal contractions.
        *   **Professional (LinkedIn tone):** Structured, concise, authoritative, empathetic.
        *   **Storytelling (personal narrative):** Chronological flow, emotional language, vivid descriptions.
        *   **Opinionated (strong POV):** Assertive language, personal convictions, persuasive tone.
        *   **Messy human (intentional imperfection):** Varying sentence lengths, occasional colloquialisms, slight deviations from perfect grammar.
    *   The prompt will guide the LLM to rewrite the input text (or the output from Layer 1) according to the chosen mode.
*   **Input:** Text from previous layer, `writingStyle` enum.
*   **Output:** Transformed text.

### 4.5. Layer 3: Imperfection Engine
*   **Purpose:** Inject authentic human imperfections into the text.
*   **Mechanism:**
    *   Gemini 2.5 Flash is prompted to introduce controlled imperfections:
        *   **Slight grammar looseness:** Minor errors (e.g., subject-verb disagreement in casual contexts, run-on sentences).
        *   **Sentence fragments:** Deliberately incomplete sentences for effect.
        *   **Personal bias:** Subtle leanings or prejudices.
        *   **Micro contradictions:** Small, inconsequential inconsistencies.
    *   This layer would receive the style-injected text and apply these nuanced changes.
*   **Input:** Text from previous layer.
*   **Output:** Text with injected imperfections.

### 4.6. Layer 4: Contextual Personalization
*   **Purpose:** Make content feel like it came from a real person by adding personal context.
*   **Mechanism:**
    *   Gemini 2.5 Flash is given context for personalization:
        *   **Experiences:** "I tried this last week..."
        *   **Emotions:** "kinda frustrating tbh"
        *   **Opinions:** "I wouldn't recommend this for beginners"
    *   Optional user inputs (`targetAudience`, `platform`, `personalitySlider`) would further guide the LLM in generating relevant context.
*   **Input:** Text from previous layer, optional personalization parameters.
*   **Output:** Contextually enriched text.

### 4.7. Layer 5: Platform Optimization
*   **Purpose:** Tailor the humanized content for specific social media platforms.
*   **Mechanism:**
    *   Gemini 2.5 Flash is given platform-specific guidelines to refine the text:
        *   **Facebook:** Conversational, emotional, longer paragraphs often.
        *   **TikTok:** Short, punchy, hook-driven, often with implied visuals.
        *   **LinkedIn:** Insightful, structured but personal, professional vocabulary.
        *   **Twitter/X:** Opinionated, sharp, concise, hashtag usage.
    *   This layer acts as a final polish, adjusting word choice, sentence structure, and overall tone.
*   **Input:** Text from previous layer, `platform` enum.
*   **Output:** Platform-optimized humanized text.

### 4.8. Output Processing & Scoring
*   **Purpose:** Aggregate scores and format the final output.
*   **Mechanism:**
    *   **Human Score:** Derived from the overall transformation quality and internal metrics, potentially re-evaluating the output with Layer 1's detection.
    *   **AI Detectability:** An assessment of how likely the *final* text is to be flagged by AI detectors, utilizing specialized prompts for Gemini or potentially an external classifier.
    *   **Engagement Potential:** Heuristic analysis based on keywords, emotional intensity, hooks, and call-to-actions (especially for viral modes).
*   **Output:** Final humanized text, `humanScore`, `aiDetectability`, `engagementPotential`.

## 5. Advanced Feature Implementation Details

### 5.1. Human Fingerprint Simulation
*   **Technical:** Store user-defined "fingerprint" profiles (e.g., `favoritePhrases: ["lol", "ngl"]`, `emojiHabits: ["😂", "🔥"]`, `punctuationStyle: "—"`, `sentenceRhythm: "long sentences"`). These are passed as additional parameters to the LLM during Layer 2/3/4 prompting to guide its output.

### 5.2. Anti-AI Detector Mode
*   **Technical:** This involves specialized prompt engineering for Gemini 2.5 Flash across multiple layers. Techniques include:
    *   Explicitly instructing the LLM to vary sentence structures, avoid common AI-generated phrases, introduce less predictable word choices.
    *   Injecting semantic variations, paraphrasing concepts in unconventional ways.
    *   Potentially chaining calls to evaluate output against a simulated "AI detector" prompt and re-generating if needed.

### 5.3. "Before vs After Humanization"
*   **Technical:** The backend stores the original input text. The frontend receives both the original and the final humanized text. A client-side diffing library (e.g., `diff-match-patch`) can be used to highlight changes for visual comparison.

### 5.4. Emotional Depth Slider
*   **Technical:** The slider value (e.g., 0-100%) maps to an `emotionalIntensity` parameter in LLM prompts, particularly in Layer 4 (Contextual Personalization) and Layer 2 (Writing Style). Prompts would be conditioned: "Rewrite this text with [X]% emotional intensity, expressing [specific emotions]."

### 5.5. "Human Noise Injection"
*   **Technical:** This is part of the Imperfection Engine (Layer 3). The LLM is prompted to strategically insert phrases like "kind of," "maybe," "I guess," "actually… wait…" at appropriate conversational junctures.

### 5.6. Multi-Person Rewrite
*   **Technical:** Predefined personas (Beginner, Expert, Influencer, Skeptic) are essentially complex style and contextual parameter sets. The backend passes these detailed persona descriptions as part of the LLM prompt for Layer 2/4 transformations.

### 5.7. Cultural Localization
*   **Technical:** Requires comprehensive prompt engineering. Gemini 2.5 Flash would be instructed to adapt tone, slang, and cultural references for a specified target culture (e.g., "Vietnamese tone," "US tone"). This is challenging and relies heavily on the LLM's pre-training data and ability to understand cultural nuances. It may involve specific cultural vocabulary lists or example-based (few-shot) prompting.

## 6. UX Feature Implementation Details

### 6.1. One-click Modes
*   **Technical:** Predefined configurations (sets of parameters for style, imperfections, context, platform, and advanced features) are stored in the backend (SQLite) or as static JSON. When a user selects a mode, the frontend sends the corresponding configuration to the backend API.

### 6.2. Highlight AI Parts
*   **Technical:** Layer 1 (AI Detection Analysis) returns `suspiciousSentences` with character offsets. The Next.js frontend processes this data to apply specific CSS styling (e.g., red underline) to the detected segments in the original text.

### 6.3. Live Rewrite (Streaming)
*   **Technical:** The Node.js backend would use Server-Sent Events (SSE) or WebSockets to stream intermediate or incremental outputs from the Gemini 2.5 Flash model. The Next.js frontend listens to this stream and updates the output textarea in real-time. This requires the LLM API to support streaming responses.

### 6.4. Tone Playground
*   **Technical:** Sliders (Humor, Formality, Emotion) on the frontend dynamically adjust parameters sent to the backend. The backend then constructs and sends new LLM prompts with these updated tone parameters for real-time (or near real-time) re-transformation of the text.

## 7. Scoring System Implementation

*   **Technical:** The `humanScore`, `aiDetectability`, and `engagementPotential` are calculated in the Output Processing & Scoring module.
    *   `humanScore`: A weighted average of metrics from Layer 1's initial analysis, combined with a qualitative assessment by the LLM (prompted to rate human-likeness of the *final* text).
    *   `aiDetectability`: Derived from a secondary LLM call or a lightweight classifier specifically trained/prompted to identify AI patterns in the *final* output.
    *   `engagementPotential`: Calculated based on keyword analysis, emotional sentiment detection, and the presence of elements like hooks, CTAs, and curiosity gaps (especially for viral modes), potentially using a separate NLP library or LLM prompt.

## 8. Viral Feature: "Make it Facebook Viral"

*   **Technical:** This is an advanced "One-click Mode." The associated configuration will include specific instructions for Gemini 2.5 Flash within the Contextual Personalization (Layer 4) and Platform Optimization (Layer 5) to:
    *   Generate a compelling **hook** (e.g., question, bold statement).
    *   Create a **curiosity gap** (implying more information will follow).
    *   Inject strong **emotional triggers** (e.g., surprise, frustration, delight).
    *   Add a clear **Call to Action (CTA)**.
    *   Combine these with Facebook-specific stylistic conventions.

## 9. Data Storage (SQLite)

*   **Database Schema (Example):**
    *   `configs`: Stores predefined humanization modes, style profiles, persona definitions (`id`, `name`, `parameters_json`).
    *   `session_history`: (Optional, if temporary session history is desired) `session_id`, `original_text`, `humanized_text`, `settings_json`, `timestamp`.
*   **Usage:** SQLite will be used primarily for storing static configurations, advanced feature parameters, and potentially temporary user session data (without explicit user accounts) to enable features like "Before vs After" or "Human Fingerprint Simulation" persistence during a single browser session.

## 10. API Design (Node.js/Express.js)

*   `POST /api/humanize`:
    *   Request Body: `{ "text": "...", "settings": { ... } }`
    *   Response Body: `{ "humanizedText": "...", "scores": { "humanScore": ..., "aiDetectability": ..., "engagementPotential": ... }, "highlights": [...] }`
*   `GET /api/modes`:
    *   Response Body: `[{ "id": "viral", "name": "Make it Viral" }, ...]`
*   `POST /api/humanize/stream`: (For Live Rewrite)
    *   Request Body: `{ "text": "...", "settings": { ... } }`
    *   Response: Server-Sent Events (stream of text chunks and status updates).

## 11. Considerations and Future Enhancements

*   **LLM Prompt Engineering:** This is the most critical aspect. Iterative refinement of prompts for Gemini 2.5 Flash will be necessary to achieve nuanced humanization.
*   **Performance:** LLM inference can be slow. Backend caching strategies (e.g., Redis for frequent partial results or common transformations) might be considered if performance becomes an issue. Optimize concurrent LLM calls.
*   **Error Handling:** Robust error handling for LLM API calls, input validation, and internal pipeline failures.
*   **Cost Management:** Monitor Gemini 2.5 Flash API usage to manage costs.
*   **Extensibility:** Design the pipeline to easily add new layers or advanced features.
*   **Security:** Despite no authentication, input validation and sanitization are essential to prevent prompt injection or other vulnerabilities.
*   **UX/UI:** Focus on an intuitive interface given the complexity of the underlying humanization engine.
