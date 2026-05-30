# ESSS Citizen Science Portal

The **Ethiopian Space Science Society (ESSS) Citizen Science Portal** is a web-based platform designed to democratize access to asteroid discovery and astronomical research. It connects volunteers ("Hunters") with real-world campaign data from the International Astronomical Search Collaboration (IASC), enabling them to classify verification images and report potential asteroid candidates — all within a modern, team-scoped workspace.

## 🚀 Features

### Team-Scoped Workspaces (v3.0)
- **Multi-Team Architecture**: The portal supports multiple independent research teams, each with their own campaigns, image sets, resources, and members.
- **Global Hub**: A central dashboard for cross-team communication, profile management, and team selection.
- **Team Cards**: Visual team cards on the Global Hub show member count, campaign count, team photos, and quick-access links.
- **Join Requests**: Users can request to join teams and be approved by team leaders or admins.

### For Volunteers (Hunters)
- **Smart Dashboard**: View active campaigns scoped to your team and track your contribution progress.
- **Mission Control**: Use advanced tools to claim image sets, submit MPC-formatted reports, and get feedback.
- **My Profile**: Track your discoveries, rank up on the leaderboard, and customize your hunter profile with a bio and avatar.
- **Resources**: Access training materials, Astrometrica configuration files, and software guides directly within the app.
- **Leaderboard**: Compete with other hunters for the top spot based on verified discoveries.

### For Campaign Managers
- **Campaign Analytics**: Real-time overview of campaign health with visual progress bars for assignments and verifications.
- **Team Management**: Invite new users, manage roles, and review access requests within your team workspace.
- **Data Export**: Batch download verified MPC reports for submission to the Minor Planet Center.
- **Communication**: Post memos, verify volunteer reports with detailed feedback, and use campaign-scoped team chat.
- **Bulk Operations**: Select multiple volunteers and batch-assign them to campaigns. Select multiple image sets for batch download or deletion.

### For Admins
- **Admin Panel**: A dedicated admin interface for provisioning new teams, managing all users across teams, and system-wide configuration.
- **Role Management**: Assign roles (Volunteer → Moderator → Manager → Admin) with granular permission enforcement.
- **Team Provisioning**: Create, edit, activate/deactivate teams from the Admin Panel.

### Communication
- **Campaign-Scoped Chat**: Real-time chat within each campaign, restricted to campaign members. Supports `@all` broadcast mentions, `@user` targeting, rich Markdown formatting, and message edit/delete.
- **Global Chat**: A portal-wide chat accessible to all authenticated users via a floating action button.
- **Notifications**: Bell icon alerts for assignment changes, report reviews, role updates, and `@mention` pings.
- **Automatic Emails**: Google Apps Script integration for welcome, role change, and action-required notifications.

### Navigation & UX
- **Hash-Based Routing**: Deep-linkable URLs (`#/team/{id}/asteroid/campaign/{id}`) for state persistence and shareable links.
- **Breadcrumb Navigation**: A contextual breadcrumb bar for clear hierarchy awareness and one-click navigation.
- **Mobile Friendly**: Fully responsive design with a dedicated mobile navigation system.
- **Deep Space Theme**: Custom dark-mode design system with glassmorphism effects, smooth gradients, and micro-animations.

### Modules
- **Asteroid Search**: The core IASC campaign management and image set analysis tool.
- **Galaxy Zoo**: A demonstration module for galaxy morphology classification (Coming Soon).

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite) + TailwindCSS 3 + Framer Motion
- **Backend/Database**: Firebase (Firestore, Auth, Hosting)
- **Icons**: Lucide React
- **Design System**: Custom "Deep Space" theme with glassmorphism effects

## 💻 Local Development

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/huwadev/ESSS-CSP-Portal.git
    cd ESSS-CSP-Portal
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory with your Firebase config:
    ```env
    VITE_FIREBASE_API_KEY=your_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run Locally**:
    ```bash
    npm run dev
    ```
    The dev server will start at `http://localhost:5173`.

## 📦 Deployment

This project is configured for **Firebase Hosting**.

### Manual Deployment
```bash
npm run build
firebase deploy
```

### CI/CD (GitHub Actions)
Automated deployment is set up for pushes to the `main` branch. Ensure the following secrets are set in your GitHub repository:
- `FIREBASE_SERVICE_ACCOUNT_CSP_ASTEROID_HUNTERS`
- `VITE_FIREBASE_API_KEY`
- (And all other `VITE_` variables listed above)

## 📂 Project Structure

```
├── src/
│   ├── App.jsx          # Main application (all components)
│   └── index.css        # Global styles and design tokens
├── public/              # Static assets
├── index.html           # Entry point
├── firebase.json        # Firebase Hosting configuration
├── firestore.rules      # Firestore security rules
├── firestore.indexes.json
├── .env                 # Environment variables (not committed)
└── google-script/       # Google Apps Script for email automation
```

## 📄 Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md): Step-by-step guide to create and configure your Firebase project.
- [User Manual](./USER_MANUAL.md): Comprehensive guide for all user roles.
- [Deployment Guide](./deployment_guide.md): Detailed Firebase Hosting deployment steps.
- [Asteroid Verification Checklist](./asteroid_verification.md): QA checklist for the Asteroid Search module.
- [Email Setup](./email_setup.md): Configuring automated email notifications.

## 🔖 Version History

| Version | Highlights |
|---------|------------|
| **v3.0.0** | Team-scoped workspace architecture, hash-based routing, breadcrumb navigation, admin panel with team provisioning, role-guarded Manage Team access. |
| v2.4.0 | Campaign-scoped chat, bulk member assignment, interactive member info modals, rich Markdown formatting in chat. |
| v2.0.0 | MPC report validation, review & verify workflow, resource hub, discovery leaderboard. |
| v1.0.0 | Initial release — campaign management, image set claiming, report submission. |

## ⚖️ License

<a href="https://github.com/huwadev/ESSS-CSP-Portal">ESSS CSP Portal</a> © 2026 by <a href="https://ethiosss.org/">Ethiopian Space Science Society</a> (Organizational) and <a href="https://www.linkedin.com/in/kirubelmenberu/">Kirubel Menberu Alemu</a> (Developer) is licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">

---
*Built for the Stars, by ESSS.*
