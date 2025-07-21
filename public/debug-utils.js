// Debug utilities for CalyBase
// Conditional logging that can be disabled in production

(function() {
    'use strict';

    // Check if we're in development mode
    const isDevelopment = () => {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.search.includes('debug=true');
    };

    // Debug logger that only logs in development
    window.DebugLogger = {
        log: (...args) => {
            if (isDevelopment()) {
                console.log(...args);
            }
        },
        warn: (...args) => {
            if (isDevelopment()) {
                console.warn(...args);
            }
        },
        error: (...args) => {
            // Always log errors, but with less detail in production
            if (isDevelopment()) {
                console.error(...args);
            } else {
                console.error('An error occurred. Enable debug mode for details.');
            }
        },
        info: (...args) => {
            if (isDevelopment()) {
                console.info(...args);
            }
        },
        group: (...args) => {
            if (isDevelopment()) {
                console.group(...args);
            }
        },
        groupEnd: () => {
            if (isDevelopment()) {
                console.groupEnd();
            }
        }
    };

    // Legacy console replacement for gradual migration
    // TEMPORARILY DISABLED: Allow full error messages for debugging dashboard issue
    if (false && !isDevelopment()) {
        // In production, replace console methods with no-ops except for errors
        const originalConsole = { ...console };
        console.log = () => {};
        console.info = () => {};
        console.warn = () => {};
        console.group = () => {};
        console.groupEnd = () => {};
        // Keep error but make it less verbose
        console.error = (...args) => {
            originalConsole.error('Error occurred:', args[0]?.message || 'Unknown error');
        };
    }
})();