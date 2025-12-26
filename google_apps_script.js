/*
 * 1. Go to https://script.google.com/home
 * 2. Click "New Project"
 * 3. Paste this code into the editor.
 * 4. Save as "EmailSender"
 * 5. Click "Deploy" -> "New Deployment"
 * 6. Select type: "Web app"
 * 7. Description: "CSP Portal Emailer"
 * 8. Execute as: "Me" (IMPORTANT)
 * 9. Who has access: "Anyone" (IMPORTANT - allows your app to call it)
 * 10. Click "Deploy" and Copy the "Web App URL"
 */

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const email = data.email;
        const subject = data.subject;
        const message = data.message;

        MailApp.sendEmail({
            to: email,
            subject: subject,
            htmlBody: message
        });

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
