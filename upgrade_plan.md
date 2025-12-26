# Asteroid Search Module Upgrade

This plan outlines the steps to upgrade the Asteroid Search Module with MPC validation, a robust review workflow, a resource hub, and a discovery dashboard.

## 1. Smart MPC Report Validator
-   **Goal:** Ensure reports follow IASC standards before submission.
-   **Changes:**
    -   Modify `submitReport` logic in `AsteroidTool` component in `src/App.jsx`.
    -   Implement `validateMPCReport(text, netName)` function.
        -   Check for headers: `COD`, `CON`, `OBS`, `MEA`, `TEL`.
        -   Check if `NET` matches set name.
        -   (Bonus) Regex validation for object lines.
    -   Update UI to show validation status (Green/Red badge).

## 2. "Review & Verify" Workflow
-   **Goal:** Add a review step for admin/moderators.
-   **Changes:**
    -   Update `submitReport` to set status to `Pending Review` instead of `Completed`.
    -   Add "Review Queue" tab for Admins/Moderators in `AsteroidTool`.
        -   List items with `status === 'Pending Review'`.
        -   Actions: "Approve" (set to `Verified`) or "Request Changes" (set to `Assigned` + comment).
    -   Update `myMissions` logic to include `Pending Review` and `Verified` statuses.
    -   Add `Verified` status badge style.

## 3. Astrometrica Resource Hub
-   **Goal:** Provide configuration files and guides.
-   **Changes:**
    -   Add "Resources" tab to `AsteroidTool`.
    -   Add content:
        -   Download links for Astrometrica, PanSTARRS.cfg, Catalina.cfg.
        -   "How-To Blink" guide (text/markdown).

## 4. Discovery Dashboard & Leaderboard
-   **Goal:** Gamify and track discoveries.
-   **Changes:**
    -   Update `submitReport` (or "Approve" action) to increment `preliminary_discoveries` count in user profile.
    -   Update `Home Dashboard` (in `App.jsx`):
        -   Fetch "Top Hunters" (users sorted by discovery count).
        -   Display leaderboard.
    -   Update User Profile (Sidebar/Modal):
        -   Show "My Discoveries" list (based on `objectsFound` from `image_sets` collection).

## Implementation Steps
1.  **Refactor `submitReport`**: Add validation and status change.
2.  **Add Review Queue**: Implement UI and actions.
3.  **Add Resources Tab**: Create static content.
4.  **Update Dashboard**: Add leaderboard and profile stats.
