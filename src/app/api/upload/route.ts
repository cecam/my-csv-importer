import { NextResponse } from 'next/server';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';
import path from 'path';
import { IncomingMessage } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: IncomingMessage) {
  const form = new IncomingForm({
    keepExtensions: true,
    uploadDir: path.join(process.cwd(), 'uploads'),
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(new Error('Error parsing the file'));
        return;
      }

      // Safe handling of files to ensure it is of type File
      const file = Array.isArray(files.file) ? files.file[0] : (files.file as File | undefined);

      if (!file) {
        reject(new Error('No file uploaded'));
        return;
      }

      fs.readFile(file.filepath, async (err, data) => {
        if (err) {
          reject(new Error('Error reading the file'));
          return;
        }

        // Process CSV data
        const parsedData = processCSV(data);

        resolve(NextResponse.json(parsedData));
      });
    });
  });
}

function processCSV(data: Buffer) {
  // Implement CSV parsing logic
  // Return parsed data as a JSON object
  return [];
}
