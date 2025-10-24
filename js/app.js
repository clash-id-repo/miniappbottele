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
    selectedFile: null
};

// Initialize App
async function initApp() {
    try {
        // Initialize Telegram Web App
        tg.ready();
        tg.expand();
        
        // Apply Telegram theme
        applyTheme();
        
        // Get user data
        AppState.user = tg.initDataUnsafe.user || {
            id: 123456,
            first_name: 'Demo User',
            username: 'demouser'
        };
        
        // Update UI
        updateUserInfo();
        
        // Load files
        await loadFiles();
        
        // Setup event listeners
        setupEventListeners();
        
        // Hide loading, show app
        hideLoading();
        
    } catch (error) {
        console.error('Init error:', error);
        utils.showToast('Failed to initialize app', 'error');
    }
}

// Apply Telegram Theme
function applyTheme() {
    const root = document.documentElement;
    if (tg.themeParams) {
        root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
        root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
        root.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
        root.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
        root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
    }
}

// Update User Info
function updateUserInfo() {
    document.getElementById('username').textContent = AppState.user.first_name;
    // Premium badge will be updated after loading files
}

// Load Files
async function loadFiles() {
    try {
        document.getElementById('files-loading').style.display = 'block';
        document.getElementById('empty-state').style.display = 'none';
        document.getElementById('files-container').innerHTML = '';
        
        const response = await API.getUserFiles(AppState.user.id);
        
        if (response.success) {
            AppState.files = response.files;
            updateStats(response.stats);
            filterAndRenderFiles();
        }
        
    } catch (error) {
        console.error('Load files error:', error);
        utils.showToast('Failed to load files', 'error');
        showEmptyState('Failed to load files. Please try again.');
    } finally {
        document.getElementById('files-loading').style.display = 'none';
    }
}

// Update Stats
function updateStats(stats) {
    document.getElementById('total-files').textContent = stats.total;
    document.getElementById('storage-used').textContent = utils.formatSize(stats.storage);
    document.getElementById('quota-left').textContent = stats.quota;
}

// Filter and Render Files
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
}

// Render Files
function renderFiles() {
    const container = document.getElementById('files-container');
    const emptyState = document.getElementById('empty-state');
    
    if (AppState.filteredFiles.length === 0) {
        container.innerHTML = '';
        const message = AppState.searchQuery 
            ? `No files found for "${AppState.searchQuery}"`
            : 'No files in this category';
        showEmptyState(message);
        return;
    }
    
    emptyState.style.display = 'none';
    container.className = `files-container ${AppState.currentView}-view`;
    
    container.innerHTML = AppState.filteredFiles.map(file => `
        <div class="file-card" onclick="openFilePreview('${file.code}')">
            <div class="file-thumbnail">
                ${file.thumbnail 
                    ? `<img src="${file.thumbnail}" alt="${file.name}" loading="lazy">` 
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
}

// Show Empty State
function showEmptyState(message) {
    const emptyState = document.getElementById('empty-state');
    const emptyMessage = document.getElementById('empty-message');
    emptyMessage.textContent = message;
    emptyState.style.display = 'block';
}

// Open File Preview
async function openFilePreview(code) {
    try {
        const response = await API.getFile(code);
        if (response.success && response.file) {
            AppState.selectedFile = response.file;
            showFileModal(response.file);
        }
    } catch (error) {
        utils.showToast('Failed to load file', 'error');
    }
}

// Show File Modal
function showFileModal(file) {
    const modal = document.getElementById('file-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = file.name;
    
    modalBody.innerHTML = `
        <div style="text-align: center;">
            ${file.thumbnail 
                ? `<img src="${file.thumbnail}" style="max-width: 100%; border-radius: 8px; margin-bottom: 20px;">` 
                : `<div style="font-size: 80px; margin: 40px 0;">${utils.getFileIcon(file.type)}</div>`
            }
            <h3 style="margin-bottom: 12px;">${file.name}</h3>
            <div style="color: #999; margin-bottom: 20px;">
                <p>Size: ${utils.formatSize(file.size)}</p>
                <p>Uploaded: ${utils.formatDate(file.date)}</p>
            </div>
            <div style="background: #f5f5f5; padding: 12px; border-radius: 8px; margin-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #666;">File Code</p>
                <code style="background: white; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 8px; font-weight: 600;">${file.code}</code>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    tg.BackButton.show();
    tg.BackButton.onClick(() => closeModal());
}

// Close Modal
function closeModal() {
    const modal = document.getElementById('file-modal');
    modal.classList.remove('show');
    tg.BackButton.hide();
}

// Download File
function downloadFile() {
    if (AppState.selectedFile) {
        // Send download command to bot
        tg.sendData(JSON.stringify({
            action: 'download',
            code: AppState.selectedFile.code
        }));
        utils.showToast('Download started in bot...', 'success');
        closeModal();
    }
}

// Close App
function closeApp() {
    tg.close();
}

// Setup Event Listeners
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    const btnClearSearch = document.getElementById('btn-clear-search');
    
    searchInput.addEventListener('input', utils.debounce((e) => {
        AppState.searchQuery = e.target.value;
        btnClearSearch.style.display = e.target.value ? 'flex' : 'none';
        filterAndRenderFiles();
    }, 300));
    
    btnClearSearch.addEventListener('click', () => {
        searchInput.value = '';
        AppState.searchQuery = '';
        btnClearSearch.style.display = 'none';
        filterAndRenderFiles();
    });
    
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
    document.getElementById('sort-select').addEventListener('change', (e) => {
        AppState.currentSort = e.target.value;
        filterAndRenderFiles();
    });
}

// Hide Loading Screen
function hideLoading() {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
}

// Make functions global
window.openFilePreview = openFilePreview;
window.closeModal = closeModal;
window.downloadFile = downloadFile;
window.closeApp = closeApp;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
