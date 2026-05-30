# Deployment Guide: Firebase Hosting

This guide covers deploying the ESSS Citizen Science Portal (v3.0.0) to Firebase Hosting.

## 1. Prerequisites

- [x] **Node.js** (v18+) and **npm** installed.
- [x] **Firebase CLI** installed globally: `npm install -g firebase-tools`
- [x] Access to the Firebase project (login with authorized Google account).
- [x] A `.env` file with all required `VITE_FIREBASE_*` environment variables.

## 2. Authenticate

Sign in to Firebase from your terminal:

```bash
firebase login
```

> This opens a browser window for Google account authentication.

## 3. Build for Production

```bash
npm run build
```

This creates an optimized production bundle in the `dist/` directory.

## 4. Deploy

### Deploy Everything (Hosting + Firestore Rules + Indexes)
```bash
firebase deploy
```

### Deploy Only Hosting
```bash
firebase deploy --only hosting
```

### Deploy Only Firestore Rules
```bash
firebase deploy --only firestore:rules
```

After deployment, the terminal outputs your **Hosting URL** (e.g., `https://csp-asteroid-hunters.web.app`).

## 5. Firebase Configuration

The project uses the following Firebase config files:

| File | Purpose |
|------|--------|
| `firebase.json` | Hosting config — serves from `dist/`, SPA rewrite to `index.html`. |
| `firestore.rules` | Security rules for Firestore database access. |
| `firestore.indexes.json` | Composite indexes for Firestore queries. |
| `.firebaserc` | Links the local project to the Firebase project ID. |

### SPA Routing

The portal uses hash-based routing (`#/team/{id}/...`), so all paths are handled by `index.html`. The `firebase.json` rewrites config ensures this:

```json
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

## 6. CI/CD with GitHub Actions

Automated deployment is configured for pushes to the `main` branch.

### Required GitHub Secrets

| Secret | Description |
|--------|------------|
| `FIREBASE_SERVICE_ACCOUNT_CSP_ASTEROID_HUNTERS` | Firebase service account JSON key |
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

## 7. Verifying Deployment

1. Open the Hosting URL in your browser.
2. Verify the login screen loads with the telescope animation.
3. Sign in and confirm the Global Hub dashboard renders.
4. Navigate into a team workspace and verify campaigns load.
5. Check the browser console (F12 → Console) for any errors.

## 8. Troubleshooting

### Blank Page After Deploy
- Open Browser Console (F12 → Console) to check for missing environment variables.
- Verify all `VITE_*` variables were set during build time (not runtime).

### "Key creation is not allowed" Error
This occurs when your Google Cloud Organization Policy prevents creating service account keys.
1. Go to [Google Cloud Console Organization Policies](https://console.cloud.google.com/iam-admin/orgpolicies).
2. Select your project.
3. Search for **"Disable service account key creation"**.
4. Edit the policy → Set enforcement to **"Off"**.
5. Save and retry.

### Firestore Permission Denied
- Verify `firestore.rules` is deployed: `firebase deploy --only firestore:rules`
- Check that the authenticated user's document exists in the `hunters` collection.

### Navigation Loop on Production
- This was resolved in v3.0.0. If you experience routing issues, ensure you are on the latest build.
- Clear browser cache and hard refresh (Ctrl+Shift+R).
