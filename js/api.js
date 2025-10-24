// ============================================
// API Handler - Complete Version
// ============================================

const API = {
    // ============================================
    // CONFIGURATION
    // ============================================
    
    // Base URL - Ganti dengan URL bot server Anda
    //baseUrl: 'http://localhost:8080/api',  // Development
     baseUrl: 'https://37551c27b8d5.ngrok-free.app/api',  // Production
    
    // Timeout untuk request (ms)
    timeout: 30000,
    
    // Mock mode untuk development/testing
    useMock: false,  // Set true untuk pakai mock data
    
    
    // ============================================
    // MOCK DATA (untuk testing tanpa backend)
    // ============================================
    
    mockFiles: [
        {
            code: 'abc123',
            type: 'photo',
            name: 'Beach Photo.jpg',
            size: 2621440,
            date: '2025-10-22T10:30:00',
            thumbnail: 'https://via.placeholder.com/300x200/4CAF50/ffffff?text=Photo',
            url: 'https://example.com/photo.jpg',
            tags: ['beach', 'vacation']
        },
        {
            code: 'def456',
            type: 'video',
            name: 'Tutorial Video.mp4',
            size: 15728640,
            date: '2025-10-21T15:20:00',
            thumbnail: 'https://via.placeholder.com/300x200/2196F3/ffffff?text=Video',
            url: 'https://example.com/video.mp4',
            tags: ['tutorial', 'coding']
        },
        {
            code: 'ghi789',
            type: 'document',
            name: 'Report.pdf',
            size: 1887436,
            date: '2025-10-20T08:15:00',
            thumbnail: null,
            url: 'https://example.com/report.pdf',
            tags: ['work', 'report']
        },
        {
            code: 'jkl012',
            type: 'audio',
            name: 'Podcast Episode 1.mp3',
            size: 5242880,
            date: '2025-10-19T14:45:00',
            thumbnail: null,
            url: 'https://example.com/audio.mp3',
            tags: ['podcast', 'audio']
        }
    ],
    
    
    // ============================================
    // CORE API METHODS
    // ============================================
    
    /**
     * Get all files for a user
     * @param {number} userId - Telegram user ID
     * @returns {Promise<Object>} Response with files and stats
     */
    async getUserFiles(userId) {
        // Mock mode
        if (this.useMock) {
            console.log('[API] Using mock data');
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        files: this.mockFiles,
                        stats: {
                            total: this.mockFiles.length,
                            storage: this.mockFiles.reduce((sum, f) => sum + f.size, 0),
                            quota: 10
                        }
                    });
                }, 1000);
            });
        }
        
        // Real API call
        try {
            console.log(`[API] Fetching files for user ${userId}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(`${this.baseUrl}/files?user_id=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log(`[API] Received ${data.files?.length || 0} files`);
            
            return data;
            
        } catch (error) {
            console.error('[API] Error fetching files:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    },
    
    
    /**
     * Get single file by code
     * @param {string} code - File code
     * @returns {Promise<Object>} Response with file details
     */
    async getFile(code) {
        // Mock mode
        if (this.useMock) {
            return new Promise(resolve => {
                setTimeout(() => {
                    const file = this.mockFiles.find(f => f.code === code);
                    resolve({
                        success: !!file,
                        file: file || null
                    });
                }, 500);
            });
        }
        
        // Real API call
        try {
            console.log(`[API] Fetching file: ${code}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(`${this.baseUrl}/file/${code}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return {
                        success: false,
                        error: 'File not found'
                    };
                }
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`[API] File fetched: ${data.file?.name}`);
            
            return data;
            
        } catch (error) {
            console.error('[API] Error fetching file:', error);
            throw error;
        }
    },
    
    
    /**
     * Delete file
     * @param {string} code - File code
     * @returns {Promise<Object>} Response
     */
    async deleteFile(code) {
        // Mock mode
        if (this.useMock) {
            return new Promise(resolve => {
                setTimeout(() => {
                    const index = this.mockFiles.findIndex(f => f.code === code);
                    if (index !== -1) {
                        this.mockFiles.splice(index, 1);
                    }
                    resolve({ success: true });
                }, 500);
            });
        }
        
        // Real API call
        try {
            console.log(`[API] Deleting file: ${code}`);
            
            const response = await fetch(`${this.baseUrl}/file/${code}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[API] File deleted successfully');
            
            return data;
            
        } catch (error) {
            console.error('[API] Error deleting file:', error);
            throw error;
        }
    },
    
    
    /**
     * Health check
     * @returns {Promise<Object>} Server status
     */
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            
            if (!response.ok) {
                return {
                    status: 'error',
                    message: `HTTP ${response.status}`
                };
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('[API] Health check failed:', error);
            return {
                status: 'error',
                message: error.message
            };
        }
    },
    
    
    // ============================================
    // CLIENT-SIDE FILTERING & SORTING
    // ============================================
    
    /**
     * Search files by query
     * @param {Array} files - Files array
     * @param {string} query - Search query
     * @returns {Array} Filtered files
     */
    searchFiles(files, query) {
        if (!query || !query.trim()) {
            return files;
        }
        
        query = query.toLowerCase().trim();
        
        return files.filter(file => {
            const name = (file.name || '').toLowerCase();
            const code = (file.code || '').toLowerCase();
            const tags = (file.tags || []).join(' ').toLowerCase();
            
            return name.includes(query) || 
                   code.includes(query) || 
                   tags.includes(query);
        });
    },
    
    
    /**
     * Filter files by type
     * @param {Array} files - Files array
     * @param {string} type - File type (all, photo, video, document, audio)
     * @returns {Array} Filtered files
     */
    filterFiles(files, type) {
        if (type === 'all') {
            return files;
        }
        
        return files.filter(file => file.type === type);
    },
    
    
    /**
     * Sort files
     * @param {Array} files - Files array
     * @param {string} sortBy - Sort method
     * @returns {Array} Sorted files
     */
    sortFiles(files, sortBy) {
        const sorted = [...files];
        
        switch(sortBy) {
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            case 'name-asc':
                return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            
            case 'name-desc':
                return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            
            case 'size-desc':
                return sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
            
            case 'size-asc':
                return sorted.sort((a, b) => (a.size || 0) - (b.size || 0));
            
            default:
                return sorted;
        }
    },
    
    
    /**
     * Get files by tag
     * @param {Array} files - Files array
     * @param {string} tag - Tag name
     * @returns {Array} Filtered files
     */
    getFilesByTag(files, tag) {
        if (!tag) {
            return files;
        }
        
        tag = tag.toLowerCase();
        
        return files.filter(file => {
            const tags = file.tags || [];
            return tags.some(t => t.toLowerCase() === tag);
        });
    },
    
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    /**
     * Test API connection
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        try {
            const result = await this.healthCheck();
            return result.status === 'ok';
        } catch (error) {
            console.error('[API] Connection test failed:', error);
            return false;
        }
    },
    
    
    /**
     * Get API configuration
     * @returns {Object} Current config
     */
    getConfig() {
        return {
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            useMock: this.useMock
        };
    },
    
    
    /**
     * Set API configuration
     * @param {Object} config - New configuration
     */
    setConfig(config) {
        if (config.baseUrl) this.baseUrl = config.baseUrl;
        if (config.timeout) this.timeout = config.timeout;
        if (typeof config.useMock === 'boolean') this.useMock = config.useMock;
        
        console.log('[API] Config updated:', this.getConfig());
    }
};

// Export to global scope
window.API = API;

// Auto-detect environment
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API.baseUrl = 'http://localhost:8080/api';
    console.log('[API] Development mode detected');
} else {
    // Production - ganti dengan domain Anda
    API.baseUrl = 'https://your-domain.com/api';
    console.log('[API] Production mode');
}

// Log API status on load
console.log('[API] API Handler initialized');
console.log('[API] Base URL:', API.baseUrl);
console.log('[API] Mock mode:', API.useMock ? 'ON' : 'OFF');
