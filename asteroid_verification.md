# Verification Checklist: ESSS Citizen Science Portal v3.0.0

This checklist covers the complete QA flow for the team-scoped portal, including team management, the Asteroid Search module, and navigation.

## 1. Authentication & Setup
- [ ] **Admin Access**: Login with the primary account (auto-promoted to Admin).
- [ ] **Volunteer Access**: Open an Incognito window and login with a second Google account (should be Volunteer).
- [ ] Verify the **Global Hub** dashboard loads after login.

## 2. Team Management (Admin)
- [ ] **Open Admin Panel**: Click the ⚙️ icon to open the Admin Panel.
- [ ] **Create Team**: Enter a team name, description, and select a team leader. Click Create.
- [ ] Verify the team card appears on the Global Hub.
- [ ] **Edit Team**: Update team name or description from the Admin Panel.
- [ ] **Deactivate/Activate Team**: Toggle team status.

## 3. Team Membership
- [ ] **Join Request (Volunteer)**: As Volunteer, click "Request to Join" on the team card.
- [ ] **Approve Request (Admin/Manager)**: Approve the request from the Admin Panel or team management view.
- [ ] **Enter Workspace**: As Volunteer, click the team card to enter the workspace.

## 4. Navigation & Routing
- [ ] **Breadcrumbs**: Verify breadcrumb trail updates at each navigation level (Global Hub → Team → Module → Campaign).
- [ ] **Hash URLs**: Verify the URL hash updates when navigating (e.g., `#/team/{id}/asteroid`).
- [ ] **Deep Linking**: Copy a campaign URL hash, open in a new tab, and verify it loads the correct state.
- [ ] **Back Navigation**: Click breadcrumb segments to navigate backwards.

## 5. Campaign Management (Manager/Admin)
- [ ] **Create Campaign**: Click "New Campaign". Enter name, prefix, deadline, and link. Click Create.
- [ ] Verify the campaign appears in the list.
- [ ] **Add Image Sets**:
    - Click "Add Sets".
    - Enter a Download Link.
    - Paste set names (e.g., `SET001`, `SET002`).
    - Verify they appear as "Unassigned".
- [ ] **Edit Campaign**: Click the pencil icon to update campaign details.

## 6. Volunteer Workflow
- [ ] **Request Campaign Access**: As Volunteer, click "Request Access" on a locked campaign.
- [ ] **Approve Access (Admin/Manager)**: Approve the request.
- [ ] **Claim Set**: As Volunteer, find an unassigned set and click "Claim".
- [ ] **Download Data**: Click the download icon to get image set files.

## 7. Reporting
- [ ] **Submit Report**: Click the report icon, paste MPC text, verify validation, and submit.
- [ ] Verify status changes to `Pending Review`.
- [ ] **Review Report (Manager)**: Go to Review tab, open the report, and click "Verify".
- [ ] Verify status changes to `Verified`.
- [ ] **Request Changes**: Submit another report, then click "Request Changes" with feedback.
- [ ] Verify status changes to `Changes Requested` and notification is sent.

## 8. Communication
- [ ] **Campaign Chat**: Open campaign chat, send a message, verify it appears in real-time.
- [ ] **@all Mention**: Type `@all` and verify notification is sent to campaign members.
- [ ] **Global Chat**: Open the floating chat button, send a message.
- [ ] **Discussion Comments**: Add a comment on a report, verify chat history updates.

## 9. Role Enforcement
- [ ] **Volunteer**: Verify cannot see "Manage Team" tab.
- [ ] **Moderator**: Verify cannot see "Manage Team" tab but can review reports.
- [ ] **Manager**: Verify can see and use "Manage Team" tab.
- [ ] **Admin**: Verify can access Admin Panel and all features.

## 10. Leaderboard & Resources
- [ ] Verify leaderboard updates after a report is verified.
- [ ] Verify Resources tab loads training materials.

## 11. Mobile Responsiveness
- [ ] Test on mobile viewport (375px width).
- [ ] Verify mobile navigation menu works.
- [ ] Verify campaign cards and tables are scrollable.
