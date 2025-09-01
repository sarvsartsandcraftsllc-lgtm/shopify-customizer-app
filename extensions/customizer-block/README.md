# 🎨 Customizer Block - Theme App Extension

A powerful and flexible Shopify Theme App Extension that injects a customizable product customizer interface on product pages.

## ✨ Features

- **Full Width & Responsive**: Automatically adapts to any screen size
- **Multiple Positioning Options**: Above/below product, sidebar, modal, overlay
- **Advanced Styling**: Customizable borders, backgrounds, padding, and margins
- **Accessibility First**: ARIA labels, keyboard navigation, focus management
- **Theme Integration**: Supports light/dark themes and custom color schemes
- **Event System**: Comprehensive event dispatching for app integration
- **Performance Optimized**: Lazy loading and efficient DOM manipulation

## 🚀 Quick Start

### 1. Installation

The Customizer Block is automatically included with your PRNTONDEMAND app. Simply add it to your Shopify theme:

1. Go to your Shopify admin → Online Store → Themes
2. Click "Customize" on your active theme
3. Navigate to a product page
4. Add the "Customizer Block" section where you want it to appear

### 2. Basic Usage

The block will automatically:
- Inject a `<div id="customizer-root"></div>` on product pages
- Display product information (ID, title, handle)
- Provide a loading state while your app initializes
- Dispatch events when ready for app integration

## 🎯 Positioning Options

### Inline Positioning
```liquid
{% comment %}
  Default inline positioning within the product page flow
{% endcomment %}
<div class="customizer-block-wrapper" data-position="below_product">
  <!-- Block content -->
</div>
```

### Sidebar Positioning
```liquid
{% comment %}
  Left or right sidebar that slides in/out
{% endcomment %}
<div class="customizer-block-wrapper" data-sidebar="left">
  <!-- Block content -->
</div>
```

### Modal Positioning
```liquid
{% comment %}
  Centered modal overlay
{% endcomment %}
<div class="customizer-block-wrapper" data-modal="true">
  <!-- Block content -->
</div>
```

### Fixed Positioning
```liquid
{% comment %}
  Fixed position in bottom-right corner
{% endcomment %}
<div class="customizer-block-wrapper" data-fixed="true">
  <!-- Block content -->
</div>
```

## ⚙️ Configuration Options

### Block Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `title` | Text | "Product Customizer" | Block title |
| `description` | Textarea | "Customize your product..." | Block description |
| `position` | Select | "below_product" | Block position |
| `show_border` | Checkbox | true | Show border around block |
| `show_background` | Checkbox | false | Show background color |
| `padding` | Range | 20px | Internal padding |
| `margin_top` | Range | 30px | Top margin |
| `margin_bottom` | Range | 30px | Bottom margin |

### Data Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `data-position` | `above_product`, `below_product`, `after_description`, `before_gallery` | Content flow position |
| `data-float` | `left`, `right` | Float positioning |
| `data-sticky` | `true`, `false` | Sticky positioning |
| `data-fixed` | `true`, `false` | Fixed positioning |
| `data-overlay` | `true`, `false` | Overlay positioning |
| `data-sidebar` | `left`, `right` | Sidebar positioning |
| `data-modal` | `true`, `false` | Modal positioning |
| `data-theme` | `light`, `dark`, `minimal` | Theme variant |
| `data-z-index` | `high`, `highest` | Z-index level |

## 🔌 App Integration

### Event Listening

```javascript
// Listen for when the customizer block is ready
window.addEventListener('customizerBlockReady', (event) => {
  const { productId, productTitle, productHandle, customizerRoot } = event.detail;
  
  // Initialize your customizer app
  initializeCustomizer(customizerRoot, productId);
});

// Listen for customizer open/close events
window.addEventListener('customizerOpen', (event) => {
  console.log('Customizer opened for product:', event.detail.productId);
});

window.addEventListener('customizerClose', (event) => {
  console.log('Customizer closed for product:', event.detail.productId);
});
```

### Direct API Access

```javascript
// Get the customizer block instance
const customizerBlock = document.querySelector('.customizer-block-wrapper');
const instance = customizerBlock.CustomizerBlock;

// Control positioning
instance.setSidebar('right');
instance.setModal(true);
instance.setSticky(true);

// Control visibility
instance.show();
instance.hide();

// Control theming
instance.setTheme('dark');
instance.setZIndex('highest');
```

### Content Updates

```javascript
// Update the customizer content
const customizerRoot = document.getElementById('customizer-root');
customizerRoot.innerHTML = `
  <div class="your-customizer-interface">
    <!-- Your customizer content -->
  </div>
`;

// Dispatch content update event
window.dispatchEvent(new CustomEvent('customizerContentUpdated', {
  detail: { productId: '123', content: customizerRoot.innerHTML }
}));
```

## 🎨 Styling & Theming

### CSS Custom Properties

```css
.customizer-block-wrapper {
  --customizer-primary-color: #008060;
  --customizer-secondary-color: #6d7175;
  --customizer-border-color: #ddd;
  --customizer-background-color: #f9f9f9;
  --customizer-text-color: #333;
  --customizer-border-radius: 8px;
  --customizer-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

### Theme Variants

```css
/* Dark theme */
.customizer-block-wrapper[data-theme="dark"] {
  --customizer-background-color: #2a2a2a;
  --customizer-text-color: #fff;
  --customizer-border-color: #444;
}

/* Minimal theme */
.customizer-block-wrapper[data-theme="minimal"] {
  --customizer-border-color: transparent;
  --customizer-background-color: transparent;
  --customizer-shadow: none;
}
```

### Responsive Classes

The block automatically adds responsive classes:
- `.mobile` - Mobile devices (< 768px)
- `.tablet` - Tablet devices (768px - 1024px)
- `.desktop` - Desktop devices (1024px - 1440px)
- `.large-desktop` - Large desktop devices (> 1440px)
- `.portrait` - Portrait orientation
- `.landscape` - Landscape orientation

## 📱 Responsive Design

### Mobile-First Approach
- Automatically adjusts padding and margins for mobile
- Sidebar positioning becomes full-screen on mobile
- Touch-friendly interactions and sizing

### Breakpoint System
```css
/* Mobile */
@media (max-width: 768px) {
  .customizer-block-wrapper {
    padding: 15px !important;
    margin: 20px 0 !important;
  }
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1024px) {
  .customizer-block-wrapper {
    padding: 20px !important;
    margin: 25px 0 !important;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .customizer-block-wrapper {
    padding: 20px !important;
    margin: 30px 0 !important;
  }
}
```

## ♿ Accessibility Features

### ARIA Support
- `role="region"` for screen readers
- `aria-label` for block identification
- Focus management and keyboard navigation
- High contrast mode support

### Keyboard Navigation
- Tab key navigation within the block
- Escape key to close modals/sidebars
- Focus trapping for modal interfaces

### Screen Reader Support
- Semantic HTML structure
- Descriptive text and labels
- Loading state announcements

## 🔧 Advanced Usage

### Custom Positioning

```javascript
// Create a custom positioned block
const customBlock = document.createElement('div');
customBlock.className = 'customizer-block-wrapper';
customBlock.setAttribute('data-sidebar', 'right');
customBlock.setAttribute('data-sticky', 'true');

// Add to page
document.body.appendChild(customBlock);

// Initialize
new CustomizerBlock(customBlock);
```

### Dynamic Content Loading

```javascript
// Load customizer content dynamically
async function loadCustomizerContent(productId) {
  const response = await fetch(`/api/customizer/${productId}`);
  const content = await response.text();
  
  const customizerRoot = document.getElementById('customizer-root');
  customizerRoot.innerHTML = content;
}
```

### Theme Integration

```javascript
// Listen for theme changes
window.addEventListener('customizerThemeChange', (event) => {
  const { theme, productId } = event.detail;
  
  // Update your customizer theme
  updateCustomizerTheme(theme);
});
```

## 🚀 Performance Optimization

### Lazy Loading
- Assets are loaded only when needed
- Efficient DOM manipulation
- Minimal impact on page load time

### Event Delegation
- Single event listener for multiple blocks
- Efficient event handling
- Memory leak prevention

### Responsive Images
- Automatic image optimization
- Lazy loading for images
- WebP format support when available

## 🧪 Testing & Debugging

### Console Logging
```javascript
// Enable debug mode
localStorage.setItem('customizer-debug', 'true');

// Check for errors
window.addEventListener('error', (event) => {
  console.error('Customizer Block Error:', event.error);
});
```

### Event Monitoring
```javascript
// Monitor all customizer events
const events = ['customizerBlockReady', 'customizerOpen', 'customizerClose'];
events.forEach(eventName => {
  window.addEventListener(eventName, (event) => {
    console.log(`${eventName}:`, event.detail);
  });
});
```

### Performance Monitoring
```javascript
// Monitor block performance
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('customizer')) {
      console.log('Customizer Performance:', entry);
    }
  });
});
observer.observe({ entryTypes: ['measure'] });
```

## 📚 Examples

### Basic Product Customizer
```liquid
{% section 'customizer-block' %}
```

### Sidebar Customizer
```liquid
<div class="customizer-block-wrapper" data-sidebar="right">
  {% section 'customizer-block' %}
</div>
```

### Modal Customizer
```liquid
<div class="customizer-block-wrapper" data-modal="true">
  {% section 'customizer-block' %}
</div>
```

### Sticky Customizer
```liquid
<div class="customizer-block-wrapper" data-sticky="true">
  {% section 'customizer-block' %}
</div>
```

## 🆘 Troubleshooting

### Common Issues

1. **Block not appearing**
   - Check if the section is added to your theme
   - Verify the block is not hidden with CSS
   - Check browser console for JavaScript errors

2. **Positioning issues**
   - Ensure proper data attributes are set
   - Check for conflicting CSS positioning
   - Verify z-index values

3. **Responsive problems**
   - Test on different screen sizes
   - Check CSS media queries
   - Verify viewport meta tag

### Debug Mode

Enable debug mode to see detailed information:
```javascript
localStorage.setItem('customizer-debug', 'true');
```

## 🔄 Updates & Maintenance

### Version History
- **v1.0.0** - Initial release with basic functionality
- **v1.1.0** - Added advanced positioning options
- **v1.2.0** - Enhanced accessibility features
- **v1.3.0** - Performance optimizations

### Migration Guide
When updating to new versions, check for:
- New data attributes
- Changed CSS classes
- Updated event names
- New configuration options

## 📄 License

This extension is part of the PRNTONDEMAND app and follows the same licensing terms.

---

**Need help?** Check the main app documentation or contact support.



