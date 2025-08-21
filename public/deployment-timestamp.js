// Deployment timestamp verification
console.log('🕐 DEPLOYMENT TIMESTAMP: ' + new Date().toLocaleString() + ' - Commit CALY-CLUB-FIREBASE-CONFIG');
console.log('✅ LATEST DEPLOYMENT: Firebase configuration updated for caly.club domain');
console.log('📋 FIXES: Production config detection for caly.club, CORS updates, storage rules');

// Global deployment info
window.DEPLOYMENT_INFO = {
    commit: 'CALY-CLUB-FIREBASE-CONFIG',
    timestamp: new Date().toISOString(),
    version: '2024.08.21.1',
    features: [
        'Firebase configuration for caly.club domain',
        'CORS configuration for caly.club in Functions',
        'Storage rules updated for caly.club',
        'Production detection for any non-localhost domain',
        'Debug logging for domain detection'
    ],
    expectedLogs: [
        '🔍 Current hostname: caly.club',
        '🔍 Is Production? true',
        '✅ Using production Firebase configuration'
    ]
};