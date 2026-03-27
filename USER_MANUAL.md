# ESSS Citizen Science Portal - User Manual

Welcome to the Ethiopian Space Science Society (ESSS) Citizen Science Portal. This platform primarily connects passionate volunteers with real-world scientific data, enabling them to contribute to asteroid discovery efforts. It also features a demonstration module for galaxy classification.

This manual provides a comprehensive guide for all user roles: **Volunteers (Hunters)**, **Managers**, **Moderators**, and **Admins**.

---

## 🚀 Getting Started

### Accessing the Portal
1.  **Navigate** to the portal URL (e.g., `https://[YOUR-PROJECT-ID].web.app/`).
2.  **Login**: Click **"Sign in with Google"**.
    *   **New Users**: Your account will be created automatically. If the system is in a restricted mode, your account may be "pending" until an administrator approves it.
    *   **Returning Users**: You will land directly on the **Home** dashboard.

### Navigation and Interface
The portal features a modern, dark-themed interface designed for focus and clarity.
*   **Module Selector**: The top bar allows you to switch between main modules:
    *   **Home**: Portal overview.
    *   **Asteroid Search**: The core tool for managing IASC campaigns and image sets.
    *   **Galaxy Zoo**: A demonstration/placeholder for galaxy classification.
*   **Profile**: Click your avatar in the top-right corner to:
    *   Update your **Display Name** and **Bio**.
    *   **Sign Out**.
*   **Notifications**: A bell icon alerts you to important updates (e.g., assignment to a set, changes requested on your report).

---

## 👩‍🚀 For Volunteers (Hunters)

As a Hunter, your primary mission is to analyze image sets provided by the International Astronomical Search Collaboration (IASC) and report potential asteroid discoveries.

### 1. Dashboard (Mission Control)
*   **Campaigns**: You will see a grid of Active campaigns.
    *   **Unlocked Card**: You are a participant. Click to enter the campaign.
    *   **Locked Card**: You are not a participant. Click to **Request Access**.
    *   **Pending**: You have requested access and are waiting for a Manager to approve you.
*   **System Logs**: A slide-out panel on the right shows recent system activity (e.g., "User X submitted a report").

### 2. Working on a Campaign (Asteroid Search)
Once inside a campaign, you will see the **Image Sets** table.
*   **Filters**: Use the top tabs to filter sets by status:
    *   **All**: View everything.
    *   **Available**: Sets with `Unassigned` status.
    *   **My Sets**: Sets currently assigned to you.
    *   **Completed**: Sets that have been verified.
*   **Claiming a Set**:
    *   Locate a set with status `Unassigned`.
    *   Click the **Claim** button. The set is now assigned to you.
*   **Unassigning Yourself**:
    *   If you cannot complete a set, you can release it back to the pool.
    *   Find the set in the list (or under "My Sets").
    *   Click the **Unassign** icon (user with a minus sign / door exit icon) in the actions column.
*   **Downloading Data**:
    *   Click the **Download** icon (cloud arrow) to get the image set files (usually a zip or link provided by the manager).

### 3. Submitting a Report
1.  Analyze the images using software like **Astrometrica**.
2.  Generate your MPC (Minor Planet Center) report text.
3.  In the portal, click on your claimed image set row to open the **Report Interface**.
4.  **Paste** your MPC report text into the large text area.
5.  **Validation**: The system will automatically check your format.
    *   *Green Check*: Format looks good.
    *   *Red X*: There are formatting errors (e.g., missing header, alignment issues). usage hints are provided.
6.  Click **Submit Report**.
    *   The status changes to `Pending Review`.

### 4. Review & Feedback
*   **Status Indicators**:
    *   `Verified`: Great job! Your discovery is confirmed.
    *   `Changes Requested`: A manager or moderator has reviewed your report and found issues.
*   **Handling "Changes Requested"**:
    1.  Open the image set detail view.
    2.  Check the **Discussion** panel on the right.
    3.  Read the comments from the Reviewer.
    4.  Edit your report in the text area and click **Update Report**.
*   **Discussion**: You can ask questions or clarify details in the Discussion chat.
    *   **Mentions**: Use `@Name` to tag a specific user/manager.
    *   **Edit/Delete**: You can edit or delete your own comments using the **three-dot menu** next to your message.

### 5. Leaderboard & Resources
*   **Leaderboard**: Check the top hunters based on verified reports.
*   **Resources**: Access guides, software links, and tutorials via the "Resources" tab in the main navigation.

---

## 👨‍💼 For Managers & Moderators

Managers (Mission Leaders) and Moderators help maintain data quality and coordinate teams.

### 1. Campaign Management
*   **Create Campaign**: Click **"New Campaign"** on the dashboard.
    *   Enter **Name**, **Naming Prefix** (e.g., "ETH"), **Deadline**, and **Link** (URL to IASC drive).
*   **Edit Campaign**: Click the **Edit** (pencil) icon next to the campaign title to update details or pinned memos.
*   **Status**:
    *   **Active**: Open for participation.
    *   **Completed**: Read-only history.
    *   **Archived**: Hidden from main view.
*   **Manage Team**:
    *   View the **"Mission Team"** tab within a campaign.
    *   **Approve/Deny** access requests from volunteers.
    *   **Remove** members if necessary.

### 2. Image Set Management
*   **Add Sets**:
    *   **Individual**: Click **"Add Image Set"** to add one set manually.
    *   **Bulk Import**: Use the "Bulk Import" feature to paste a list of set names (e.g., from a spreadsheet).
*   **Assigning Users**:
    *   Managers can manually assign a set to a specific user using the dropdown in the 'Assignee' column.
*   **Force Unassign**:
    *   Managers can unassign *any* user from a set (e.g., if a volunteer is inactive). Click the colored **Unassign** icon next to their name.

### 3. Reviewing Reports (The Review Queue)
1.  Navigate to the **"Review"** tab (or filter by `Pending Review`).
2.  Click on a set to open the detail view.
3.  **Validate**: Read the MPC report text.
4.  **Actions**:
    *   **Verify**: Marks the set as `Verified`. This locks the report and updates the user's score.
    *   **Request Changes**: Opens a notification input. Enter the reason for rejection (e.g., "False positive on line 2"). This resets the status to `Changes Requested` and notifies the user.

### 4. Batch Operations
*   **Batch Download**: Select multiple sets using checkboxes and click **"Download Reports"** to get all MPC text files at once (useful for final submission to IASC).
*   **Batch Delete**: Select sets and delete them (Admin/Manager only).

---

## 🛡️ For Admins

Admins have full system control.

### 1. User Management
*   Navigate to the **"Manage Team"** or **"Users"** view.
*   **Roles**: Change a user's role (Volunteer -> Moderator -> Manager -> Admin).
*   **Status**: Approve pending accounts or Deactivate users.
*   **Invitations**: Whitelist emails for automatic approval.

### 2. Global Chat
*   Admins can moderate the **Global Chat**.
*   Delete inappropriate messages using the context menu (three dots -> Delete).

### 3. System Maintenance
*   **Delete Campaign**: Permanently removes a campaign and all its data. **Irreversible**.

---

## 💬 Communication Features

### Global Chat
*   A real-time chat room accessible to all logged-in users.
*   Located in the bottom-right via a floating action button (FAB).
*   Supports **Mentions** (@User) which trigger notifications.
*   **Edit/Delete**: Users can manage their own messages.

### Notifications
*   The **Notification Bell** in the top bar shows:
    *   "Changes Requested" alerts.
    *   "Assigned to Set" alerts.
    *   "Role Updated" alerts.
    *   System announcements.

### Automatic Emails
*   The system integrates with a Google Script backend to send email notifications for:
    *   Welcome / Account Approval.
    *   Role Changes.
    *   "Action Required" on reports.

---

## 🆘 Support & Troubleshooting

*   **Login Issues**: Ensure you are using the correct Google account. If your account is stuck in "Pending", contact an admin.
*   **"MoreVertical is not defined"**: If you see technical errors, refresh the page. This specific issue was resolved in v2.4.0.
*   **Loading Screen**: The portal shows a telescope animation while loading. If it hangs indefinitely, check your internet connection or clear browser cache.

---
*Last Updated: v2.4.0*
