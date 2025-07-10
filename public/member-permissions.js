// Member Management Permissions Utility for CalyBase
// This utility checks user permissions for member management operations

class MemberPermissions {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.systemConfig = null;
        this.initialized = false;
    }

    // Initialize the permissions checker
    async initialize() {
        try {
            console.log('🔧 Initializing member permissions...');
            
            // Wait for authentication
            await this.waitForAuth();
            
            // Get current user
            this.currentUser = window.auth?.currentUser;
            console.log('👤 Current user:', this.currentUser?.email || 'No user');
            console.log('👤 User UID:', this.currentUser?.uid || 'No UID');
            
            if (!this.currentUser) {
                throw new Error('Aucun utilisateur authentifié');
            }

            // Get user role from Firestore
            console.log('🗄️ Fetching user document from Firestore...');
            const userDoc = await window.db.collection('users').doc(this.currentUser.uid).get();
            console.log('🗄️ User document exists:', userDoc.exists);
            
            if (!userDoc.exists) {
                console.error('❌ User document does not exist for UID:', this.currentUser.uid);
                throw new Error('Document utilisateur non trouvé');
            }

            const userData = userDoc.data();
            console.log('🗄️ User data from Firestore:', userData);
            
            this.userRole = userData.role;
            console.log('👑 User role assigned:', this.userRole);

            // Get system configuration
            console.log('⚙️ Getting system configuration...');
            if (window.systemConfig) {
                this.systemConfig = window.systemConfig.getConfig();
                console.log('⚙️ System config loaded:', !!this.systemConfig);
                console.log('⚙️ Available roles in config:', Object.keys(this.systemConfig?.permissions || {}));
            } else {
                console.warn('⚠️ window.systemConfig not available');
            }

            this.initialized = true;
            console.log('✅ Member permissions initialized for role:', this.userRole);
            
        } catch (error) {
            console.error('❌ Failed to initialize member permissions:', error);
            console.error('❌ Error stack:', error.stack);
            throw error;
        }
    }

    // Wait for authentication to be ready
    async waitForAuth() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Délai d\'authentification dépassé'));
            }, 3000); // FIXED: 3 seconds instead of 30 seconds
            
            const checkAuth = () => {
                if (window.auth && window.db) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    setTimeout(checkAuth, 100);
                }
            };
            
            checkAuth();
        });
    }

    // Check if user has a specific permission
    hasPermission(permission) {
        if (!this.initialized) {
            console.warn('⚠️ Member permissions not initialized');
            return false;
        }

        console.log(`🔍 Checking permission '${permission}' for role '${this.userRole}'`);
        console.log('🔍 System config available:', !!this.systemConfig);
        
        // Check role-based permissions from system config
        const rolePermissions = this.systemConfig?.permissions?.[this.userRole];
        console.log(`🔍 Role permissions for '${this.userRole}':`, rolePermissions);
        
        // If role permissions exist, use them (don't fall back to global settings)
        if (rolePermissions && rolePermissions.hasOwnProperty(permission)) {
            const result = rolePermissions[permission] === true;
            console.log(`✅ Permission '${permission}' for role '${this.userRole}': ${result}`);
            return result;
        }

        console.log(`⚠️ Permission '${permission}' not found in role '${this.userRole}', checking fallbacks`);

        // Only fall back to global settings for system-wide permissions that aren't role-specific
        const memberManagement = this.systemConfig?.memberManagement;
        if (memberManagement) {
            switch (permission) {
                case 'canDeleteMembers':
                    // Only check global setting if role doesn't have this permission defined
                    return memberManagement.allowMemberDeletion === true;
                case 'canImportMembers':
                    return memberManagement.allowExcelImport === true;
                case 'canModifyMembers':
                    return memberManagement.allowMemberModification === true;
                case 'canCreateMembers':
                    return memberManagement.allowMemberCreation === true;
                case 'canManageMemberAvatars':
                    return memberManagement.allowAvatarManagement === true;
                // REMOVED: canViewMemberDetails fallback - this should ONLY be role-based
            }
        }

        console.log(`❌ Permission '${permission}' denied - no fallback available`);
        return false;
    }

    // Check if user can delete members
    canDeleteMembers() {
        return this.hasPermission('canDeleteMembers');
    }

    // Check if user can import members from Excel
    canImportMembers() {
        return this.hasPermission('canImportMembers');
    }

    // Check if user can modify member information
    canModifyMembers() {
        return this.hasPermission('canModifyMembers');
    }

    // Check if user can create new members
    canCreateMembers() {
        return this.hasPermission('canCreateMembers');
    }

    // Check if user can manage member avatars
    canManageMemberAvatars() {
        return this.hasPermission('canManageMemberAvatars');
    }

    // Check if user can view member details
    canViewMemberDetails() {
        return this.hasPermission('canViewMemberDetails');
    }

    // Check if user can bulk delete members
    canBulkDeleteMembers() {
        return this.hasPermission('canBulkDeleteMembers');
    }

    // Check if user requires approval for deletion
    requiresApprovalForDeletion() {
        if (!this.initialized) return true;
        
        const memberManagement = this.systemConfig?.memberManagement;
        return memberManagement?.requireApprovalForDeletion === true;
    }

    // Get the user's role
    getUserRole() {
        return this.userRole;
    }

    // Check if user is admin or higher
    isAdmin() {
        return ['admin', 'superAdmin'].includes(this.userRole);
    }

    // Check if user is super admin
    isSuperAdmin() {
        return this.userRole === 'superAdmin';
    }

    // Get maximum members per user
    getMaxMembersPerUser() {
        const memberManagement = this.systemConfig?.memberManagement;
        return memberManagement?.maxMembersPerUser || 1000;
    }
}

// Create global instance
window.memberPermissions = new MemberPermissions();

// Utility functions for easy access
window.checkMemberPermission = async function(permission) {
    if (!window.memberPermissions.initialized) {
        try {
            await window.memberPermissions.initialize();
        } catch (error) {
                            console.error('Échec de l\'initialisation des permissions de membre:', error);
            return false;
        }
    }
    return window.memberPermissions.hasPermission(permission);
};

window.canDeleteMembers = async function() {
    if (!window.memberPermissions.initialized) {
        await window.memberPermissions.initialize();
    }
    return window.memberPermissions.canDeleteMembers();
};

window.canImportMembers = async function() {
    if (!window.memberPermissions.initialized) {
        await window.memberPermissions.initialize();
    }
    return window.memberPermissions.canImportMembers();
};

window.canModifyMembers = async function() {
    if (!window.memberPermissions.initialized) {
        await window.memberPermissions.initialize();
    }
    return window.memberPermissions.canModifyMembers();
};

window.canCreateMembers = async function() {
    if (!window.memberPermissions.initialized) {
        await window.memberPermissions.initialize();
    }
    return window.memberPermissions.canCreateMembers();
};

window.canManageMemberAvatars = async function() {
    if (!window.memberPermissions.initialized) {
        await window.memberPermissions.initialize();
    }
    return window.memberPermissions.canManageMemberAvatars();
};

window.canViewMemberDetails = async function() {
    if (!window.memberPermissions.initialized) {
        await window.memberPermissions.initialize();
    }
    return window.memberPermissions.canViewMemberDetails();
};

// Debug function to check permission status
window.debugMemberPermissions = async function() {
    console.log('🔍 === MEMBER PERMISSIONS DEBUG ===');
    
    try {
        if (!window.memberPermissions.initialized) {
            console.log('⚠️ Permissions not initialized, initializing now...');
            await window.memberPermissions.initialize();
        }
        
        const mp = window.memberPermissions;
        console.log('👤 Current user:', mp.currentUser?.email);
        console.log('👑 User role:', mp.userRole);
        console.log('⚙️ System config available:', !!mp.systemConfig);
        
        if (mp.systemConfig?.permissions) {
            console.log('📋 Available roles:', Object.keys(mp.systemConfig.permissions));
            console.log(`🔑 Permissions for role '${mp.userRole}':`, mp.systemConfig.permissions[mp.userRole]);
        }
        
        // Test all member permissions
        const permissions = [
            'canViewMemberDetails',
            'canModifyMembers',
            'canDeleteMembers',
            'canImportMembers',
            'canCreateMembers',
            'canManageMemberAvatars'
        ];
        
        console.log('🧪 Testing permissions:');
        for (const perm of permissions) {
            const result = mp.hasPermission(perm);
            console.log(`  ${perm}: ${result ? '✅' : '❌'}`);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
    
    console.log('🔍 === END DEBUG ===');
};

console.log('📋 Member permissions utility loaded'); 