# ESSS Citizen Science Portal — User Manual

Welcome to the Ethiopian Space Science Society (ESSS) Citizen Science Portal. This platform connects passionate volunteers with real-world scientific data, enabling them to contribute to asteroid discovery efforts through the International Astronomical Search Collaboration (IASC).

This manual provides a comprehensive guide for all user roles: **Volunteers (Hunters)**, **Moderators**, **Managers**, and **Admins**.

> **Portal Version**: 3.0.0 — Team-Scoped Workspace Architecture

---

## 🚀 Getting Started

### Accessing the Portal
1.  **Navigate** to the portal URL (e.g., `https://csp-asteroid-hunters.web.app/`).
2.  **Login**: Click **"Sign in with Google"**.
    *   **New Users**: Your account is created automatically. If the system is in restricted mode, your account will be "pending" until an administrator approves it.
    *   **Returning Users**: You will land directly on the **Global Hub** dashboard.

### Portal Architecture

The portal uses a **team-scoped workspace** model:

- **Global Hub** (`#/`): The central dashboard visible after login. Provides access to global chat, your profile, notifications, and team selection.
- **Team Workspace** (`#/team/{teamId}/...`): Each team has its own isolated workspace containing campaigns, image sets, resources, and members.
- **Modules**: Within a team workspace, you can switch between modules:
  - **Home**: Team overview and statistics.
  - **Asteroid Search**: The core IASC campaign and image set analysis tool.
  - **Galaxy Zoo**: Demonstration module for galaxy classification (coming soon).

### Navigation

- **Sidebar**: The left sidebar lists your teams. Click a team card to enter its workspace. Click the ESSS logo or "Global Hub" to return to the top level.
- **Breadcrumbs**: A contextual breadcrumb bar appears at the top of the page showing your current location (e.g., `Global Hub > Team Name > Asteroid Search > Campaign Name`). Click any breadcrumb segment to navigate back.
- **Hash-Based URLs**: The portal uses hash-based URLs (e.g., `#/team/abc123/asteroid/campaign/xyz`) for deep linking and state persistence. You can bookmark or share these URLs directly.
- **Profile Menu**: Click your avatar in the top-right corner to update your display name, bio, or sign out.
- **Notifications**: The bell icon alerts you to important updates (e.g., assignment to a set, changes requested on a report, `@mention` pings).

---

## 👩‍🚀 For Volunteers (Hunters)

As a Hunter, your primary mission is to analyze image sets provided by IASC and report potential asteroid discoveries.

### 1. Joining a Team

1. On the **Global Hub**, you will see available team cards.
2. If you are not yet a member of a team, click **"Request to Join"** on the team card.
3. A team leader or admin will approve your request.
4. Once approved, the team card becomes clickable and you can enter the workspace.

### 2. Dashboard (Mission Control)

After entering a team workspace and selecting the **Asteroid Search** module:

- **Campaigns**: A grid of active campaigns scoped to your team.
  - **Unlocked Card**: You are a participant. Click to enter the campaign.
  - **Locked Card**: You are not a participant. Click to **Request Access**.
  - **Pending**: You have requested access and are waiting for a Manager to approve.
- **System Logs**: A slide-out panel on the right shows recent system activity.

### 3. Working on a Campaign

Once inside a campaign, you will see the **Image Sets** table.

- **Filters**: Use the top tabs to filter sets by status:
  - **All**: View everything.
  - **Available**: Sets with `Unassigned` status.
  - **My Sets**: Sets currently assigned to you.
  - **Completed**: Sets that have been verified.
- **Claiming a Set**: Locate a set with status `Unassigned` and click the **Claim** button.
- **Unassigning Yourself**: If you cannot complete a set, find it in "My Sets" and click the **Unassign** icon.
- **Downloading Data**: Click the **Download** icon to get the image set files.

### 4. Submitting a Report

1.  Analyze the images using software like **Astrometrica**.
2.  Generate your MPC (Minor Planet Center) report text.
3.  In the portal, click on your claimed image set row to open the **Report Interface**.
4.  **Paste** your MPC report text into the large text area.
5.  **Validation**: The system automatically checks your format.
    - ✅ *Green Check*: Format looks good.
    - ❌ *Red X*: There are formatting errors (e.g., missing header, alignment issues). Usage hints are provided.
6.  Click **Submit Report**. The status changes to `Pending Review`.

### 5. Review & Feedback

- **Status Indicators**:
  - `Verified`: Your report is confirmed and approved for IASC submission.
  - `Changes Requested`: A reviewer has found issues.
- **Handling "Changes Requested"**:
  1. Open the image set detail view.
  2. Check the **Discussion** panel on the right.
  3. Read the comments from the reviewer.
  4. Edit your report and click **Update Report**.
- **Discussion**: Ask questions or clarify details in the Discussion chat. Use `@Name` to tag specific users.

### 6. Campaign Chat

- Click the **Team Chat** button (💬) in the campaign dashboard header.
- **Access Restricted**: Only campaign members, moderators, and managers can see the chat.
- **@all Mention**: Type `@all` to send a priority notification to all campaign members.
- **@user Mentions**: Type `@` to autocomplete-select specific members.
- **Rich Formatting**: Use the toolbar for **bold**, *italic*, and `code` formatting.
- **Message Management**: Click the three dots (`...`) to edit or delete your messages.

### 7. Leaderboard & Resources

- **Leaderboard**: Check the top hunters based on verified reports and discovery counts.
- **Resources**: Access Astrometrica guides, configuration files, and tutorials via the "Resources" tab.

---

## 👨‍💼 For Managers

Managers (Mission Leaders) have full control over their team workspace, including campaign management, member approval, and report verification.

### 1. Campaign Management

- **Create Campaign**: Click **"New Campaign"** on the dashboard. Enter name, naming prefix (e.g., "ETH"), deadline, and IASC drive link.
- **Edit Campaign**: Click the **Edit** (pencil) icon to update details or pinned memos.
- **Campaign Status**:
  - **Active**: Open for participation.
  - **Completed**: Read-only history.
  - **Archived**: Hidden from main view.

### 2. Manage Team (Team Members Tab)

> ⚠️ **Access Restriction**: The "Manage Team" tab is only visible to users with **Manager** or **Admin** roles. Volunteers and Moderators cannot access this tab.

- **Approve/Deny** access requests from volunteers.
- **Remove** members if necessary.
- **Bulk Campaign Assignment**:
  - Select one or more volunteers using checkboxes.
  - A glowing **Bulk Actions Panel** slides in, allowing batch-assignment to any active campaign.
  - **Filter-Aware Multi-Add**: Filter the list by a previous campaign, select all, then assign them to a new campaign.
- **Interactive Member Info Modals**:
  - Click any volunteer's row to open a detailed profile overlay.
  - Shows email, role, date joined, and a 3-column stats panel (Verified Sets, Total Claimed, Objects Detected).
  - Includes **Campaign Participation History** with details on who added them and when.

### 3. Image Set Management

- **Add Sets**: Use individual add or **Bulk Import** (paste a list of names from a spreadsheet).
- **Assign Users**: Manually assign a set to a user via the dropdown in the Assignee column.
- **Force Unassign**: Unassign any user from a set (e.g., if inactive).

### 4. Reviewing Reports

1. Navigate to the **Review** tab (or filter by `Pending Review`).
2. Click a set to open the detail view and read the MPC report.
3. **Actions**:
   - **Verify**: Marks the set as `Verified`, locks the report, and updates the user's score.
   - **Request Changes**: Sends a notification with your feedback. Status resets to `Changes Requested`.

### 5. Batch Operations

- **Batch Download**: Select multiple sets and click **"Download Reports"** to get all MPC text files.
- **Batch Delete**: Select sets and delete them (Manager/Admin only).

---

## 🔍 For Moderators

Moderators assist managers with data quality and campaign oversight. Moderators can:

- Review and verify submitted reports.
- Participate in and moderate campaign-scoped chat.
- View all campaign data and member lists.

> ⚠️ Moderators **cannot** access the "Manage Team" tab, create/delete campaigns, or change user roles.

---

## 🛡️ For Admins

Admins have full system control across all teams and the Global Hub.

### 1. Admin Panel

Access the **Admin Panel** via the gear icon (⚙️) in the sidebar or the top navigation.

- **Teams Tab**: Create, edit, activate/deactivate teams. Assign team leaders.
- **Users Tab**: View all users across all teams. Change roles, approve pending accounts, or deactivate users.

### 2. Team Provisioning

1. In the Admin Panel, go to the **Teams** tab.
2. Click **"Create Team"** and fill in:
   - **Team Name**
   - **Description**
   - **Team Leader** (select from existing users)
3. The team appears in the Global Hub and members can request to join.

### 3. Role Hierarchy

| Role | Permissions |
|------|------------|
| **Volunteer** | Claim sets, submit reports, participate in chat, view resources. |
| **Moderator** | All Volunteer permissions + review/verify reports. |
| **Manager** | All Moderator permissions + create campaigns, manage team members, bulk operations, access Manage Team tab. |
| **Admin** | All Manager permissions + Admin Panel, team provisioning, cross-team user management, global moderation. |

### 4. Global Chat Moderation

- Admins can moderate the **Global Chat** accessible from the floating action button.
- Delete inappropriate messages using the context menu (three dots → Delete).

---

## 💬 Communication Features

### Global Chat
- A real-time chat room accessible to all logged-in users.
- Located via the floating action button (💬) in the bottom-right corner.
- Supports **@User mentions** which trigger notifications.
- Users can edit or delete their own messages.

### Campaign-Scoped Chat
- A private, real-time chat within each campaign.
- Only accessible to campaign members, moderators, and managers.
- Supports `@all` broadcast and `@user` targeted mentions.
- Rich Markdown formatting toolbar (bold, italic, code).

### Notifications
The **Notification Bell** in the top bar shows:
- "Changes Requested" alerts.
- "Assigned to Set" alerts.
- "Role Updated" alerts.
- `@mention` pings from chat.
- System announcements.

### Automatic Emails
The system integrates with a Google Apps Script backend to send email notifications for:
- Welcome / Account Approval.
- Role Changes.
- "Action Required" on reports.

---

## 🔗 URL Structure & Deep Linking

The portal uses hash-based routing for bookmarkable, shareable URLs:

| URL Pattern | Page |
|-------------|------|
| `#/` | Global Hub |
| `#/global/admin` | Admin Panel |
| `#/team/{teamId}/home` | Team Home |
| `#/team/{teamId}/asteroid` | Asteroid Search Dashboard |
| `#/team/{teamId}/asteroid/view/my-missions` | My Missions |
| `#/team/{teamId}/asteroid/view/review` | Review Queue |
| `#/team/{teamId}/asteroid/view/resources` | Resources |
| `#/team/{teamId}/asteroid/campaign/{campaignId}` | Campaign Detail |
| `#/team/{teamId}/asteroid/campaign/{campaignId}/team` | Campaign Team Members |
| `#/team/{teamId}/zooniverse` | Galaxy Zoo Module |

---

## 🆘 Support & Troubleshooting

| Issue | Solution |
|-------|----------|
| **Login Issues** | Ensure you are using the correct Google account. If stuck in "Pending", contact an admin. |
| **Loading Screen Hangs** | Check your internet connection or clear browser cache. The portal shows a telescope animation while loading. |
| **Page Not Loading After Navigation** | Try refreshing the page. If the issue persists, clear the URL hash and navigate from the Global Hub. |
| **Missing Campaigns or Image Sets** | Ensure you are inside the correct team workspace. Data is scoped per-team. |
| **Cannot See "Manage Team" Tab** | This tab is restricted to Manager and Admin roles only. |

---
*Last Updated: v3.0.0*
