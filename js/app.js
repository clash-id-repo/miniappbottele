// ============================================
// js/app.js - Main Application Logic (FIXED)
// ============================================

// Telegram Web App
const tg = window.Telegram.WebApp;

// App State
const AppState = {
    user: null,
    files: [],
    filteredFiles: [],
    currentFilter: 'all',
    currentView: 'grid',
    currentSort: 'date-desc',
    searchQuery: '',
    selectedFile: null,
    isLoading: false
};

// ============================================
// INITIALIZE APP
// ============================================

async function initApp() {
    try {
        console.log('[APP] Initializing...');
        
        // Initialize Telegram Web App
        tg.ready();
        tg.expand();
        
        console.log('[APP] Telegram WebApp initialized');
        
        // Apply Telegram theme
        applyTheme();
        
        // Get user data from Telegram
        const telegramUser = tg.initDataUnsafe?.user;
        
        if (telegramUser) {
            AppState.user = {
                id: telegramUser.id,
                firstName: telegramUser.first_name || 'User',
                username: telegramUser.username || 'anonymous',
                isPremium: telegramUser.is_premium || false
            };
            
            console.log('[APP] User detected:', AppState.user);
            console.log('[APP] User ID:', AppState.user.id);
            
        } else {
            // Fallback untuk development/testing
            console.warn('[APP] No Telegram user data, using demo user');
            AppState.user = {
                id: 123456789,
                firstName: 'Demo User',
                username: 'demouser',
                isPremium: false
            };
            
            // Set mock mode jika tidak ada user
            API.setConfig({ useMock: true });
        }
        
        // Update UI dengan user info
        updateUserInfo();
        
        // Test API connection
        console.log('[APP] Testing API connection...');
        const isConnected = await testAPIConnection();
        
        if (!isConnected) {
            console.warn('[APP] API not available, switching to mock mode');
            API.setConfig({ useMock: true });
            utils.showToast('Using offline mode', 'info');
        } else {
            console.log('[APP] API connected successfully');
        }
        
        // Load files
        await loadFiles();
        
        // Setup event listeners
        setupEventListeners();
        
        // Hide loading, show app
        hideLoading();
        
        console.log('[APP] Initialization complete');
        
    } catch (error) {
        console.error('[APP] Init error:', error);
        utils.showToast('Failed to initialize app', 'error');
        
        // Fallback ke mock mode
        API.setConfig({ useMock: true });
        hideLoading();
    }
}

// ============================================
// API CONNECTION TEST
// ============================================

async function testAPIConnection() {
    try {
        const result = await API.healthCheck();
        return result.status === 'ok';
    } catch (error) {
        console.error('[APP] API connection test failed:', error);
        return false;
    }
}

// ============================================
// APPLY TELEGRAM THEME
// ============================================

function applyTheme() {
    const root = document.documentElement;
    
    if (tg.themeParams) {
        if (tg.themeParams.bg_color) {
            root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
        }
        if (tg.themeParams.text_color) {
            root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
        }
        if (tg.themeParams.hint_color) {
            root.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color);
        }
        if (tg.themeParams.link_color) {
            root.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color);
        }
        if (tg.themeParams.button_color) {
            root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
        }
        
        console.log('[APP] Theme applied');
    }
}

// ============================================
// UPDATE USER INFO
// ============================================

function updateUserInfo() {
    const usernameEl = document.getElementById('username');
    const badgeEl = document.querySelector('.badge');
    
    if (usernameEl) {
        usernameEl.textContent = AppState.user.firstName;
    }
    
    if (badgeEl && AppState.user.isPremium) {
        badgeEl.textContent = '💎 Premium';
        badgeEl.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    
    console.log('[APP] User info updated');
}

// ============================================
// LOAD FILES
// ============================================

async function loadFiles() {
    if (AppState.isLoading) return;
    
    try {
        AppState.isLoading = true;
        
        console.log('[APP] Loading files for user:', AppState.user.id);
        
        document.getElementById('files-loading').style.display = 'block';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('files-container').innerHTML = '';
        
        const response = await API.getUserFiles(AppState.user.id);
        
        console.log('[APP] Files loaded:', response);
        
        if (response.success) {
            AppState.files = response.files || [];
            
            if (response.stats) {
                updateStats(response.stats);
            }
            
            filterAndRenderFiles();
            
            console.log('[APP] Total files:', AppState.files.length);
        } else {
            throw new Error(response.error || 'Failed to load files');
        }
        
    } catch (error) {
        console.error('[APP] Error loading files:', error);
        utils.showToast('Failed to load files: ' + error.message, 'error');
        showEmptyState('Failed to load files. Please try again.');
    } finally {
        AppState.isLoading = false;
        document.getElementById('files-loading').style.display = 'none';
    }
}

// ============================================
// UPDATE STATS
// ============================================

function updateStats(stats) {
    const totalEl = document.getElementById('total-files');
    const storageEl = document.getElementById('storage-used');
    const quotaEl = document.getElementById('quota-left');
    
    if (totalEl) totalEl.textContent = stats.total || 0;
    if (storageEl) storageEl.textContent = utils.formatSize(stats.storage || 0);
    if (quotaEl) quotaEl.textContent = stats.quota || 0;
    
    console.log('[APP] Stats updated:', stats);
}

// ============================================
// FILTER AND RENDER FILES
// ============================================

function filterAndRenderFiles() {
    let filtered = [...AppState.files];
    
    // Apply type filter
    filtered = API.filterFiles(filtered, AppState.currentFilter);
    
    // Apply search
    filtered = API.searchFiles(filtered, AppState.searchQuery);
    
    // Apply sort
    filtered = API.sortFiles(filtered, AppState.currentSort);
    
    AppState.filteredFiles = filtered;
    renderFiles();
    
    console.log('[APP] Filtered files:', filtered.length);
}

// ============================================
// RENDER FILES
// ============================================

function renderFiles() {
    const container = document.getElementById('files-container');
    const emptyState = document.getElementById('empty-state');
    
    if (AppState.filteredFiles.length === 0) {
        container.innerHTML = '';
        const message = AppState.searchQuery 
            ? `No files found for "${AppState.searchQuery}"`
            : AppState.currentFilter !== 'all'
            ? `No ${AppState.currentFilter} files`
            : 'No files yet. Start uploading!';
        showEmptyState(message);
        return;
    }
    
    emptyState.style.display = 'none';
    container.className = `files-container ${AppState.currentView}-view`;
    
    container.innerHTML = AppState.filteredFiles.map(file => `
        <div class="file-card" onclick="openFilePreview('${file.code}')">
            <div class="file-thumbnail">
                ${file.thumbnail 
                    ? `<img src="${file.thumbnail}" alt="${file.name}" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='${utils.getFileIcon(file.type)}'">` 
                    : utils.getFileIcon(file.type)
                }
            </div>
            <div class="file-info">
                <div class="file-name" title="${file.name}">${file.name}</div>
                <div class="file-meta">
                    <span>${utils.formatSize(file.size)}</span>
                    <span>${utils.formatDate(file.date)}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('[APP] Rendered', AppState.filteredFiles.length, 'files');
}

// ============================================
// SHOW EMPTY STATE
// ============================================

function showEmptyState(message) {
    const emptyState = document.getElementById('empty-state');
    const emptyMessage = document.getElementById('empty-message');
    
    if (emptyMessage) {
        emptyMessage.textContent = message;
    }
    if (emptyState) {
        emptyState.style.display = 'block';
    }
}

// ============================================
// OPEN FILE PREVIEW
// ============================================

async function openFilePreview(code) {
    try {
        console.log('[APP] Opening file preview:', code);
        
        const response = await API.getFile(code);
        
        if (response.success && response.file) {
            AppState.selectedFile = response.file;
            showFileModal(response.file);
        } else {
            utils.showToast('File not found', 'error');
        }
    } catch (error) {
        console.error('[APP] Error opening file:', error);
        utils.showToast('Failed to load file', 'error');
    }
}

// ============================================
// SHOW FILE MODAL
// ============================================

function showFileModal(file) {
    const modal = document.getElementById('file-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (modalTitle) {
        modalTitle.textContent = file.name;
    }
    
    if (modalBody) {
        modalBody.innerHTML = `
            <div style="text-align: center;">
                ${file.thumbnail 
                    ? `<img src="${file.thumbnail}" style="max-width: 100%; border-radius: 8px; margin-bottom: 20px;" onerror="this.style.display='none'">` 
                    : `<div style="font-size: 80px; margin: 40px 0;">${utils.getFileIcon(file.type)}</div>`
                }
                <h3 style="margin-bottom: 12px;">${file.name}</h3>
                <div style="color: #999; margin-bottom: 20px;">
                    <p>Type: ${file.type}</p>
                    <p>Size: ${utils.formatSize(file.size)}</p>
                    <p>Uploaded: ${utils.formatDate(file.date)}</p>
                </div>
                <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; font-size: 12px; color: #666;">File Code</p>
                    <code style="background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 8px; font-weight: 600;">${file.code}</code>
                </div>
            </div>
        `;
    }
    
    if (modal) {
        modal.classList.add('show');
        tg.BackButton.show();
        tg.BackButton.onClick(closeModal);
    }
    
    console.log('[APP] File modal opened:', file.code);
}

// ============================================
// CLOSE MODAL
// ============================================

function closeModal() {
    const modal = document.getElementById('file-modal');
    if (modal) {
        modal.classList.remove('show');
    }
    tg.BackButton.hide();
    tg.BackButton.offClick(closeModal);
}

// ============================================
// DOWNLOAD FILE
// ============================================

function downloadFile() {
    if (AppState.selectedFile) {
        // Send download command to bot via Telegram
        const downloadData = JSON.stringify({
            action: 'download',
            code: AppState.selectedFile.code
        });
        
        try {
            tg.sendData(downloadData);
            utils.showToast('Download request sent to bot', 'success');
            closeModal();
        } catch (error) {
            console.error('[APP] Error sending download request:', error);
            utils.showToast('Failed to send download request', 'error');
        }
    }
}

// ============================================
// CLOSE APP
// ============================================

function closeApp() {
    tg.close();
}

// ============================================
// SETUP EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', utils.debounce((e) => {
            AppState.searchQuery = e.target.value;
            if (btnClearSearch) {
                btnClearSearch.style.display = e.target.value ? 'flex' : 'none';
            }
            filterAndRenderFiles();
        }, 300));
    }
    
    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            AppState.searchQuery = '';
            btnClearSearch.style.display = 'none';
            filterAndRenderFiles();
        });
    }
    
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            AppState.currentFilter = tab.dataset.filter;
            filterAndRenderFiles();
        });
    });
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.currentView = btn.dataset.view;
            renderFiles();
        });
    });
    
    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            AppState.currentSort = e.target.value;
            filterAndRenderFiles();
        });
    }
    
    console.log('[APP] Event listeners setup complete');
}

// ============================================
// HIDE LOADING SCREEN
// ============================================

function hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const appContainer = document.getElementById('app');
    
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
    if (appContainer) {
        appContainer.style.display = 'block';
    }
    
    console.log('[APP] Loading screen hidden');
}

// ============================================
// MAKE FUNCTIONS GLOBAL
// ============================================

window.openFilePreview = openFilePreview;
window.closeModal = closeModal;
window.downloadFile = downloadFile;
window.closeApp = closeApp;

// ============================================
// INITIALIZE ON DOM READY
// ============================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Log app version
console.log('[APP] Clash Media Mini App v1.0.0');
console.log('[APP] Environment:', window.location.hostname);
