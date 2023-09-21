const express = require('express');
const { google } = require('googleapis');
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Replace with your Google Drive API credentials
const credentials = require('./your-credentials.json');

const folderId = 'YOUR_FOLDER_ID'; // Replace with your Google Drive folder ID

// Configure Google Drive API
const { client_id, client_secret, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Set up a storage engine using multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve the HTML form for file upload
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Handle file upload
app.post('/upload', upload.array('file'), (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file']
    });

    // Authenticate with Google Drive API
    oAuth2Client.getToken(req.query.code, (err, token) => {
        if (err) {
            console.error('Error getting access token:', err);
            return;
        }

        oAuth2Client.setCredentials(token);

        const drive = google.drive({ version: 'v3', auth: oAuth2Client });

        // Upload each file in the request
        req.files.forEach((file) => {
            const fileMetadata = {
                name: file.originalname,
                parents: ['1EjU7BO4UAwPqN-d2qNlOCaF2MGZofZkq'], 
            };

            const media = {
                mimeType: file.mimetype,
                body: file.buffer,
            };

            drive.files.create(
                {
                    resource: fileMetadata,
                    media: media,
                    fields: 'id',
                },
                (err, file) => {
                    if (err) {
                        console.error('Error uploading file:', err);
                        return;
                    }
                    console.log('File ID:', file.data.id);
                }
            );
        });

        res.send('File(s) uploaded successfully.');
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
