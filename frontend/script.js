// Configuration
const CONFIG = {
    // Your Railway API URL
    API_BASE_URL: 'https://airdrop-api-only-production.up.railway.app/api/airdrop',
    
    // Network configuration
    NETWORK: {
        name: 'Gnosis Chain',
        chainId: 100,
        blockExplorer: 'https://gnosis.blockscout.com'
    },
    
    // Token configuration
    TOKEN: {
        symbol: 'wxHOPR',
        decimals: 18,
        amount: '0.01'
    }
};

// DOM Elements
const elements = {
    form: document.getElementById('airdropForm'),
    recipientAddress: document.getElementById('recipientAddress'),
    hash: document.getElementById('hash'),
    claimBtn: document.getElementById('claimBtn'),
    spinner: document.getElementById('spinner'),
    btnText: document.getElementById('btnText'),
    result: document.getElementById('result'),
    resultIcon: document.getElementById('resultIcon'),
    resultTitle: document.getElementById('resultTitle'),
    resultMessage: document.getElementById('resultMessage'),
    resultDetails: document.getElementById('resultDetails'),
    networkStatus: document.getElementById('networkStatus')
};

// State management
const state = {
    isLoading: false,
    apiStatus: null
};

// Utility Functions
const utils = {
    /**
     * Validate Ethereum address format
     */
    isValidEthereumAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    },

    /**
     * Validate hash format (non-empty string)
     */
    isValidHash(hash) {
        return hash && hash.trim().length > 0;
    },

    /**
     * Show error message for input field
     */
    showError(fieldName, message) {
        const input = elements[fieldName];
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (input) {
            input.classList.add('error');
        }
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    },

    /**
     * Clear error message for input field
     */
    clearError(fieldName) {
        const input = elements[fieldName];
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (input) {
            input.classList.remove('error');
        }
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    },

    /**
     * Clear all error messages
     */
    clearAllErrors() {
        this.clearError('recipientAddress');
        this.clearError('hash');
    },

    /**
     * Format wei amount to decimal
     */
    formatTokenAmount(amountWei) {
        try {
            const amount = parseFloat(amountWei) / Math.pow(10, CONFIG.TOKEN.decimals);
            return amount.toFixed(4);
        } catch (error) {
            return CONFIG.TOKEN.amount;
        }
    },

    /**
     * Create transaction link
     */
    createTxLink(txHash) {
        return `${CONFIG.NETWORK.blockExplorer}/tx/${txHash}`;
    },

    /**
     * Scroll element into view smoothly
     */
    scrollToElement(element) {
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest',
                inline: 'start'
            });
        }
    }
};

// UI Management
const ui = {
    /**
     * Set loading state
     */
    setLoading(loading) {
        state.isLoading = loading;
        
        if (elements.claimBtn) {
            elements.claimBtn.disabled = loading;
            elements.claimBtn.classList.toggle('loading', loading);
        }
        
        if (elements.spinner) {
            elements.spinner.style.display = loading ? 'inline-block' : 'none';
        }
        
        if (elements.btnText) {
            elements.btnText.innerHTML = loading ? 
                '<i class="fas fa-spinner fa-spin"></i> Processing...' : 
                '<i class="fas fa-gift"></i> Claim Airdrop';
        }
    },

    /**
     * Show result message
     */
    showResult(success, title, message, details = null) {
        if (!elements.result) return;

        // Update content
        if (elements.resultIcon) {
            elements.resultIcon.innerHTML = success ? 
                '<i class="fas fa-check-circle"></i>' : 
                '<i class="fas fa-exclamation-circle"></i>';
        }
        
        if (elements.resultTitle) {
            elements.resultTitle.textContent = title;
        }
        
        if (elements.resultMessage) {
            elements.resultMessage.textContent = message;
        }
        
        if (elements.resultDetails) {
            elements.resultDetails.innerHTML = details || '';
        }

        // Update styling
        elements.result.className = `result ${success ? 'success' : 'error'}`;
        elements.result.style.display = 'block';

        // Scroll to result
        utils.scrollToElement(elements.result);
    },

    /**
     * Hide result message
     */
    hideResult() {
        if (elements.result) {
            elements.result.style.display = 'none';
        }
    },

    /**
     * Update network status indicator
     */
    updateNetworkStatus(connected = true) {
        if (elements.networkStatus) {
            const statusDot = elements.networkStatus.querySelector('.status-dot');
            if (statusDot) {
                statusDot.style.color = connected ? '#10b981' : '#ef4444';
            }
        }
    }
};

// API Service
const api = {
    /**
     * Make API request with error handling
     */
    async request(endpoint, options = {}) {
        try {
            const url = `${CONFIG.API_BASE_URL}${endpoint}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('API Request failed:', error);
            return { 
                success: false, 
                error: error.message || 'Network request failed' 
            };
        }
    },

    /**
     * Check API health status
     */
    async checkHealth() {
        const result = await this.request('/health');
        if (result.success) {
            state.apiStatus = 'healthy';
            ui.updateNetworkStatus(true);
        } else {
            state.apiStatus = 'unhealthy';
            ui.updateNetworkStatus(false);
        }
        return result;
    },

    /**
     * Get API status
     */
    async getStatus() {
        return await this.request('/status');
    },

    /**
     * Claim airdrop
     */
    async claimAirdrop(recipientAddress, hash) {
        return await this.request('/claim', {
            method: 'POST',
            body: JSON.stringify({
                recipientAddress: recipientAddress.trim(),
                hash: hash.trim()
            })
        });
    }
};

// Form Validation
const validation = {
    /**
     * Validate form inputs
     */
    validateForm() {
        utils.clearAllErrors();
        let isValid = true;

        const address = elements.recipientAddress?.value?.trim() || '';
        const hash = elements.hash?.value?.trim() || '';

        // Validate recipient address
        if (!address) {
            utils.showError('recipientAddress', 'Recipient address is required');
            isValid = false;
        } else if (!utils.isValidEthereumAddress(address)) {
            utils.showError('recipientAddress', 'Please enter a valid Ethereum address (0x...)');
            isValid = false;
        }

        // Validate hash
        if (!hash) {
            utils.showError('hash', 'Claim hash is required');
            isValid = false;
        } else if (!utils.isValidHash(hash)) {
            utils.showError('hash', 'Please enter a valid claim hash');
            isValid = false;
        }

        return isValid;
    }
};

// Event Handlers
const handlers = {
    /**
     * Handle form submission
     */
    async handleFormSubmit(event) {
        event.preventDefault();
        
        if (state.isLoading) return;
        
        // Validate form
        if (!validation.validateForm()) {
            return;
        }

        // Get form data
        const recipientAddress = elements.recipientAddress.value.trim();
        const hash = elements.hash.value.trim();

        // Start loading state
        ui.setLoading(true);
        ui.hideResult();

        try {
            // Make API request
            const result = await api.claimAirdrop(recipientAddress, hash);

            if (result.success && result.data.success) {
                // Success case
                let details = '';
                
                // Handle wxHOPR transaction (support both old and new field names)
                const wxHOPRTxHash = result.data.wxHOPRTransactionHash || result.data.transactionHash;
                if (wxHOPRTxHash) {
                    const txLink = utils.createTxLink(wxHOPRTxHash);
                    details += `<p><strong>wxHOPR Transaction:</strong></p>`;
                    details += `<div class="tx-hash">
                        <a href="${txLink}" target="_blank" rel="noopener noreferrer">
                            ${wxHOPRTxHash}
                        </a>
                    </div>`;
                }
                
                // Handle xDai transaction
                if (result.data.xDaiTransactionHash) {
                    const xDaiTxLink = utils.createTxLink(result.data.xDaiTransactionHash);
                    details += `<p><strong>xDai Transaction:</strong></p>`;
                    details += `<div class="tx-hash">
                        <a href="${xDaiTxLink}" target="_blank" rel="noopener noreferrer">
                            ${result.data.xDaiTransactionHash}
                        </a>
                    </div>`;
                }
                
                // Handle amounts
                const wxHOPRAmount = result.data.wxHOPRAmount || result.data.amount;
                if (wxHOPRAmount) {
                    const formattedAmount = utils.formatTokenAmount(wxHOPRAmount);
                    details += `<p><strong>wxHOPR Amount:</strong> ${formattedAmount} wxHOPR</p>`;
                }
                
                if (result.data.xDaiAmount) {
                    const formattedXDaiAmount = utils.formatTokenAmount(result.data.xDaiAmount);
                    details += `<p><strong>xDai Amount:</strong> ${formattedXDaiAmount} xDai</p>`;
                }

                ui.showResult(
                    true, 
                    '🎉 Dual Airdrop Claimed Successfully!', 
                    'Both wxHOPR tokens and xDai have been sent to your wallet!',
                    details
                );
                
                // Clear form on success
                if (elements.form) {
                    elements.form.reset();
                }
                
            } else {
                // API returned error
                const errorMessage = result.data?.message || result.error || 'Unknown error occurred';
                ui.showResult(
                    false, 
                    '❌ Claim Failed', 
                    errorMessage
                );
            }

        } catch (error) {
            console.error('Claim error:', error);
            ui.showResult(
                false, 
                '❌ Network Error', 
                'Failed to connect to the server. Please try again later.'
            );
        } finally {
            ui.setLoading(false);
        }
    },

    /**
     * Handle input changes to clear errors
     */
    handleInputChange(fieldName) {
        return function() {
            utils.clearError(fieldName);
        };
    }
};

// Initialization
const app = {
    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Initializing wxHOPR Airdrop Frontend...');
        
        // Check API health
        const healthCheck = await api.checkHealth();
        if (!healthCheck.success) {
            console.warn('⚠️ API health check failed:', healthCheck.error);
        } else {
            console.log('✅ API is healthy');
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Focus first input
        if (elements.recipientAddress) {
            elements.recipientAddress.focus();
        }
        
        console.log('✅ Application initialized successfully');
    },

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Form submission
        if (elements.form) {
            elements.form.addEventListener('submit', handlers.handleFormSubmit);
        }

        // Input change handlers to clear errors
        if (elements.recipientAddress) {
            elements.recipientAddress.addEventListener('input', handlers.handleInputChange('recipientAddress'));
        }
        
        if (elements.hash) {
            elements.hash.addEventListener('input', handlers.handleInputChange('hash'));
        }

        // Periodic health checks (every 30 seconds)
        setInterval(() => {
            api.checkHealth();
        }, 30000);
    }
};

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for debugging (optional)
if (typeof window !== 'undefined') {
    window.AirdropApp = {
        config: CONFIG,
        state,
        utils,
        ui,
        api,
        validation,
        handlers
    };
}
