# ESSS Citizen Science Portal - User Manual

Welcome to the Ethiopian Space Science Society (ESSS) Citizen Science Portal. This platform connects passionate volunteers with real-world scientific data, enabling them to contribute to asteroid discovery and galaxy classification.

This manual provides a comprehensive guide for all user roles: **Volunteers (Hunters)**, **Managers**, **Moderators**, and **Admins**.

---

## 🚀 Getting Started

### Accessing the Portal
1.  Navigate to the portal URL (e.g., `https://csp-asteroid-hunters.web.app/`).
2.  Click **"Sign in with Google"**.
3.  **New Users**: Detailed stats and avatar are pulled from Google. You can edit your profile by clicking your avatar in the sidebar.
4.  **Approved Users**: You will land on the **Home** dashboard.

### Navigation
The sidebar allows you to switch between modules:
*   **Home**: Portal overview and module selection.
*   **Asteroid Search**: The primary tool for managing campaigns and image sets.
*   **Galaxy Zoo**: A placeholder for future galaxy classification projects.

---

## 👩‍🚀 For Volunteers (Hunters)

As a Hunter, your primary mission is to analyze image sets and report discoveries.

### 1. Dashboard (Mission Control)
*   **Campaigns**: You will see a grid of Active campaigns.
    *   **Unlocked Card**: You are a participant. Click to enter the campaign.
    *   **Locked Card**: You are not a participant. Click to **Request Access**.
    *   Once a request is sent, wait for a Manager to approve you.
*   **Mission Log**: Click the "Mission Log" button to slide out a live feed of recent portal activity.

### 2. Working on a Campaign
Once inside a campaign:
*   **Smart Search**: Use the search bar to find specific image sets or filter by status (e.g., "Unassigned").
*   **Claiming a Set**: Look for sets with status `Unassigned` and click the blue **Claim** button. The set is now yours!
*   **Unassigning**: If you claimed a set by mistake or cannot complete it, click the red **Log Out** button (door icon) in the actions column to release it back to the pool.
*   **Submitting a Report**:
    1.  Click anywhere on the row of your claimed set.
    2.  A "Submit MPC Report" modal will appear.
    3.  Paste your specific MPC formatted report text.
    4.  Click **Submit Report**.
    5.  The status will change to `Pending Review`.

### 3. Feedback
*   Check your set status regularly.
    *   `Verified`: Great job! Your discovery is confirmed.
    *   `Changes Requested`: A manager left feedback. Click the row to view comments and update your report.

### 4. Resources
*   Click the **"Resources"** button on the dashboard to access guides, software links (like Astrometrica), and tutorials provided by the organization.

---

## 🕵️ For Moderators

Moderators help maintain the community and secure access.

### 1. Reviewing Access Requests
*   When new users sign up, they are pending approval.
*   In the **Team / Access** section (accessible via specific admin panels or notifications), review pending users.
*   **Approve**: Grants generic Volunteer access.
*   **Deny**: Blocks the user from the portal.

### 2. Campaign Requests
*   In a Campaign Detail view, click the **"Review Requests"** button (red button near title) to see volunteers asking to join that specific mission.
*   Approve them to add them to the participant list.

---

## 👨‍💼 For Managers

Managers lead specific campaigns, oversee data quality, and coordinate teams.

### 1. Creating & Managing Campaigns
*   **Create**: Click **"New Campaign"** on the dashboard. Enter a name (e.g., "IASC October Campaign") and launch it.
*   **End/Reactivate**: In the Campaign Detail view, use the status buttons to **End** a completed campaign or **Reactivate** a closed one.

### 2. Campaign Analytics (New)
*   **Overview**: At the top of the Campaign Dashboard, Managers see real-time progress bars:
    *   **Total Sets**: Volume of data in the campaign.
    *   **Assigned**: Percentage of sets currently with hunters.
    *   **Verified**: Percentage of discoveries confirmed.
*   **Deadlines**: A dynamic countdown shows days remaining until the campaign closes.

### 2. Managing Image Sets
*   **Add Sets**: Inside a campaign, click **"Add Image Sets"**. You can manually add sets with names and download links.
*   **Assigning**:
    *   **Dropdown**: Use the dropdown in the Actions column to assign a set to a specific user.
    *   **Unassign**: Click the **Log Out** button (door icon) next to any assigned user to force-remove them from the set.
    *   *Note*: You can only assign users who are participants of the campaign.
*   **Download Selected**:
    1.  Use the checkboxes on the left to select multiple image sets.
    2.  Click the **"Download (N)"** button in the search bar.
    3.  This downloads individual `.txt` files of the MPC reports for all selected sets, named by image set.

### 3. Reviewing Reports
*   Click on a row with status `Pending Review`.
*   Review the volunteer's submitted text.
*   **Verify**: Marks the set as complete and accurate.
*   **Request Changes**: Adds a comment and sends it back to the volunteer.

---

## 🛡️ For Admins

Admins have full system control.

### 1. User Management
*   You can change user roles (Promote to Manager, Moderator, etc.).
*   You have the ability to delete invitations and manage the foundational user list.

### 2. System Cleanup
*   **Archive Campaign**: Moves a campaign to the Archive tab (read-only).
*   **Delete Campaign**: **Permanent Action**. Removes the campaign and *all* associated data/reports. Use with caution.
*   **Renaming**: You can edit user names directly in the profile or team views if necessary.

---

## 🆘 Support & Troubleshooting

*   **Login Issues**: Ensure you are using the Google account whitelisted by the organization.
*   **Empty Dashboard**: If you see no campaigns, you may need to request access or wait for a Manager to create a new cycle.
*   **Bugs**: Report technical issues to the IT Support team.

---

