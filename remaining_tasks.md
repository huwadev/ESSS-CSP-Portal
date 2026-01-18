# Remaining Tasks: Leaderboard & User Discovery Stats

The foundation for the upgrades has been set. The final step is to hook up the Dashboard Leaderboard and User Profile statistics to real-time data.

- [x] **Data Aggregation:**
    - [x] Create a Firestore function or client-side logic to count `objectsFound` per user across all `image_sets` where `status === 'Verified'`.
    - [x] Update `users` collection with `discoveryCount` to avoid expensive queries on every Dashboard load.

- [x] **Dashboard Leaderboard:**
    - [x] In `App.jsx`, replace "Leaderboard: Loading..." text with a top-3 list.
    - [x] Fetch top 3 users sorted by `discoveryCount`.

- [x] **User Profile Stats:**
    - [x] In the sidebar profile area (or a new "My Profile" modal), display:
        -   Total Image Sets Analyzed (Verified + Completed).
        -   Total Preliminary Discoveries (Count of objects in verified sets).
    - [x] List all discovered object names (e.g., "Verified Discoveries: ETH001, ETH005").

- [x] **Testing:**
    - [x] Submit a valid report -> Verify "Pending Review".
    - [x] Approve report as Admin -> Verify status "Verified".
    - [x] Check if Leaderboard updates.
