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
3. **Select project:** -> `csp-asteroid-hunters` (or select from list)
4. **What do you want to use as your public directory?** -> `dist`
   * *Important: Vite builds to `dist`, not `public`.*
5. **Configure as a single-page app (rewrite all urls to /index.html)?** -> `Yes`
6. **Set up automatic builds and deploys with GitHub?** -> `No` (unless you want this)
7. **File dist/index.html already exists. Overwrite?** -> `No`

## 4. Deploy
Once initialized, deploy your application:
```powershell
npm run build
firebase deploy
```

The terminal will output your **Hosting URL** (e.g., `https://csp-asteroid-hunters.web.app`).
