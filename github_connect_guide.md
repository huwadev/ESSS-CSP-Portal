# Connecting to GitHub

You have initialized Git locally. Now follow these steps to upload your project to GitHub.

## 1. Create a Repository on GitHub
1. Go to [GitHub.com](https://github.com) and sign in.
2. Click the **+** icon in the top-right and select **New repository**.
3. **Name:** `esss-csp-portal` (or similar).
4. **Public/Private:** Choose your preference (Private is safer for project code).
5. **Initialize with README/gitignore?** -> **NO**. (Leave these unchecked since we have code locally).
6. Click **Create repository**.

## 2. Link Local Repo to GitHub
Copy the URL provided by GitHub (e.g., `https://github.com/YourUsername/esss-csp-portal.git`).

Run the following command in your terminal (replace the URL):
```powershell
git remote add origin https://github.com/YourUsername/esss-csp-portal.git
```

## 3. Commit and Push
Now save your changes and upload them.

1. **Stage files** (Prepare them for saving):
   ```powershell
   git add .
   ```
   *Note: Thanks to your `.gitignore`, this will automatically exclude `.env` and `node_modules`.*

2. **Commit** (Save a snapshot):
   ```powershell
   git commit -m "Initial commit: Project setup with Asteroid Search module"
   ```

3. **Push** (Upload to GitHub):
   ```powershell
   git branch -M main
   git push -u origin main
   ```

## 4. Verification
Refresh your GitHub page. You should see your files listed (`src`, `package.json`, etc.), but **NOT** `.env`.
