# Setup Internal Google Email Service (Free)

To send emails using your own Gmail account without third-party services, we use **Google Apps Script**.

## 1. Get the Script Code
1.  Open the file `google_apps_script.js` in your project folder.
2.  Copy all the code.

## 2. Deploy to Google
1.  Go to [script.google.com](https://script.google.com/home).
2.  Click **New Project**.
3.  Delete the default `function myFunction() {...}` and paste your code.
4.  Name the project "CSP Mailer".
5.  Click **Deploy** (blue button top right) -> **New Deployment**.
6.  Click the "Select type" gear icon -> **Web app**.
7.  **Description:** "CSP Emailer"
8.  **Execute as:** "Me" (This means it uses YOUR Gmail to send).
9.  **Who has access:** "Anyone" (This is crucial so your App can trigger it).
10. Click **Deploy**.
11. **Authorize:** Popups will appear asking permission to use your Gmail. Click "Review Permissions", choose your account, and if it says "Unverified app", click "Advanced" -> "Go to CSP Mailer (unsafe)" (since you wrote it, it is safe).
12. **Copy URL:** Copy the "Web App URL" (ends in `/exec`).

## 3. Configure Your App
1.  Open `.env` in your project root.
2.  Add this line:
    ```env
    VITE_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_LONG_ID_HERE/exec
    ```
3.  **Restart** your dev server (`Ctrl+C`, `npm run dev`).

Now, when you Assign or Reject tasks, your app sends a silent HTTP request to your Google Script, which sends the email from your Gmail account!
