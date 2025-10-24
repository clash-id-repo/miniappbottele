// API Handler
const API = {
    baseUrl: 'YOUR_BOT_API_URL', // Ganti dengan URL bot Anda
    
    // Mock data (untuk development/testing)
    mockFiles: [
        {
            code: 'abc123',
            type: 'photo',
            name: 'Beach Photo.jpg',
            size: 2621440,
            date: '2025-10-22T10:30:00',
            thumbnail: 'https://via.placeholder.com/300x200/4CAF50/ffffff?text=Photo',
            url: 'https://example.com/photo.jpg'
        },
        {
            code: 'def456',
            type: 'video',
            name: 'Tutorial Video.mp4',
            size: 15728640,
            date: '2025-10-21T15:20:00',
            thumbnail: 'https://via.placeholder.com/300x200/2196F3/ffffff?text=Video',
            url: 'https://example.com/video.mp4'
        },
        {
            code: 'ghi789',
            type: 'document',
            name: 'Report.pdf',
            size: 1887436,
            date: '2025-10-20T08:15:00',
            thumbnail: null,
            url: 'https://example.com/report.pdf'
        },
        {
            code: 'jkl012',
            type: 'audio',
            name: 'Podcast Episode 1.mp3',
            size: 5242880,
            date: '2025-10-19T14:45:00',
            thumbnail: null,
            url: 'https://example.com/audio.mp3'
        }
    ],

    // Get user files
    async getUserFiles(userId) {
        try {
            // Untuk production, uncomment ini:
            /*
            const response = await fetch(`${this.baseUrl}/api/files?user_id=${userId}`);
            if (!response.ok) throw new Error('Failed to fetch files');
            return await response.json();
            */
            
            // Development mode: return mock data
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
        } catch (error) {
            console.error('Error fetching files:', error);
            throw error;
        }
    },

    // Get file by code
    async getFile(code) {
        try {
            // Production:
            /*
            const response = await fetch(`${this.baseUrl}/api/file/${code}`);
            if (!response.ok) throw new Error('File not found');
            return await response.json();
            */
            
            // Development:
            return new Promise(resolve => {
                setTimeout(() => {
                    const file = this.mockFiles.find(f => f.code === code);
                    resolve({
                        success: true,
                        file: file || null
                    });
                }, 500);
            });
        } catch (error) {
            console.error('Error fetching file:', error);
            throw error;
        }
    },

    // Delete file
    async deleteFile(code) {
        try {
            // Production:
            /*
            const response = await fetch(`${this.baseUrl}/api/file/${code}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete');
            return await response.json();
            */
            
            // Development:
            return new Promise(resolve => {
                setTimeout(() => {
                    const index = this.mockFiles.findIndex(f => f.code === code);
                    if (index !== -1) {
                        this.mockFiles.splice(index, 1);
                    }
                    resolve({ success: true });
                }, 500);
            });
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    },

    // Search files
    searchFiles(files, query) {
        if (!query) return files;
        query = query.toLowerCase();
        return files.filter(file => 
            file.name.toLowerCase().includes(query) ||
            file.code.toLowerCase().includes(query)
        );
    },

    // Filter files by type
    filterFiles(files, type) {
        if (type === 'all') return files;
        return files.filter(file => file.type === type);
    },

    // Sort files
    sortFiles(files, sortBy) {
        const sorted = [...files];
        switch(sortBy) {
            case 'date-desc':
                return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
            case 'date-asc':
                return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            case 'size-desc':
                return sorted.sort((a, b) => b.size - a.size);
            case 'size-asc':
                return sorted.sort((a, b) => a.size - b.size);
            default:
                return sorted;
        }
    }
};

// Export to global scope
window.API = API;
