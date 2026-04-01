# 🔥 Firebase Setup Guide — ESSS CSP Portal

This guide walks you through creating and configuring a **Firebase project from scratch** so you can run your own instance of the ESSS Citizen Science Portal. No prior Firebase experience is required.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create a Firebase Project](#2-create-a-firebase-project)
3. [Register a Web App & Get Config Keys](#3-register-a-web-app--get-config-keys)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Enable Google Authentication](#5-enable-google-authentication)
6. [Set Up Firestore Database](#6-set-up-firestore-database)
7. [Apply Firestore Security Rules](#7-apply-firestore-security-rules)
8. [Set Up Firebase Hosting](#8-set-up-firebase-hosting)
9. [Connect & Run the Project](#9-connect--run-the-project)
10. [First-Time Admin Bootstrap](#10-first-time-admin-bootstrap)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Prerequisites

Before you begin, make sure you have the following installed:

| Tool | Purpose | Install Command |
|---|---|---|
| **Node.js** (v18+) | JavaScript runtime | [nodejs.org](https://nodejs.org) |
| **npm** | Package manager | Bundled with Node.js |
| **Firebase CLI** | Deploy & manage Firebase | `npm install -g firebase-tools` |
| **Git** | Clone the repository | [git-scm.com](https://git-scm.com) |

You also need a **Google account** to use the Firebase Console.

---

## 2. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add project"**.
3. Enter a project name (e.g. `my-csp-portal`). This determines your default hosting URL.
4. **Google Analytics**: You can disable this — the portal does not use it.
5. Click **"Create project"** and wait for it to provision.

> [!NOTE]
> Your Firebase project name becomes your default hosting URL in the format `your-project-id.web.app`. Choose something meaningful to your organization.

---

## 3. Register a Web App & Get Config Keys

After the project is created:

1. On the **Project Overview** page, click the **`</>`** (Web) icon to add a web app.
2. Enter an app nickname (e.g. `CSP Portal`).
3. Check **"Also set up Firebase Hosting"** — this saves a step later.
4. Click **"Register app"**.
5. Firebase will display a `firebaseConfig` object like this:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

**Copy these values** — you will need them in the next step.

> [!CAUTION]
> Never commit your actual API keys to a public Git repository. Always use environment variables (`.env` file) and make sure `.env` is listed in `.gitignore`.

---

## 4. Configure Environment Variables

In the root of the cloned project, create a file named **`.env`** (copy from `.env.example`):

```bash
cp .env.example .env
```

Open `.env` and fill in the values from your Firebase config object:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_SCRIPT_URL=                     # Leave blank for now (see Email Setup guide)
```

> [!IMPORTANT]
> All environment variables **must** start with `VITE_` to be accessible by the Vite build tool. Variables without this prefix will be undefined at runtime.

---

## 5. Enable Google Authentication

The portal uses **Google Sign-In** as its only authentication method.

1. In the Firebase Console, go to **Build → Authentication** in the left sidebar.
2. Click **"Get started"**.
3. Under the **"Sign-in method"** tab, click **Google**.
4. Toggle the **Enable** switch to **ON**.
5. Set a **Project support email** (your organization's email address).
6. Click **Save**.

### Add Authorized Domains

By default, only `localhost` and your `.web.app` domain are authorized. If you use a custom domain:

1. Still in **Authentication**, click the **"Settings"** tab.
2. Under **"Authorized domains"**, click **"Add domain"**.
3. Enter your custom domain (e.g. `portal.yourorg.org`).

> [!NOTE]
> Users sign in with their Google account. The portal then checks if their account has been approved by an admin before granting access. New sign-ins are placed in a **"pending"** state automatically.

---

## 6. Set Up Firestore Database

The portal uses **Cloud Firestore** as its database.

1. In the Firebase Console, go to **Build → Firestore Database**.
2. Click **"Create database"**.
3. Choose **"Start in production mode"** (you will set proper rules in the next step).
4. Select a **database location** closest to your users (e.g. `europe-west1` for Ethiopia/Africa).
5. Click **"Done"**.

### Database Structure Overview

The portal organizes all data under a single app-level path. You do **not** need to create collections manually — the app creates them automatically when first used. The structure is:

```
artifacts/
  └── {appId}/
        └── public/
              └── data/
                    ├── hunters/          # User profiles & roles
                    ├── campaigns/        # Asteroid search campaigns
                    ├── image_sets/       # Individual image set assignments
                    ├── invitations/      # Pending email invitations
                    ├── notifications/    # Per-user in-app notifications
                    ├── global_chat/      # Global chat messages
                    └── resources/        # Training materials & links
```

> [!NOTE]
> The `{appId}` segment is the value of your `VITE_FIREBASE_APP_ID` environment variable. This namespacing means you can safely run multiple portal instances on the same Firebase project.

---

## 7. Apply Firestore Security Rules

Security rules control who can read and write to your database. The portal has **two layers** of access control:

| Layer | Where enforced | What it does |
|---|---|---|
| **Firebase Rules** | Firestore server | Blocks unauthenticated and unapproved access at the database level |
| **App logic** | React frontend | Enforces role-based permissions (admin / manager / moderator / volunteer) within the UI |

Both layers must be in place for the portal to be properly secure.

### The Rules

1. In the Firebase Console, go to **Firestore Database → Rules**.
2. Replace the default rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper: returns true if the calling user's account is approved
    function isApprovedUser(appId) {
      let hunterDoc = /databases/$(database)/documents/artifacts/$(appId)/public/data/hunters/$(request.auth.uid);
      return exists(hunterDoc) && get(hunterDoc).data.status == 'active';
    }

    match /artifacts/{appId}/public/data/{document=**} {

      // Any authenticated user can READ (needed to show the pending screen)
      allow read: if request.auth != null;

      // New users can CREATE their own hunter profile (creates the pending record on first sign-in)
      allow create: if request.auth != null
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.status == 'pending';

      // Only approved (active) users can WRITE everything else
      allow write: if request.auth != null && isApprovedUser(appId);
    }

    // Deny all other paths by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**.

> [!IMPORTANT]
> **Why these rules matter:** Without server-side rules, a "pending" user could bypass the portal UI entirely and directly call the Firebase API to read or modify your database. These rules enforce approval at the database level — a pending user can only create their own initial profile document and read data (to see the waiting screen). They cannot write anything else until an admin approves them.

> [!NOTE]
> The `isApprovedUser()` helper reads the user's `hunters` document in Firestore to verify their `status == 'active'`. This check happens on Firebase's servers, not in the browser, so it cannot be bypassed by a client.

> [!TIP]
> If you later want to add finer role-based write rules (e.g. only managers can write to `campaigns`), you can extend the `isApprovedUser` function to also check the user's `role` field. For most deployments the rules above are the right balance of security and simplicity.

---

## 8. Set Up Firebase Hosting

If you didn't enable Hosting during app registration, do it now:

1. In the Firebase Console, go to **Build → Hosting**.
2. Click **"Get started"** and follow the prompts.

### Initialize Hosting Locally

In your terminal, from the project root:

```bash
firebase login
```

This opens a browser window — log in with the same Google account that owns the Firebase project.

```bash
firebase init hosting
```

Answer the prompts as follows:

| Prompt | Answer |
|---|---|
| Are you ready to proceed? | `Y` |
| Project setup | `Use an existing project` → select your project |
| Public directory | `dist` *(Vite builds to `dist`, not `public`)* |
| Single-page app (rewrite all URLs to `/index.html`)? | `Yes` |
| Automatic builds with GitHub? | `No` *(set up manually first)* |
| Overwrite `dist/index.html`? | `No` |

This creates a `firebase.json` configuration file in your project root.

---

## 9. Connect & Run the Project

### Install Dependencies

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser. Sign in with a Google account — you will arrive at a **"pending approval"** screen. This is expected. See the next section to bootstrap your first admin.

### Build & Deploy to Firebase

```bash
npm run build
firebase deploy --only hosting
```

Your portal will be live at `https://your-project-id.web.app`.

> [!IMPORTANT]
> Always run `npm run build` **before** `firebase deploy`. Deploying without building will push the previous compiled version, not your latest source changes.

---

## 10. First-Time Admin Bootstrap

When your portal is brand new, there are no approved users — including you. You need to manually promote the first admin account directly in Firestore.

1. Sign in to the portal with your Google account. You will be shown the **"pending"** screen.
2. Go to the **Firebase Console → Firestore Database → Data**.
3. Navigate to:
   ```
   artifacts → {your-app-id} → public → data → hunters
   ```
4. Find the document with your user's **UID** (this is created automatically when you sign in).
5. Edit the following fields:
   - `status`: change from `"pending"` to `"active"`
   - `role`: change from `"volunteer"` to `"admin"`
6. Refresh the portal. You now have full admin access.

> [!NOTE]
> After this one-time setup, all future user approvals and role assignments can be managed entirely from within the portal's **Team Management** section — no more manual Firestore edits needed.

---

## 11. Troubleshooting

### "Permission denied" errors in the browser console
- Your Firestore **security rules** have not been published correctly. Return to step 7.
- The user's account may still be in `"pending"` status. See step 10.

### Blank white screen after deployment
- You likely deployed without building. Run `npm run build` then `firebase deploy --only hosting`.
- Open the browser DevTools console (F12) and check for errors about missing environment variables.

### "Firebase: Error (auth/unauthorized-domain)"
- Your domain is not in the **Authorized Domains** list. See step 5 → "Add Authorized Domains".

### Users cannot sign in at all
- Google sign-in is not enabled. Return to step 5 and ensure the Google provider is toggled **ON** and saved.

### Environment variables are `undefined` at runtime
- Make sure every variable in `.env` starts with `VITE_`.
- Make sure the `.env` file is in the **project root**, not inside `src/`.
- Restart the dev server (`npm run dev`) after editing `.env`.

### Email notifications not sending
- The email system uses a separate Google Apps Script. See [Email Setup Guide](./email_setup.md) for full configuration instructions.

---

## Related Guides

| Guide | Description |
|---|---|
| [README.md](./README.md) | Project overview and quick start |
| [deployment_guide.md](./deployment_guide.md) | Detailed Firebase Hosting deployment steps |
| [email_setup.md](./email_setup.md) | Configuring automated email notifications |
| [USER_MANUAL.md](./USER_MANUAL.md) | End-user guide for all roles |
| [asteroid_verification.md](./asteroid_verification.md) | How to analyse and verify image sets |

---

*ESSS CSP Portal — Built for the Stars, by ESSS.*
