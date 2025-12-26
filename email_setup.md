# Setup EmailJS for Automatic Notifications

To enable automatic emails without a backend server, we use **EmailJS**. Please follow these steps to get your API keys.

## 1. Create Account
1.  Go to [emailjs.com](https://www.emailjs.com/) and Sign Up (Free Tier is sufficient).

## 2. Add Email Service
1.  Click **"Add New Service"**.
2.  Select **"Gmail"** (or your preferred provider).
3.  Click **Connect Account** and grant permission to send emails on your behalf.
4.  Click **Create Service**.
5.  **Copy the Service ID** (e.g., `service_xyz123`).

## 3. Create Email Template
1.  Click **"Email Templates"** -> **"Create New Template"**.
2.  **Subject:** `{{subject}}`
3.  **Content:**
    ```html
    <h3>Hello {{to_name}},</h3>
    <p>{{message}}</p>
    <br>
    <p>Best regards,<br>ESSS CSP Portal Team</p>
    ```
4.  Save the template.
5.  **Copy the Template ID** (e.g., `template_abc456`).

## 4. Get Public Key
1.  Click on your **Account/Profile** (top right) -> **Public Key**.
2.  Copy the key (e.g., `user_123...`).

## 5. Update .env
Open your `.env` file and add these 3 keys:
```env
VITE_EMAILJS_SERVICE_ID=service_xyz123
VITE_EMAILJS_TEMPLATE_ID=template_abc456
VITE_EMAILJS_PUBLIC_KEY=user_123...
```
*Restart `npm run dev` after updating `.env`.*
