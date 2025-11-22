# Blitz Bazaar Logo Setup Instructions

## Required Logo Files

You need to save the 4 logo images you provided to the following locations:

### 1. Dashboard Logo - Light Theme
- **File**: Image 1 from attachments (light background with tagline)
- **Save as**: `public/logos/blitz-bazaar-light.png`
- **Used in**: AmazonHeader, RetailerLayout, WholesalerLayout

### 2. Dashboard Logo - Dark Theme
- **File**: Image 2 from attachments (dark background with tagline)
- **Save as**: `public/logos/blitz-bazaar-dark.png`
- **Used in**: AmazonHeader, RetailerLayout, WholesalerLayout

### 3. Landing Page Logo - Light Theme
- **File**: Image 3 from attachments (light background, logo only)
- **Save as**: `public/logos/blitz-bazaar-landing-light.png`
- **Used in**: Landing page hero and footer

### 4. Landing Page Logo - Dark Theme
- **File**: Image 4 from attachments (dark background, logo only)
- **Save as**: `public/logos/blitz-bazaar-landing-dark.png`
- **Used in**: Landing page hero and footer

## Steps to Save Logos

1. Create the directory if it doesn't exist (it should already be created):
   ```
   public/logos/
   ```

2. Download/save each of the 4 images from your attachments

3. Rename them according to the list above

4. Place them in the `public/logos/` folder

## Verification

After saving the logos, you should have these files:
- ✅ `public/logos/blitz-bazaar-light.png`
- ✅ `public/logos/blitz-bazaar-dark.png`
- ✅ `public/logos/blitz-bazaar-landing-light.png`
- ✅ `public/logos/blitz-bazaar-landing-dark.png`

## What's Already Been Updated

The following components have been updated to use the new branding:

### ✅ Components Updated:
- **AmazonHeader** - Now shows Blitz Bazaar logo (light/dark theme support)
- **RetailerLayout** - Sidebar logo updated
- **WholesalerLayout** - Sidebar logo updated
- **InvoiceGenerator** - Company name and email updated
- **Landing Page** - Complete redesign with lightning theme

### ✅ Branding Changes:
- All "LocalMart" references → "Blitz Bazaar"
- All "Shop Local, Save More" → "Lightning deals, lasting thrills"
- Email: support@localmart.com → support@blitzbazaar.com

### ✅ Design Enhancements:
- Landing page completely redesigned with lightning/speed theme
- Orange and blue color scheme emphasizing energy and speed
- Custom animations for bounce and fade effects
- Lightning bolt decorative elements
- Gradient buttons and text effects
- Animated backgrounds and pulsing effects

## Testing

Once logos are saved, test the following pages:
1. `/` - Landing page (check both light and dark theme)
2. `/dashboard` - Customer dashboard header
3. `/retailer-dashboard` - Retailer sidebar
4. `/wholesaler-dashboard` - Wholesaler sidebar
5. Generate an invoice to verify invoice branding

## Theme Switching

The logos will automatically switch between light and dark variants when users toggle the theme using the ThemeToggle button.
