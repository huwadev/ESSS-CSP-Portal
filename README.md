# ESSS Citizen Science Portal

The **Ethiopian Space Science Society (ESSS) Citizen Science Portal** is a web-based platform designed to democratize access to asteroid discovery and astronomical research. It connects volunteers ("Hunters") with real-world campaign data, enabling them to classify verification images and report potential asteroid candidates.

## 🚀 Features

### For Volunteers
- **Smart Dashboard**: View active campaigns and track your contribution progress.
- **Mission Control**: Use advanced tools to claim image sets, submit MPC-formatted reports, and get feedback.
- **My Profile**: Track your discoveries, rank up on the leaderboard, and customize your hunter profile with a bio and avatar.
- **Resources**: Access training materials and software guides directly within the app.

### For Campaign Managers
- **Campaign Analytics**: Get a real-time overview of campaign health with visual progress bars for assignments and verifications.
- **Team Management**: Invite new users, manage roles, and review access requests.
- **Data Export**: Batch download reports for submission to the Minor Planet Center (MPC).
- **Communication**: Post memos and verify volunteer reports with detailed feedback.

### For Everyone
- **Galaxy Zoo Module**: (Coming Soon) A classic citizen science project for galaxy classification.
- **Mobile Friendly**: Fully responsive design with a dedicated mobile navigation system.
- **Leaderboards**: Compete with other hunters for the top spot.

## 🛠️ Tech Stack

- **Frontend**: React (Vite) + TailwindCSS
- **Backend/Database**: Firebase (Firestore, Auth, Hosting)
- **Design system**: Custom "Deep Space" theme with glassmorphism effects.

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
- (And all other VITE_ variables listed above)

## 📄 Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP.md): **Start here** — step-by-step guide to create and configure your Firebase project, enable authentication, set up Firestore rules, and connect everything to the portal.
- [User Manual](./USER_MANUAL.md): Comprehensive guide for all user roles.
- [Deployment Guide](./deployment_guide.md): Detailed Firebase Hosting deployment steps.
- [Asteroid Verification Guide](./asteroid_verification.md): How to analyze image sets.
- [Email Setup](./email_setup.md): Configuring automated emails.

## ⚖️ License

<a href="https://github.com/huwadev/ESSS-CSP-Portal">ESSS CSP Portal</a> © 2026 by <a href="https://ethiosss.org/">Ethiopian Space Science Society</a> (Organizational) and <a href="https://www.linkedin.com/in/kirubelmenberu/">Kirubel Menberu Alemu</a> (Developer) is licensed under <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a><img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/nc.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;"><img src="https://mirrors.creativecommons.org/presskit/icons/sa.svg" alt="" style="max-width: 1em;max-height:1em;margin-left: .2em;">

---
*Built for the Stars, by ESSS.*
