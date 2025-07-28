/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}

// Create Express app
const app = express();

const allowedOrigins = [
  'https://calybase.web.app',
  'https://calybase.firebaseapp.com',
  'https://calybase.vercel.app',
  'https://caly-base.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000'
];

// CORS middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Explicit OPTIONS handler for /auth/firebase-users
app.options('/auth/firebase-users', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Explicit OPTIONS handler for /auth/delete-user
app.options('/auth/delete-user', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use('*', (req, res, next) => {
    console.log(`🔍 ${req.method} ${req.originalUrl} - Headers:`, req.headers);
    next();
});

// Simple authentication middleware for admin endpoints
async function requireAuth(req: any, res: any, next: any) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Check if user is admin or superAdmin
        const customClaims = decodedToken.customClaims || {};
        const userRole = customClaims.role || 'user';
        
        if (!['admin', 'superAdmin'].includes(userRole)) {
            // Also check Firestore for role
            const firestore = admin.firestore();
            const userDoc = await firestore.collection('users').doc(decodedToken.uid).get();
            const userData = userDoc.data();
            const firestoreRole = userData?.role || 'user';
            
            if (!['admin', 'superAdmin'].includes(firestoreRole)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }
        }
        
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            error: 'Invalid authorization token', 
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
    }
}

// Firebase Auth Users endpoint - SELF-CONTAINED VERSION
app.get('/auth/firebase-users', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}), requireAuth, async (req, res) => {
    try {
        console.log('🔍 Functions: Getting all Firebase Auth users...');
        
        // Get all Firebase Auth users
        const listUsersResult = await admin.auth().listUsers();
        const authUsers = listUsersResult.users;
        
        console.log(`📊 Functions: Found ${authUsers.length} Firebase Auth users`);
        
        // Get Firestore user documents for comparison
        const firestore = admin.firestore();
        const usersSnapshot = await firestore.collection('users').get();
        const firestoreUsers = new Map();
        
        usersSnapshot.forEach(doc => {
            firestoreUsers.set(doc.id, doc.data());
        });
        
        console.log(`📊 Functions: Found ${firestoreUsers.size} Firestore user documents`);
        
        // Combine Firebase Auth with Firestore data
        const combinedUsers = authUsers.map(authUser => {
            const firestoreData = firestoreUsers.get(authUser.uid);
            const hasFirestoreDoc = !!firestoreData;
            
            return {
                uid: authUser.uid,
                email: authUser.email,
                emailVerified: authUser.emailVerified,
                disabled: authUser.disabled,
                metadata: authUser.metadata,
                customClaims: authUser.customClaims,
                providerData: authUser.providerData,
                // Firestore data
                firestore: firestoreData,
                hasFirestoreDoc: hasFirestoreDoc,
                needsFirestoreDoc: !hasFirestoreDoc,
                // Display fields
                displayRole: firestoreData?.role || 'user',
                displayStatus: firestoreData?.status || (hasFirestoreDoc ? 'unknown' : 'missing-firestore')
            };
        });
        
        const summary = {
            totalAuthUsers: authUsers.length,
            totalFirestoreUsers: firestoreUsers.size,
            usersWithBothRecords: combinedUsers.filter(u => u.hasFirestoreDoc).length,
            usersMissingFirestore: combinedUsers.filter(u => !u.hasFirestoreDoc).length
        };
        
        console.log('📈 Functions: Summary:', summary);
        
        res.json({
            success: true,
            users: combinedUsers,
            summary: summary
        });
        
    } catch (error) {
        console.error('❌ Functions: Firebase users error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch Firebase users',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Delete user endpoint (using POST due to Cloud Run DELETE restrictions)
app.post('/auth/delete-user', cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}), requireAuth, async (req: any, res: any) => {
    try {
        console.log('🔍 Functions: Delete user endpoint called (via POST)');
        console.log('📝 Functions: Request body:', req.body);
        console.log('📝 Functions: Request headers:', req.headers);
        
        const { userId, userEmail } = req.body;
        
        if (!userId || !userEmail) {
            console.log('❌ Functions: Missing userId or userEmail');
            return res.status(400).json({ error: 'userId et userEmail sont requis' });
        }

        console.log(`🗑️ Functions: Deleting user ${userEmail} (${userId})`);

        // Delete from Firebase Auth
        await admin.auth().deleteUser(userId);
        console.log(`✅ Functions: User ${userEmail} deleted from Firebase Auth`);

        // Also delete from Firestore if document exists
        const firestore = admin.firestore();
        const userDocRef = firestore.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        
        if (userDoc.exists) {
            await userDocRef.delete();
            console.log(`✅ Functions: User ${userEmail} document deleted from Firestore`);
        }

        console.log(`✅ Functions: Successfully deleted user ${userEmail}`);
        res.json({ 
            success: true, 
            message: `Utilisateur ${userEmail} supprimé avec succès de Firebase Auth et Firestore` 
        });
        
    } catch (error) {
        console.error('❌ Functions: Delete user error:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la suppression de l\'utilisateur',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// API Routes
app.get('/status', (req, res) => {
    res.json({ message: 'Bienvenue sur l\'API CalyBase - Firebase Functions', version: '1.1.1' });
});

// Test DELETE endpoint
app.delete('/test-delete', (req, res) => {
    console.log('🧪 Test DELETE endpoint called');
    res.json({ success: true, message: 'DELETE method is working' });
});

// Health check with Cloud Run CORS
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: 'production',
        version: '1.1.0'
    });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
    console.error('Erreur:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Export the main API function
export const api = onRequest({ 
    region: "us-central1",
    memory: "256MiB",
    timeoutSeconds: 60,
    maxInstances: 100,
    ingressSettings: "ALLOW_ALL",
    invoker: "public"
}, app);
