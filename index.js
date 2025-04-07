import express from 'express';
import { BlobServiceClient }  from '@azure/storage-blob';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const storage = multer.diskStorage({
    filename (req, file, cb) {
        cb(null, file.originalname);
    }
})
const upload = multer({storage});


const SASToken = process.env.SAS_TOKEN;
const containerName = process.env.CONTAINER_NAME;
const accountName = process.env.ACCOUNT_NAME;

const AZURE_STORAGE_CONNECTION_STRING = `https://${accountName}.blob.core.windows.net/?${SASToken}`;

// Create the BlobServiceClient object with connection string
const blobServiceClient = new BlobServiceClient(AZURE_STORAGE_CONNECTION_STRING);

// Get a reference to a container
const containerClient = blobServiceClient.getContainerClient(containerName);


app.post('/upload', upload.single('file'), async (req, res) => {
    try {

        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileStream = fs.createReadStream(file.path);

        const blockBlobClient = containerClient.getBlockBlobClient(file.originalname);
        await blockBlobClient.uploadStream(fileStream);
        res.status(200).json({ message: 'File uploaded successfully', url: blockBlobClient.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const port = 5000;

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
});