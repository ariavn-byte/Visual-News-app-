# Project Roadmap: Visual News Source
**Status:** In Development
**Guiding Principle:** This is a living document used to track the status of features from conception to evaluation to final inclusion in the application.

---

### 🌟 Core Features
*These are stable, approved features that form the foundation of the application.*

*   **Basic Interactive Map & UI:** Established the core Leaflet map, UI structure, and foundational hotspot functionality.
*   **Hybrid View (Country Avg. + City Hotspots):** Implemented a dual-layer visualization showing both macro-level country activity (background color) and micro-level city-specific events (hotspot circles).
*   **Interconnected Events Visualization (Static Chains):** Added the ability to draw persistent connection lines and multi-step chains on the map to represent pre-defined relationships between events.
*   **Causality Strength Indicator (Styled Lines):** Enhanced connection lines with distinct visual styles (solid/red for strong, dashed/blue for moderate, dotted/gray for weak) to represent the nature and strength of the influence.
*   **AI-Powered Analysis for Pre-defined Chains:** Integrated the Gemini API to provide on-demand narrative analysis when a user clicks on a pre-defined connection line or chain.

---

### 🧪 Features in Evaluation
*These features have been implemented as prototypes for testing and feedback. A decision on their final inclusion is pending.*

*   **Compare Two Events Side-by-Side**
    *   **Status:** Implemented for initial testing.
    *   **Goal:** Allows users to select any two event hotspots to generate a novel, on-the-fly analysis of their potential connection.
    *   **Note:** The implementation of this feature included a significant backend refactoring to move from a static data file to a client-server architecture with API endpoints for data and analysis. This improves security and scalability.

---

### 💡 Feature Ideas
*This is a backlog of ideas and concepts for potential future implementation and evaluation.*

*   **"Chain of Events" Timeline Generator:** Visualize how events unfold over time by showing potential preceding and subsequent events.
*   **Multiple AI Perspectives:** Allow users to view an analysis through different lenses (e.g., Economic, Humanitarian, Military) to understand bias and complexity.
*   **Search & Command Box:** Provide a direct entry point for analysis, allowing users to immediately find events by location or theme without manually searching the map.
*   **Source Transparency Layer:** Build user trust by showing the provenance of the data for each event.
*   **Time-Based Analysis & Filtering:** Implement a time slider or date-range picker to filter events on the map and animate them chronologically.
*   **Deeper Data & Sentiment Analysis:** Perform sentiment analysis on source articles to add another layer of insight. Use AI to thematically cluster events.
*   **Enhanced User Interaction & Reporting:** Allow users to add private annotations to the map and export the current view as an image or PDF.

---

### 🏗️ Future Architectural & Code Refinements
*This section includes technical tasks to consider as the project grows in complexity.*

*   **Data Scalability:** The current approach of storing all event data in a server-side variable will not scale for a large dataset. **Next Step:** Plan and implement a proper database (e.g., PostgreSQL, MongoDB) to serve event data.
*   **Secure API Calls:** AI/ML API keys should not be exposed on the client side. **Status:** ✅ Completed by creating a backend service to act as a proxy for all external API calls.
*   **Code Quality & Maintainability:**
    *   **Reduce Global Scope:** Much of the code in `app.js` runs in the global scope. **Task:** Refactor the JavaScript to use modern ES Modules or an IIFE to prevent polluting the global namespace and improve modularity.
    *   **Decouple HTML & JS:** Remove inline JavaScript handlers (`onclick="..."`) from `index.html`. **Task:** Refactor the code to attach all event listeners programmatically within `app.js`.
    *   **Component-Based Refactoring:** As the UI grows, `app.js` will become monolithic. **Task:** Proactively break down the code into smaller, feature-focused modules (e.g., `mapManager.js`, `uiPanel.js`, `apiClient.js`).
