Project: Visual News Source
Status: In Development

✅ Completed Features
*   **Basic Interactive Map & UI:** Established the core Leaflet map, UI structure, and foundational hotspot functionality.
*   **Hybrid View (Country Avg. + City Hotspots):** Implemented a dual-layer visualization showing both macro-level country activity (background color) and micro-level city-specific events (hotspot circles).
*   **Interconnected Events Visualization (Static Chains):** Added the ability to draw persistent connection lines and multi-step chains on the map to represent pre-defined relationships between events.
*   **Causality Strength Indicator (Styled Lines):** Enhanced connection lines with distinct visual styles (solid/red for strong, dashed/blue for moderate, dotted/gray for weak) to represent the nature and strength of the influence.
*   **AI-Powered Analysis for Pre-defined Chains:** Integrated the Gemini API to provide on-demand narrative analysis when a user clicks on a pre-defined connection line or chain.

📝 Upcoming Features & Implementation Plan
1.  **Compare Two Events Side-by-Side (Next Up)**
    *   **Goal:** Allow users to select any two event hotspots to generate a novel, on-the-fly analysis of their potential connection.
    *   **Prerequisites & Workflow:**
        *   **[Prerequisite] Dynamic Knowledge Base Creation:** Before analysis, the system must perform an automated background check.
            *   **Action:** Query a real-time event database (e.g., GDELT Project) for historically and contextually relevant events related to the two selected locations.
            *   **Output:** An "on-the-fly dossier" of recent historical data that will provide context for the AI.
        *   **[Workflow] Two-Step AI Analysis:**
            *   **Step 1 (Intelligence Gathering):** The Gemini API is provided with the two primary events selected by the user, plus the contextual "dossier" of related historical events.
            *   **Step 2 (Synthesis & Analysis):** The AI is prompted to act as a geopolitical analyst, synthesizing the primary events within the context of the dossier to produce the final output.
        *   **[UI/UX] Output:** A modal window featuring a "Likelihood of Connection" score and a detailed narrative explanation.
2.  **"Chain of Events" Timeline Generator**
    *   **Goal:** Visualize how events unfold over time by showing potential preceding and subsequent events.
    *   **Implementation Idea:** When analyzing an event, trigger AI prompts like "What prior events likely led to this?" and "What might follow?"
3.  **Multiple AI Perspectives**
    *   **Goal:** Allow users to view an analysis through different lenses (e.g., Economic, Humanitarian, Military) to understand bias and complexity.
    *   **Implementation Idea:** Use UI buttons to trigger different, specially crafted prompts to the Gemini API for the same set of events.
4.  **Search & Command Box**
    *   **Goal:** Provide a direct entry point for analysis, allowing users to immediately find events by location or theme without manually searching the map.
    *   **Implementation Idea:**
        *   **Location Search:** User types a city name (e.g., "Ankara"), and the map pans and zooms to that location.
        *   **Keyword/Theme Search:** User types a theme (e.g., "trade policy"), and the map highlights all related event hotspots.
5.  **Source Transparency Layer**
    *   **Goal:** Build user trust by showing the provenance of the data for each event.
    *   **Implementation Idea:** Add source logos (e.g., Reuters, BBC) to event popups and include a "View Sources" button linking to the original articles.

---

### 💡 Agent-Suggested Features

*This section includes features suggested by a review agent.*

*   **Time-Based Analysis & Filtering:**
    *   **Time Slider:** Implement a time slider or date-range picker that filters the events shown on the map. This would allow a user to see how a situation evolves, for example, over a specific week or month.
    *   **Event Playback:** A "play" button that animates events on the map chronologically over a selected period, providing a powerful narrative of unfolding events.
*   **Deeper Data & Sentiment Analysis:**
    *   **Sentiment Layer:** In addition to "news volume," you could perform sentiment analysis on the source articles for each event. Hotspots could be colored to indicate whether the coverage is predominantly negative, neutral, or positive, adding another layer of insight.
    *   **Thematic Clustering:** Use an AI model to dynamically categorize events into themes (e.g., "Energy Security," "Diplomatic Relations," "Humanitarian Crisis") based on their content. Users could then filter the map by these themes to see the bigger picture.
*   **Enhanced User Interaction & Reporting:**
    *   **Private Annotations:** Allow users to add their own private notes to events or even draw their own connection lines on the map. This would shift the tool from just a presentation medium to a personal workspace for analysts.
    *   **Export to Report:** A feature to export the current map view (including any analysis lines and popups) as a high-resolution image or a PDF. This would be invaluable for journalists, researchers, and students who need to include visualizations in their work.

---

### 🏗️ Future Architectural & Code Refinements

*This section includes technical tasks to consider as the project grows in complexity.*

*   **Architectural Considerations:**
    *   **Data Scalability:** The current approach of storing all event data in a client-side `data.js` file will not scale. **Task:** Plan and implement a backend API to serve event data from a database. This will improve initial load times and allow for a much larger dataset.
    *   **Secure API Calls:** AI/ML API keys should not be exposed on the client side. **Task:** Create a backend service or serverless function to act as a proxy for all external API calls (e.g., to the Gemini API).
*   **Code Quality & Maintainability:**
    *   **Reduce Global Scope:** Much of the code in `app.js` runs in the global scope. **Task:** Refactor the JavaScript to use modern ES Modules or an IIFE to prevent polluting the global namespace and improve modularity.
    *   **Decouple HTML & JS:** Remove inline JavaScript handlers (`onclick="..."`) from `index.html`. **Task:** Refactor the code to attach all event listeners programmatically within `app.js`.
    *   **Component-Based Refactoring:** As the UI grows, `app.js` will become monolithic. **Task:** Proactively break down the code into smaller, feature-focused modules (e.g., `mapManager.js`, `uiPanel.js`, `apiClient.js`).
