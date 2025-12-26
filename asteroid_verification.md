# Verification Checklist: Asteroid Search Module

Please follow these steps to ensure the Asteroid Search module is fully functional.

## 1. Setup & Roles
- [ ] **Admin Access:** Login with the first account (should be auto-promoted to Admin).
- [ ] **Volunteer Access:** Open an Incognito window and login with a second Google account (should be Volunteer).

## 2. Campaign Management (Admin)
- [ ] **Create Campaign:**
    - Click "New" (top right of Dashboard).
    - Enter a name (e.g., "IASC Jan 2025") and click Create.
    - Verify it appears in the list.
- [ ] **Add Image Sets:**
    - Enter the campaign.
    - Click "Add Sets".
    - Enter a Download Link (e.g., `https://example.com/data.zip`).
    - Paste names (e.g., `SET001`, `SET002`).
    - Click Add.
    - Verify they appear in the table as "Unassigned".

## 3. Volunteer Workflow (Volunteer)
- [ ] **Request Access:**
    - As the Volunteer, see the new campaign.
    - Click "Request Access".
    - Verify button changes to "Request Pending".
- [ ] **Approve Access (Admin):**
    - As Admin, see the red badge on the campaign card.
    - Enter campaign -> Click "Requests".
    - Click the Green Thumbs Up.
- [ ] **Claim Set:**
    - As Volunteer, refresh or re-enter.
    - Verify "Enter Mission" button appears.
    - Inside, find an unassigned set and click "Claim".
    - Verify status changes to "Assigned" and "My Missions" count increases.

## 4. Reporting
- [ ] **Submit Report:**
    - As Volunteer, click report icon (message bubble) or go to "My Missions" -> "Report".
    - Enter "Objects Found" (e.g., `FOV001`).
    - Enter Report Text (MPC format).
    - Click Submit.
    - Verify status changes to "Completed" (Green).
    - Verify Admin sees the status change.

## 5. Comments
- [ ] **Test Comments:**
    - Open a report.
    - Add a comment as Volunteer.
    - Add a reply as Admin.
    - Verify chat history updates in real-time.
