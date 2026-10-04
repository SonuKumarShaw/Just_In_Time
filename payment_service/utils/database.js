import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PAYMENTS_FILE = path.join(DATA_DIR, 'payments.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Read JSON file
async function readJSON(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

// Write JSON file
async function writeJSON(filePath, data) {
    await ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// User operations
export async function getUser(username) {
    const users = await readJSON(USERS_FILE);
    return users.find(u => u.username === username);
}

export async function createUser(userData) {
    const users = await readJSON(USERS_FILE);
    const newUser = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        subscriptionPlan: 'free',
        subscriptionStatus: 'trial',
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoPayment: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    await writeJSON(USERS_FILE, users);
    return newUser;
}

export async function updateUser(username, updates) {
    const users = await readJSON(USERS_FILE);
    const index = users.findIndex(u => u.username === username);

    if (index === -1) {
        throw new Error('User not found');
    }

    users[index] = {
        ...users[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    await writeJSON(USERS_FILE, users);
    return users[index];
}

// Payment operations
export async function createPayment(paymentData) {
    const payments = await readJSON(PAYMENTS_FILE);
    const newPayment = {
        id: `pay_${Date.now()}`,
        userId: paymentData.userId,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'INR',
        status: paymentData.status,
        planType: paymentData.planType,
        createdAt: new Date().toISOString(),
        metadata: paymentData.metadata || {}
    };
    payments.push(newPayment);
    await writeJSON(PAYMENTS_FILE, payments);
    return newPayment;
}

export async function getPaymentsByUser(userId) {
    const payments = await readJSON(PAYMENTS_FILE);
    return payments.filter(p => p.userId === userId);
}

export async function updatePaymentStatus(transactionId, status) {
    const payments = await readJSON(PAYMENTS_FILE);
    const index = payments.findIndex(p => p.transactionId === transactionId);

    if (index !== -1) {
        payments[index].status = status;
        await writeJSON(PAYMENTS_FILE, payments);
        return payments[index];
    }

    return null;
}
