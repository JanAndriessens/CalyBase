// Activity Logger Utility for CalyBase
// Centralized logging system for user actions and system events

class ActivityLogger {
    constructor() {
        this.initialized = false;
        this.currentUser = null;
        this.sessionId = this.generateSessionId();
        this.logBuffer = [];
        this.bufferSize = 10;
        this.flushTimeout = 5000; // 5 seconds
        this.flushTimer = null;
    }

    // Initialize the activity logger
    async initialize() {
        if (this.initialized) return;
        
        console.log('📊 Initializing activity logger...');
        
        try {
            // Wait for Firebase auth to be ready
            if (window.firebase && window.firebase.auth) {
                window.firebase.auth().onAuthStateChanged(user => {
                    this.currentUser = user;
                    if (user) {
                        console.log('📊 Activity logger ready for user:', user.email);
                    }
                });
            }
            
            // Set up periodic buffer flush
            this.startBufferFlush();
            
            this.initialized = true;
            console.log('✅ Activity logger initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize activity logger:', error);
        }
    }

    // Generate unique session ID
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Log user activity
    async logActivity(action, category, details = {}, metadata = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const logEntry = {
                // Core identification
                timestamp: new Date(),
                sessionId: this.sessionId,
                
                // User information
                userId: this.currentUser ? this.currentUser.uid : 'anonymous',
                userEmail: this.currentUser ? this.currentUser.email : 'anonymous',
                
                // Action details
                action: action,
                category: category,
                details: details,
                
                // Technical metadata
                metadata: {
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    referrer: document.referrer,
                    timestamp_iso: new Date().toISOString(),
                    ...metadata
                },
                
                // System info
                system: {
                    version: window.DEPLOYMENT_INFO ? window.DEPLOYMENT_INFO.commit : 'unknown',
                    platform: this.detectPlatform()
                }
            };

            // Add to buffer for batch processing
            this.logBuffer.push(logEntry);
            console.log('📊 Activity logged:', action, category, details);

            // Flush buffer if it's full
            if (this.logBuffer.length >= this.bufferSize) {
                await this.flushBuffer();
            }

            return logEntry;

        } catch (error) {
            console.error('❌ Failed to log activity:', error);
        }
    }

    // Detect user platform
    detectPlatform() {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return 'mobile';
        } else if (ua.includes('tablet') || ua.includes('ipad')) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }

    // Flush log buffer to Firestore
    async flushBuffer() {
        if (this.logBuffer.length === 0) return;

        try {
            console.log(`📊 Flushing ${this.logBuffer.length} activity logs...`);

            // Get logs to flush and clear buffer
            const logsToFlush = [...this.logBuffer];
            this.logBuffer = [];

            // Write to Firestore in batch
            if (window.db) {
                const batch = window.db.batch();
                
                logsToFlush.forEach(logEntry => {
                    const docRef = window.db.collection('auditLog').doc();
                    batch.set(docRef, logEntry);
                });

                await batch.commit();
                console.log(`✅ Flushed ${logsToFlush.length} activity logs to Firestore`);
            } else {
                console.warn('⚠️ Firestore not available, logs not persisted');
            }

        } catch (error) {
            console.error('❌ Failed to flush activity logs:', error);
            // Re-add failed logs to buffer for retry
            this.logBuffer = [...this.logBuffer, ...logsToFlush];
        }
    }

    // Start periodic buffer flush
    startBufferFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(() => {
            if (this.logBuffer.length > 0) {
                this.flushBuffer();
            }
        }, this.flushTimeout);
    }

    // Stop activity logging
    stop() {
        console.log('🛑 Stopping activity logger');
        
        // Flush remaining logs
        this.flushBuffer();
        
        // Clear timer
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        
        this.initialized = false;
    }

    // Convenience methods for common actions

    // Authentication events
    async logLogin(method = 'email', success = true, details = {}) {
        return this.logActivity(
            success ? 'login_success' : 'login_failed',
            'authentication',
            { method, success, ...details }
        );
    }

    async logLogout(reason = 'manual', details = {}) {
        return this.logActivity('logout', 'authentication', { reason, ...details });
    }

    async logSessionTimeout(details = {}) {
        return this.logActivity('session_timeout', 'authentication', details);
    }

    // Member management events
    async logMemberAction(action, memberData = {}, details = {}) {
        return this.logActivity(
            `member_${action}`,
            'member_management',
            { memberData, ...details }
        );
    }

    async logExcelImport(filename, rowCount, success = true, details = {}) {
        return this.logActivity(
            success ? 'excel_import_success' : 'excel_import_failed',
            'data_import',
            { filename, rowCount, success, ...details }
        );
    }

    // System administration events
    async logSystemConfigChange(configSection, changes = {}, details = {}) {
        return this.logActivity(
            'system_config_change',
            'administration',
            { configSection, changes, ...details }
        );
    }

    async logUserManagement(action, targetUser = {}, details = {}) {
        return this.logActivity(
            `user_${action}`,
            'user_management',
            { targetUser, ...details }
        );
    }

    // Data access events
    async logDataAccess(resource, action = 'view', details = {}) {
        return this.logActivity(
            `data_${action}`,
            'data_access',
            { resource, ...details }
        );
    }

    async logDataExport(format, resourceType, recordCount = 0, details = {}) {
        return this.logActivity(
            'data_export',
            'data_access',
            { format, resourceType, recordCount, ...details }
        );
    }

    // Security events
    async logSecurityEvent(eventType, severity = 'medium', details = {}) {
        return this.logActivity(
            `security_${eventType}`,
            'security',
            { severity, ...details }
        );
    }

    // Page navigation events
    async logPageVisit(pageName, details = {}) {
        return this.logActivity(
            'page_visit',
            'navigation',
            { pageName, ...details }
        );
    }

    // Error events
    async logError(errorType, errorMessage, details = {}) {
        return this.logActivity(
            'error',
            'system',
            { errorType, errorMessage, ...details }
        );
    }

    // Get activity statistics
    getSessionStats() {
        return {
            sessionId: this.sessionId,
            bufferSize: this.logBuffer.length,
            initialized: this.initialized,
            currentUser: this.currentUser ? this.currentUser.email : 'anonymous'
        };
    }
}

// Create global instance
window.activityLogger = new ActivityLogger();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.activityLogger) {
        window.activityLogger.initialize();
        
        // Log page visit
        const pageName = document.title || window.location.pathname;
        window.activityLogger.logPageVisit(pageName);
    }
});

// Log page unload
window.addEventListener('beforeunload', () => {
    if (window.activityLogger) {
        window.activityLogger.flushBuffer();
    }
});

// Global convenience functions
window.logActivity = function(action, category, details, metadata) {
    if (window.activityLogger) {
        return window.activityLogger.logActivity(action, category, details, metadata);
    }
};

// Debug function
window.debugActivityLogger = function() {
    console.log('📊 Activity Logger Status:', window.activityLogger.getSessionStats());
    console.log('📊 Buffer Contents:', window.activityLogger.logBuffer);
};

console.log('📊 Activity logger module loaded');