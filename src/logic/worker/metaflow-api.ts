/*
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'
import { nanoid } from "nanoid";

interface MetaflowConfig {
    bucket: string;
    apiUrl: string;
}

interface AuthResponse {
    token: string;
    user: any;
    timestamp: number;
}

interface AIRecord {
    id: string;
    img_url: string;
    metadata: {
        name: string;
        graph: any;
    };
    status: string;
    user_id: string;
}

interface UploadResponse {
    urls: string[];
    [key: string]: any;
}

class MetaflowAPI {
    private config: MetaflowConfig;

    constructor() {
        this.config = {
            bucket: 'ai-generated',
            apiUrl: 'http://68.183.30.252:30332/api/v2',
        }
    }

    async authenticate(username: string, password: string): Promise<AuthResponse | null> {
        try {
            const response = await fetch(this.config.apiUrl + '/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    password
                }),
            });

            const data = await response.json() as any;

            if (data && data.token) {
                return {
                    token: data.token,
                    user: data.user,
                    timestamp: Date.now()
                };
            }

            return null;
        } catch (error: any) {
            console.error('Authentication error:', error.response?.data || error.message);
            throw new Error('Authentication failed: ' + (error.response?.data?.message || error.message));
        }
    }

    async uploadImage(filePath: string): Promise<UploadResponse> {
        try {
            const form = new FormData();
            const fileName = path.basename(filePath);
            form.append('bucketId', this.config.bucket);
            form.append('contentType', 'image/png');
            form.append('subFolder', '/local-machine/');

            const fileStream = fs.createReadStream(filePath);
            form.append('assets', fileStream, {
                filename: fileName,
                contentType: 'image/png'
            });

            const response = await fetch(this.config.apiUrl + '/assets/upload', {
                method: 'POST',
                body: form,
                headers: {
                    ...form.getHeaders()
                }
            });

            const responseText = await response.text();
            console.log('Raw response:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
            }

            const data = JSON.parse(responseText) as UploadResponse;
            console.log('File uploaded successfully');
            console.log('Server response:', data);
            
            const record: AIRecord = {
                id: nanoid(4),
                img_url: data.urls[0],
                metadata: {
                    name: fileName,
                    graph: {}
                },
                status: 'COMPLETED',
                user_id: '62ce1243-793e-4d5a-8efe-883ac903dcf2', //TODO Change after auth implemented
            };
            
            await this.createAIRecord(record);
            return data;
        } catch (error: any) {
            console.error('Error uploading file:', error.message);
            throw error;
        }
    }

    async createAIRecord(record: AIRecord): Promise<void> {
        try {
            const response = await fetch(this.config.apiUrl + '/ai-generator/create-record/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: record,
                }),
            });
            
            const result = await response.json();
            console.log(result);
        } catch (error: any) {
            console.error('Error creating AI record:', error.message);
            throw error;
        }
    }
}

export default MetaflowAPI;*/
