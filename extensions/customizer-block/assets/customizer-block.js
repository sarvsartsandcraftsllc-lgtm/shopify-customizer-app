/**
 * Customizer Block - Advanced JavaScript Functionality
 * Handles positioning, interactions, and app integration
 */

class CustomizerBlock {
  constructor(wrapper) {
    this.wrapper = wrapper;
    this.productId = wrapper.dataset.productId;
    this.productTitle = wrapper.dataset.productTitle;
    this.productHandle = wrapper.dataset.productHandle;
    this.customizerRoot = wrapper.querySelector('#customizer-root');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupPositioning();
    this.setupResponsiveness();
    this.setupAccessibility();
    this.initializeCustomizer();
  }

  setupEventListeners() {
    // Listen for app messages
    window.addEventListener('message', this.handleAppMessage.bind(this));
    
    // Listen for custom events
    window.addEventListener('customizerAppReady', this.handleAppReady.bind(this));
    
    // Listen for resize events
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Listen for scroll events for sticky positioning
    window.addEventListener('scroll', this.handleScroll.bind(this));
    
    // Listen for theme changes
    this.setupThemeObserver();
  }

  setupPositioning() {
    const position = this.wrapper.dataset.position;
    const float = this.wrapper.dataset.float;
    const sticky = this.wrapper.dataset.sticky;
    const fixed = this.wrapper.dataset.fixed;
    const overlay = this.wrapper.dataset.overlay;
    const sidebar = this.wrapper.dataset.sidebar;
    const modal = this.wrapper.dataset.modal;

    // Apply positioning classes and attributes
    if (position) {
      this.wrapper.setAttribute('data-position', position);
    }
    
    if (float) {
      this.wrapper.setAttribute('data-float', float);
    }
    
    if (sticky === 'true') {
      this.wrapper.setAttribute('data-sticky', 'true');
    }
    
    if (fixed === 'true') {
      this.wrapper.setAttribute('data-fixed', 'true');
    }
    
    if (overlay === 'true') {
      this.wrapper.setAttribute('data-overlay', 'true');
    }
    
    if (sidebar) {
      this.wrapper.setAttribute('data-sidebar', sidebar);
      this.setupSidebarControls();
    }
    
    if (modal === 'true') {
      this.wrapper.setAttribute('data-modal', 'true');
      this.setupModalControls();
    }
  }

  setupResponsiveness() {
    // Add responsive classes based on screen size
    this.updateResponsiveClasses();
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.updateResponsiveClasses(), 100);
    });
  }

  updateResponsiveClasses() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Remove existing responsive classes
    this.wrapper.classList.remove('mobile', 'tablet', 'desktop', 'large-desktop');
    this.wrapper.classList.remove('portrait', 'landscape');
    
    // Add responsive classes
    if (width < 768) {
      this.wrapper.classList.add('mobile');
    } else if (width < 1024) {
      this.wrapper.classList.add('tablet');
    } else if (width < 1440) {
      this.wrapper.classList.add('desktop');
    } else {
      this.wrapper.classList.add('large-desktop');
    }
    
    // Add orientation classes
    if (height > width) {
      this.wrapper.classList.add('portrait');
    } else {
      this.wrapper.classList.add('landscape');
    }
  }

  setupAccessibility() {
    // Add ARIA attributes
    this.wrapper.setAttribute('role', 'region');
    this.wrapper.setAttribute('aria-label', 'Product Customizer');
    
    // Add focus management
    this.setupFocusManagement();
    
    // Add keyboard navigation
    this.setupKeyboardNavigation();
  }

  setupFocusManagement() {
    // Trap focus within the customizer when it's active
    this.wrapper.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusableElements = this.wrapper.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });
  }

  setupKeyboardNavigation() {
    // Escape key to close modal/sidebar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.wrapper.dataset.modal === 'true') {
          this.closeModal();
        } else if (this.wrapper.dataset.sidebar) {
          this.closeSidebar();
        }
      }
    });
  }

  setupSidebarControls() {
    const sidebar = this.wrapper.dataset.sidebar;
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'customizer-sidebar-toggle';
    toggleButton.setAttribute('aria-label', `Toggle ${sidebar} sidebar`);
    toggleButton.innerHTML = sidebar === 'left' ? '→' : '←';
    
    // Position toggle button
    if (sidebar === 'left') {
      toggleButton.style.left = '100%';
    } else {
      toggleButton.style.right = '100%';
    }
    
    toggleButton.addEventListener('click', () => {
      this.toggleSidebar();
    });
    
    this.wrapper.appendChild(toggleButton);
  }

  setupModalControls() {
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'customizer-modal-close';
    closeButton.setAttribute('aria-label', 'Close customizer');
    closeButton.innerHTML = '×';
    
    closeButton.addEventListener('click', () => {
      this.closeModal();
    });
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'customizer-modal-overlay';
    overlay.addEventListener('click', () => {
      this.closeModal();
    });
    
    this.wrapper.appendChild(closeButton);
    document.body.appendChild(overlay);
  }

  toggleSidebar() {
    const isOpen = this.wrapper.dataset.open === 'true';
    this.wrapper.dataset.open = !isOpen;
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('customizerSidebarToggle', {
      detail: { isOpen: !isOpen, sidebar: this.wrapper.dataset.sidebar }
    }));
  }

  closeModal() {
    this.wrapper.dataset.open = 'false';
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('customizerModalClose', {
      detail: { productId: this.productId }
    }));
  }

  closeSidebar() {
    this.wrapper.dataset.open = 'false';
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('customizerSidebarClose', {
      detail: { sidebar: this.wrapper.dataset.sidebar }
    }));
  }

  setupThemeObserver() {
    // Observe for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          this.updateTheme();
        }
      });
    });
    
    // Start observing
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  }

  updateTheme() {
    const theme = document.documentElement.dataset.theme || 'light';
    this.wrapper.dataset.theme = theme;
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('customizerThemeChange', {
      detail: { theme, productId: this.productId }
    }));
  }

  handleAppMessage(event) {
    if (event.data && event.data.type === 'CUSTOMIZER_APP_READY') {
      this.initializeCustomizer();
    }
  }

  handleAppReady(event) {
    // App is ready, update the customizer
    this.updateCustomizerContent(event.detail);
  }

  handleResize() {
    this.updateResponsiveClasses();
    this.updatePositioning();
  }

  handleScroll() {
    if (this.wrapper.dataset.sticky === 'true') {
      this.updateStickyPosition();
    }
  }

  updateStickyPosition() {
    const rect = this.wrapper.getBoundingClientRect();
    const top = rect.top;
    
    if (top <= 20) {
      this.wrapper.style.position = 'fixed';
      this.wrapper.style.top = '20px';
    } else {
      this.wrapper.style.position = 'static';
      this.wrapper.style.top = 'auto';
    }
  }

  updatePositioning() {
    // Update positioning based on current viewport
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Adjust positioning for mobile
    if (viewport.width < 768) {
      if (this.wrapper.dataset.sidebar) {
        this.wrapper.style.width = '100vw';
        this.wrapper.style.height = '100vh';
      }
    }
  }

  async initializeCustomizer() {
    if (!this.customizerRoot) return;
    
    // Remove loading state
    this.customizerRoot.innerHTML = '';
    
    try {
      // Check if React and the Customizer component are available
      if (typeof window.React === 'undefined' || typeof window.Customizer === 'undefined') {
        // Load React and Customizer component if not available
        await this.loadCustomizerComponent();
      }
      
      // Get product variant ID from the page
      const variantId = this.getProductVariantId();
      
      // Render the Customizer component
      this.renderCustomizerComponent(variantId);
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('customizerBlockReady', {
        detail: {
          productId: this.productId,
          productTitle: this.productTitle,
          productHandle: this.productHandle,
          variantId: variantId,
          customizerRoot: this.customizerRoot,
          instance: this
        }
      }));
      
    } catch (error) {
      console.error('Failed to initialize customizer:', error);
      this.showFallbackContent();
    }
  }

  async loadCustomizerComponent() {
    // This would typically load the React component from your app
    // For now, we'll create a placeholder that can be replaced
    console.log('Loading customizer component...');
    
    // Wait a bit for the component to load
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  getProductVariantId() {
    // Try to get variant ID from various sources
    let variantId = null;
    
    // Check for Shopify variant selector
    const variantSelector = document.querySelector('select[name="id"], input[name="id"]');
    if (variantSelector) {
      variantId = variantSelector.value;
    }
    
    // Check for variant in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('variant')) {
      variantId = urlParams.get('variant');
    }
    
    // Check for variant in page data
    const variantData = document.querySelector('[data-variant-id]');
    if (variantData) {
      variantId = variantData.dataset.variantId;
    }
    
    // Default to product ID if no variant found
    return variantId || this.productId;
  }

  renderCustomizerComponent(variantId) {
    if (!this.customizerRoot || typeof window.React === 'undefined' || typeof window.Customizer === 'undefined') {
      this.showFallbackContent();
      return;
    }

    try {
      const { createElement } = window.React;
      const Customizer = window.Customizer;
      
      // Create React element
      const customizerElement = createElement(Customizer, {
        productId: this.productId,
        variantId: variantId,
        productTitle: this.productTitle
      });
      
      // Render using ReactDOM if available
      if (typeof window.ReactDOM !== 'undefined') {
        window.ReactDOM.render(customizerElement, this.customizerRoot);
      } else {
        // Fallback: create a simple customizer interface
        this.createSimpleCustomizer(variantId);
      }
      
    } catch (error) {
      console.error('Failed to render customizer component:', error);
      this.showFallbackContent();
    }
  }

  createSimpleCustomizer(variantId) {
    // Create a simple HTML-based customizer as fallback
    this.customizerRoot.innerHTML = `
      <div class="simple-customizer">
        <h3>Product Customizer</h3>
        <p>Product: ${this.productTitle}</p>
        <p>Product ID: ${this.productId}</p>
        <p>Variant ID: ${variantId}</p>
        <div class="customizer-actions">
          <button class="btn btn-primary" onclick="this.openAdvancedCustomizer()">
            Open Advanced Customizer
          </button>
        </div>
        <div class="customizer-info">
          <p><strong>Features:</strong></p>
          <ul>
            <li>Upload images (PNG/JPG/SVG)</li>
            <li>Add text with font controls</li>
            <li>Drag, resize, and rotate objects</li>
            <li>Live preview on product mockup</li>
            <li>Export high-resolution print files</li>
          </ul>
        </div>
      </div>
    `;
  }

  showFallbackContent() {
    this.customizerRoot.innerHTML = `
      <div class="customizer-fallback">
        <div class="loading-spinner"></div>
        <p>Loading customizer...</p>
        <p>If this doesn't load, please refresh the page or contact support.</p>
      </div>
    `;
  }

  updateCustomizerContent(content) {
    if (!this.customizerRoot) return;
    
    // Update with app content
    this.customizerRoot.innerHTML = content;
    
    // Dispatch content update event
    window.dispatchEvent(new CustomEvent('customizerContentUpdated', {
      detail: {
        productId: this.productId,
        content
      }
    }));
  }

  openCustomizer() {
    // Open customizer in appropriate mode
    if (this.wrapper.dataset.modal === 'true') {
      this.wrapper.dataset.open = 'true';
    } else if (this.wrapper.dataset.sidebar) {
      this.wrapper.dataset.open = 'true';
    } else {
      // Default: expand inline
      this.wrapper.classList.add('expanded');
    }
    
    // Dispatch open event
    window.dispatchEvent(new CustomEvent('customizerOpen', {
      detail: { productId: this.productId }
    }));
  }

  closeCustomizer() {
    // Close customizer
    if (this.wrapper.dataset.modal === 'true') {
      this.closeModal();
    } else if (this.wrapper.dataset.sidebar) {
      this.closeSidebar();
    } else {
      // Default: collapse inline
      this.wrapper.classList.remove('expanded');
    }
    
    // Dispatch close event
    window.dispatchEvent(new CustomEvent('customizerClose', {
      detail: { productId: this.productId }
    }));
  }

  // Public API methods
  setPosition(position) {
    this.wrapper.dataset.position = position;
  }

  setFloat(float) {
    this.wrapper.dataset.float = float;
  }

  setSticky(sticky) {
    this.wrapper.dataset.sticky = sticky;
  }

  setFixed(fixed) {
    this.wrapper.dataset.fixed = fixed;
  }

  setOverlay(overlay) {
    this.wrapper.dataset.overlay = overlay;
  }

  setSidebar(sidebar) {
    this.wrapper.dataset.sidebar = sidebar;
    this.setupSidebarControls();
  }

  setModal(modal) {
    this.wrapper.dataset.modal = modal;
    this.setupModalControls();
  }

  setTheme(theme) {
    this.wrapper.dataset.theme = theme;
  }

  setZIndex(zIndex) {
    this.wrapper.dataset.zIndex = zIndex;
  }

  show() {
    this.wrapper.dataset.hidden = 'false';
    this.wrapper.dataset.visible = 'true';
  }

  hide() {
    this.wrapper.dataset.hidden = 'true';
    this.wrapper.dataset.visible = 'false';
  }

  destroy() {
    // Cleanup event listeners
    window.removeEventListener('message', this.handleAppMessage);
    window.removeEventListener('customizerAppReady', this.handleAppReady);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    
    // Remove the wrapper
    this.wrapper.remove();
  }
}

// Initialize all customizer blocks when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const customizerBlocks = document.querySelectorAll('.customizer-block-wrapper');
  
  customizerBlocks.forEach(block => {
    new CustomizerBlock(block);
  });
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CustomizerBlock;
} else if (typeof window !== 'undefined') {
  window.CustomizerBlock = CustomizerBlock;
}
