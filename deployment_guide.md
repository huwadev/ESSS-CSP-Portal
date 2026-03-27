# Deployment Guide: Firebase Hosting

## 1. Prerequisites
- [x] Node.js & npm installed
- [x] `firebase-tools` installed (Global)
- [x] Project build successful (`npm run build`)

## 2. Authenticate
You need to sign in to Firebase in your terminal.
```powershell
firebase login
```
*Note: This will open a browser window. Follow the steps to log in with your Google account.*

## 3. Initialize Hosting
Run the initialization command:
```powershell
firebase init hosting
```
**Selections:**
1. **Are you ready to proceed?** -> `Y`
2. **Select option:** -> `Use an existing project`
3. **Select project:** -> `your-firebase-project-id` (or select from list)
4. **What do you want to use as your public directory?** -> `dist`
   * *Important: Vite builds to `dist`, not `public`.*
5. **Configure as a single-page app (rewrite all urls to /index.html)?** -> `Yes`
6. **Set up automatic builds and deploys with GitHub?** -> `No` (for manual deployment)
7. **File dist/index.html already exists. Overwrite?** -> `No`

### 4. Deploy to Firebase

1.  Build the project for production:
    ```bash
    npm run build
    ```
2.  Deploy the built files to Firebase Hosting:
    ```bash
    firebase deploy
    ```

The terminal will output your **Hosting URL** (e.g., `https://[YOUR-PROJECT-ID].web.app`).

### 5. Verifying Deployment
1.  Open the Hosting URL in your browser.
2.  If the page is blank, open the Browser Console (F12 -> Console) to check for missing environment variables.

---

## Modifying Firestore Rules (Important)

By default, Firebase might lock your database or open it entirely. You need to configure rules in the Firebase Console:

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project from the top dropdown.
3.  In the filter box, type **"Disable service account key creation"**.
4.  Click on the policy to edit it.
5.  Click **"Manage Policy"** (or Edit).
6.  Under **"Policy enforcement"**, select **"Off"** (or "Replace" -> "Not Enforced").
7.  Click **Save**.

## 6. Troubleshooting
### Error: "Key creation is not allowed on this service account"
This error occurs when your Google Cloud Organization Policy prevents creating service account keys. To fix this:
1.  Go to the [Google Cloud Console Organization Policies](https://console.cloud.google.com/iam-admin/orgpolicies).
2.  Select your project (`your-firebase-project-id`) from the top dropdown.
3.  In the filter box, type **"Disable service account key creation"**.
4.  Click on the policy to edit it.
5.  Click **"Manage Policy"** (or Edit).
6.  Under **"Policy enforcement"**, select **"Off"** (or "Replace" -> "Not Enforced").
7.  Click **Save**.
8.  Return to the Firebase Console and try generating the key again.
