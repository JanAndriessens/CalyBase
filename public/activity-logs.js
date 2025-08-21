// Activity Logs Viewer JavaScript for CalyBase
// Handles loading, filtering, and displaying activity logs from Firestore

class ActivityLogsViewer {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.currentPage = 1;
        this.logsPerPage = 50;
        this.totalPages = 1;
        this.filters = {
            user: '',
            category: '',
            dateFrom: '',
            dateTo: '',
            search: ''
        };
        this.isLoading = false;
        this.stats = {
            totalLogs: 0,
            todayLogs: 0,
            activeUsers: 0,
            securityEvents: 0
        };
    }

    // Initialize the logs viewer
    async initialize() {
        console.log('📊 Initializing activity logs viewer...');
        
        try {
            // Set up event listeners
            this.setupEventListeners();
            
            // Set default date range (last 30 days)
            this.setDefaultDateRange();
            
            // Load activity logs
            await this.loadLogs();
            
            console.log('✅ Activity logs viewer initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize activity logs viewer:', error);
            this.showError('Échec de l\'initialisation du visualiseur de journaux');
        }
    }

    // Set up event listeners for UI interactions
    setupEventListeners() {
        // Filter event listeners
        document.getElementById('userFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('categoryFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('dateFromFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('dateToFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchFilter').addEventListener('input', this.debounce(() => this.applyFilters(), 500));
        
        // Action button listeners
        document.getElementById('refreshButton').addEventListener('click', () => this.loadLogs());
        document.getElementById('exportButton').addEventListener('click', () => this.toggleExportDropdown());
        
        // Close export dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.export-options')) {
                this.hideExportDropdown();
            }
        });
    }

    // Set default date range to last 30 days
    setDefaultDateRange() {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        document.getElementById('dateFromFilter').value = thirtyDaysAgo.toISOString().split('T')[0];
        document.getElementById('dateToFilter').value = today.toISOString().split('T')[0];
    }

    // Load activity logs from Firestore
    async loadLogs() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            console.log('📊 Loading activity logs from Firestore...');
            
            if (!window.db) {
                throw new Error('Firestore database not available');
            }

            // Build query with date filters
            let query = window.db.collection('auditLog').orderBy('timestamp', 'desc');
            
            // Apply date filters if set
            const dateFrom = document.getElementById('dateFromFilter').value;
            const dateTo = document.getElementById('dateToFilter').value;
            
            if (dateFrom) {
                const fromDate = new Date(dateFrom);
                fromDate.setHours(0, 0, 0, 0);
                query = query.where('timestamp', '>=', fromDate);
            }
            
            if (dateTo) {
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                query = query.where('timestamp', '<=', toDate);
            }
            
            // Limit results to prevent excessive loading
            query = query.limit(1000);
            
            const snapshot = await query.get();
            
            this.logs = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                this.logs.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
                });
            });
            
            console.log(`✅ Loaded ${this.logs.length} activity logs`);
            
            // Update user filter options
            this.updateUserFilterOptions();
            
            // Calculate statistics
            this.calculateStats();
            
            // Apply current filters and display
            this.applyFilters();
            
        } catch (error) {
            console.error('❌ Failed to load activity logs:', error);
            this.showError('Échec du chargement des journaux d\'activité');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    // Update user filter dropdown with unique users from logs
    updateUserFilterOptions() {
        const userFilter = document.getElementById('userFilter');
        const currentValue = userFilter.value;
        
        // Clear existing options except "All users"
        userFilter.innerHTML = '<option value="">Tous les utilisateurs</option>';
        
        // Get unique users from logs
        const uniqueUsers = [...new Set(this.logs.map(log => log.userEmail).filter(email => email && email !== 'anonymous'))];
        uniqueUsers.sort();
        
        // Add user options
        uniqueUsers.forEach(email => {
            const option = document.createElement('option');
            option.value = email;
            option.textContent = email;
            if (email === currentValue) {
                option.selected = true;
            }
            userFilter.appendChild(option);
        });
    }

    // Calculate statistics from loaded logs
    calculateStats() {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        this.stats.totalLogs = this.logs.length;
        
        // Count today's logs
        this.stats.todayLogs = this.logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= today;
        }).length;
        
        // Count active users (unique users in logs)
        const activeUsers = new Set(this.logs.map(log => log.userEmail).filter(email => email && email !== 'anonymous'));
        this.stats.activeUsers = activeUsers.size;
        
        // Count security events
        this.stats.securityEvents = this.logs.filter(log => log.category === 'security').length;
        
        // Update stats display
        this.updateStatsDisplay();
    }

    // Update statistics display
    updateStatsDisplay() {
        document.getElementById('totalLogsCount').textContent = this.stats.totalLogs.toLocaleString();
        document.getElementById('todayLogsCount').textContent = this.stats.todayLogs.toLocaleString();
        document.getElementById('activeUsersCount').textContent = this.stats.activeUsers.toLocaleString();
        document.getElementById('securityEventsCount').textContent = this.stats.securityEvents.toLocaleString();
    }

    // Apply current filters to logs
    applyFilters() {
        // Get current filter values
        this.filters.user = document.getElementById('userFilter').value;
        this.filters.category = document.getElementById('categoryFilter').value;
        this.filters.dateFrom = document.getElementById('dateFromFilter').value;
        this.filters.dateTo = document.getElementById('dateToFilter').value;
        this.filters.search = document.getElementById('searchFilter').value.toLowerCase();
        
        // Filter logs
        this.filteredLogs = this.logs.filter(log => {
            // User filter
            if (this.filters.user && log.userEmail !== this.filters.user) {
                return false;
            }
            
            // Category filter
            if (this.filters.category && log.category !== this.filters.category) {
                return false;
            }
            
            // Search filter (search in action and details)
            if (this.filters.search) {
                const searchText = `${log.action} ${JSON.stringify(log.details)}`.toLowerCase();
                if (!searchText.includes(this.filters.search)) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Reset pagination
        this.currentPage = 1;
        this.totalPages = Math.ceil(this.filteredLogs.length / this.logsPerPage);
        
        // Display filtered logs
        this.displayLogs();
        this.updatePagination();
        
        console.log(`📊 Applied filters: ${this.filteredLogs.length} logs match criteria`);
    }

    // Display logs in the table
    displayLogs() {
        const tableBody = document.getElementById('logsTableBody');
        const table = document.getElementById('logsTable');
        const noLogsMessage = document.getElementById('noLogsMessage');
        
        if (this.filteredLogs.length === 0) {
            table.style.display = 'none';
            noLogsMessage.style.display = 'block';
            return;
        }
        
        table.style.display = 'table';
        noLogsMessage.style.display = 'none';
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.logsPerPage;
        const endIndex = Math.min(startIndex + this.logsPerPage, this.filteredLogs.length);
        const pageWLogs = this.filteredLogs.slice(startIndex, endIndex);
        
        // Clear existing rows
        tableBody.innerHTML = '';
        
        // Add log rows
        pageWLogs.forEach(log => {
            const row = this.createLogRow(log);
            tableBody.appendChild(row);
        });
    }

    // Create a table row for a log entry
    createLogRow(log) {
        const row = document.createElement('tr');
        
        // Format timestamp
        const timestamp = new Date(log.timestamp).toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        // Format user email
        const userEmail = log.userEmail || 'Anonyme';
        
        // Format action
        const action = log.action || 'Action inconnue';
        
        // Format category with styling
        const categoryClass = `category-${log.category || 'system'}`;
        const categoryText = this.getCategoryDisplayName(log.category);
        
        // Format details (truncated)
        const detailsText = this.formatDetails(log.details);
        const detailsId = `details-${log.id}`;
        
        // Format session ID (short version)
        const sessionId = log.sessionId ? log.sessionId.split('_')[1] : 'N/A';
        
        row.innerHTML = `
            <td class="log-timestamp">${timestamp}</td>
            <td class="log-user">${userEmail}</td>
            <td class="log-action">${action}</td>
            <td><span class="log-category ${categoryClass}">${categoryText}</span></td>
            <td class="log-details">
                <div id="${detailsId}">${detailsText}</div>
                ${Object.keys(log.details || {}).length > 0 ? `<span class="expand-details" onclick="window.activityLogsViewer.toggleDetails('${detailsId}', ${JSON.stringify(log.details).replace(/"/g, '&quot;')})">Voir plus...</span>` : ''}
            </td>
            <td style="font-family: monospace; font-size: 0.8rem;">${sessionId}</td>
        `;
        
        return row;
    }

    // Get display name for category
    getCategoryDisplayName(category) {
        const categoryNames = {
            'authentication': 'Authentification',
            'member_management': 'Gestion membres',
            'data_import': 'Import données',
            'administration': 'Administration',
            'data_access': 'Accès données',
            'security': 'Sécurité',
            'navigation': 'Navigation',
            'system': 'Système'
        };
        
        return categoryNames[category] || 'Système';
    }

    // Format details for display
    formatDetails(details) {
        if (!details || Object.keys(details).length === 0) {
            return 'Aucun détail';
        }
        
        // Create a summary of key details
        const summary = [];
        if (details.method) summary.push(`Méthode: ${details.method}`);
        if (details.filename) summary.push(`Fichier: ${details.filename}`);
        if (details.memberData && details.memberData.nom) summary.push(`Membre: ${details.memberData.nom}`);
        if (details.resource) summary.push(`Ressource: ${details.resource}`);
        if (details.success !== undefined) summary.push(`Succès: ${details.success ? 'Oui' : 'Non'}`);
        
        return summary.length > 0 ? summary.slice(0, 2).join(', ') : 'Voir détails';
    }

    // Toggle expanded details view
    toggleDetails(detailsId, detailsData) {
        const detailsElement = document.getElementById(detailsId);
        const expandLink = detailsElement.nextElementSibling;
        
        if (detailsElement.querySelector('.log-details-expanded')) {
            // Collapse details
            const summary = this.formatDetails(detailsData);
            detailsElement.innerHTML = summary;
            expandLink.textContent = 'Voir plus...';
        } else {
            // Expand details
            const expandedDiv = document.createElement('div');
            expandedDiv.className = 'log-details-expanded';
            expandedDiv.textContent = JSON.stringify(detailsData, null, 2);
            detailsElement.appendChild(expandedDiv);
            expandLink.textContent = 'Voir moins...';
        }
    }

    // Update pagination controls
    updatePagination() {
        const pagination = document.getElementById('pagination');
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPageBtn');
        const nextBtn = document.getElementById('nextPageBtn');
        
        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }
        
        pagination.style.display = 'flex';
        pageInfo.textContent = `Page ${this.currentPage} sur ${this.totalPages}`;
        
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= this.totalPages;
    }

    // Change page
    changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 1 && newPage <= this.totalPages) {
            this.currentPage = newPage;
            this.displayLogs();
            this.updatePagination();
        }
    }

    // Show/hide loading indicator
    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const table = document.getElementById('logsTable');
        const noLogsMessage = document.getElementById('noLogsMessage');
        
        if (show) {
            loadingIndicator.style.display = 'block';
            table.style.display = 'none';
            noLogsMessage.style.display = 'none';
        } else {
            loadingIndicator.style.display = 'none';
        }
    }

    // Show error message
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 1rem;
            border-radius: 4px;
            z-index: 1000;
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    // Toggle export dropdown
    toggleExportDropdown() {
        const dropdown = document.getElementById('exportDropdown');
        dropdown.classList.toggle('show');
    }

    // Hide export dropdown
    hideExportDropdown() {
        const dropdown = document.getElementById('exportDropdown');
        dropdown.classList.remove('show');
    }

    // Export logs in specified format
    exportLogs(format) {
        this.hideExportDropdown();
        
        if (this.filteredLogs.length === 0) {
            alert('Aucun journal à exporter avec les filtres actuels');
            return;
        }
        
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            let filename, content, mimeType;
            
            if (format === 'csv') {
                filename = `activity-logs-${timestamp}.csv`;
                content = this.generateCSV();
                mimeType = 'text/csv';
            } else if (format === 'json') {
                filename = `activity-logs-${timestamp}.json`;
                content = JSON.stringify(this.filteredLogs, null, 2);
                mimeType = 'application/json';
            }
            
            // Create and trigger download
            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            console.log(`📊 Exported ${this.filteredLogs.length} logs as ${format.toUpperCase()}`);
            
        } catch (error) {
            console.error('❌ Failed to export logs:', error);
            alert('Échec de l\'exportation des journaux');
        }
    }

    // Generate CSV content from logs
    generateCSV() {
        const headers = ['Horodatage', 'Utilisateur', 'Action', 'Catégorie', 'Détails', 'Session'];
        const rows = [headers.join(',')];
        
        this.filteredLogs.forEach(log => {
            const row = [
                `"${new Date(log.timestamp).toISOString()}"`,
                `"${log.userEmail || 'Anonyme'}"`,
                `"${log.action || ''}"`,
                `"${log.category || ''}"`,
                `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
                `"${log.sessionId || ''}"`
            ];
            rows.push(row.join(','));
        });
        
        return rows.join('\n');
    }

    // Debounce utility function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global functions for pagination (called from HTML)
window.changePage = function(direction) {
    if (window.activityLogsViewer) {
        window.activityLogsViewer.changePage(direction);
    }
};

window.exportLogs = function(format) {
    if (window.activityLogsViewer) {
        window.activityLogsViewer.exportLogs(format);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Firebase to be ready
    if (window.firebase && window.firebase.auth) {
        window.firebase.auth().onAuthStateChanged(async user => {
            if (user) {
                console.log('👤 User authenticated, initializing activity logs viewer...');
                window.activityLogsViewer = new ActivityLogsViewer();
                await window.activityLogsViewer.initialize();
            } else {
                console.log('👤 User not authenticated, redirecting to login...');
                window.location.href = '/login.html';
            }
        });
    }
});

console.log('📊 Activity logs viewer module loaded');