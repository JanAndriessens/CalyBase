// Deployment timestamp verification
console.log('🕐 DEPLOYMENT TIMESTAMP: ' + new Date().toLocaleString() + ' - Commit XLSX-ONLY-IMPORT');
console.log('✅ LATEST DEPLOYMENT: XLSX-only import with French conversion instructions');
console.log('🎯 IF YOU SEE THIS: Only XLSX files accepted - XLS files get conversion instructions!');

// Global deployment info
window.DEPLOYMENT_INFO = {
    commit: 'XLSX-ONLY-IMPORT',
    timestamp: new Date().toISOString(),
    approach: 'XLSX-only import: Block XLS files, show French conversion instructions, optimize for XLSX format',
    expectedLogs: [
        '🎯 Only XLSX files accepted - XLS files get conversion instructions!',
        '✅ UTF-8 encoding optimized for XLSX format',
        '📋 French conversion instructions for XLS users'
    ]
};