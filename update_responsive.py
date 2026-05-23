#!/usr/bin/env python3
"""
CityRing - Responsive Design Auto-Update Script
This script updates all files in your app folder to be responsive for all devices
"""

import os
import re
from pathlib import Path

# Dictionary of replacements for each file type
REPLACEMENTS = {
    "layout.tsx": [
        (
            'export const viewport: Viewport = {\n  width: "device-width",\n  initialScale: 1,\n};',
            'export const viewport: Viewport = {\n  width: "device-width",\n  initialScale: 1,\n  maximumScale: 5,\n  userScalable: true,\n};'
        )
    ],
    "page.tsx": [  # Homepage
        # Banner height scaling
        ('h-[150px] sm:h-[190px] md:h-[230px] lg:h-[280px]', 'h-[80px] sm:h-[120px] md:h-[180px] lg:h-[280px]'),
        
        # Navbar responsive
        ('px-6', 'px-4 sm:px-6'),
        ('h-[60px]', 'h-[50px] sm:h-[60px]'),
        ('gap-x-10 gap-y-2 text-[15px]', 'gap-x-3 sm:gap-x-6 lg:gap-x-10 gap-y-1 text-xs sm:text-sm lg:text-[15px]'),
        
        # Hero section
        ('pt-14 pb-6', 'py-8 sm:py-12 lg:py-14'),
        ('px-6 pt-14', 'px-4 sm:px-6 py-8 sm:py-12 lg:py-14'),
        ('rounded-3xl', 'rounded-2xl sm:rounded-3xl'),
        ('p-9 overflow-hidden', 'p-5 sm:p-7 md:p-9 overflow-hidden'),
        ('mt-7 flex items-center gap-4', 'mt-5 sm:mt-7 flex items-center gap-3 sm:gap-4'),
        ('mt-8 flex flex-wrap gap-3 justify-center', 'mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-3 justify-center'),
        
        # Headings responsive
        ('text-3xl md:text-4xl', 'text-2xl sm:text-3xl md:text-4xl'),
        ('text-3xl font-semibold tracking-tight', 'text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight'),
        
        # Cards in rows
        ('flex gap-3 pb-3 min-w-max pr-6', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-3'),
        ('w-[180px] text-left', 'w-full text-left'),
    ],
    "join/page.tsx": [
        # Container padding
        ('max-w-6xl mx-auto px-6', 'max-w-6xl mx-auto px-4 sm:px-6'),
        
        # Headings
        ('text-3xl md:text-4xl', 'text-2xl sm:text-3xl md:text-4xl'),
        
        # Filters grid
        ('grid grid-cols-1 md:grid-cols-4 gap-4', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'),
        
        # Cards grid
        ('flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-4'),
        ('style={{ width: 320 }}', ''),
        ('snap-start shrink-0', ''),
        ('text-lg font-semibold', 'text-base sm:text-lg font-semibold'),
        ('text-sm text-white/65', 'text-xs sm:text-sm text-white/65'),
    ],
    "exclusive/page.tsx": [
        # Container padding
        ('max-w-6xl mx-auto px-6', 'max-w-6xl mx-auto px-4 sm:px-6'),
        
        # Headings
        ('text-3xl md:text-4xl', 'text-2xl sm:text-3xl md:text-4xl'),
        
        # Filters grid
        ('grid grid-cols-1 md:grid-cols-4 gap-4', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'),
        
        # Cards grid
        ('flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory', 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-4'),
        ('style={{ width: 320 }}', ''),
        ('snap-start shrink-0', ''),
        ('text-lg font-semibold', 'text-base sm:text-lg font-semibold'),
        ('text-sm text-white/65', 'text-xs sm:text-sm text-white/65'),
    ],
    "register/page.tsx": [
        # Container padding
        ('max-w-3xl mx-auto px-6', 'max-w-3xl mx-auto px-4 sm:px-6'),
        
        # Headings
        ('text-3xl md:text-4xl', 'text-2xl sm:text-3xl md:text-4xl'),
        
        # Hero section
        ('gap-6', 'gap-4 sm:gap-6'),
        ('px-5 py-4', 'px-3 sm:px-5 py-3 sm:py-4'),
        
        # Forms
        ('rounded-2xl', 'rounded-lg sm:rounded-2xl'),
        ('px-4 py-3 text-white', 'px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white'),
        
        # Grid
        ('grid grid-cols-2 sm:grid-cols-4', 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4'),
    ],
    "about/page.tsx": [
        ('max-w-5xl mx-auto px-6', 'max-w-5xl mx-auto px-4 sm:px-6'),
        ('text-4xl', 'text-2xl sm:text-3xl lg:text-4xl'),
        ('mt-6 text-white/70', 'mt-4 sm:mt-6 text-sm sm:text-base text-white/70'),
    ],
    "contact/page.tsx": [
        ('max-w-5xl mx-auto px-6', 'max-w-5xl mx-auto px-4 sm:px-6'),
        ('text-4xl', 'text-2xl sm:text-3xl lg:text-4xl'),
        ('grid grid-cols-1 md:grid-cols-2 gap-10', 'grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10'),
    ],
    "globals.css": [
        (
            '@media (prefers-color-scheme: dark) {',
            '''* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

img {
  max-width: 100%;
  height: auto;
  display: block;
}

input, textarea, select, button {
  font-size: 16px;
  -webkit-appearance: none;
  appearance: none;
}

button, a {
  -webkit-tap-highlight-color: transparent;
}

@media (prefers-color-scheme: dark) {'''
        )
    ]
}

def update_files(app_directory):
    """Update all files in app directory for responsive design"""
    
    print("🚀 CityRing Responsive Design Update")
    print("=" * 50)
    
    updated_count = 0
    skipped_count = 0
    
    for file_path in Path(app_directory).rglob("*.tsx"):
        relative_path = str(file_path.relative_to(app_directory))
        
        # Find matching replacements
        matching_replacements = None
        for pattern, replacements in REPLACEMENTS.items():
            if pattern in relative_path or file_path.name == pattern:
                matching_replacements = replacements
                break
        
        if matching_replacements:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Apply replacements
                for old, new in matching_replacements:
                    content = content.replace(old, new)
                
                # Write back if changed
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"✅ Updated: {relative_path}")
                    updated_count += 1
                else:
                    print(f"⏭️  Skipped: {relative_path} (no changes needed)")
                    skipped_count += 1
                    
            except Exception as e:
                print(f"❌ Error updating {relative_path}: {e}")
        else:
            skipped_count += 1
    
    print("=" * 50)
    print(f"✅ Updated: {updated_count} files")
    print(f"⏭️  Skipped: {skipped_count} files")
    print("\n🎉 Responsive design updates complete!")
    print("\nNext steps:")
    print("1. Test your website on mobile (375px)")
    print("2. Test on tablet (768px)")
    print("3. Test on desktop (1440px)")
    print("4. Check for horizontal scrolling (should be NONE)")

if __name__ == "__main__":
    app_path = "./app"  # Change this to your app folder path
    
    if os.path.exists(app_path):
        update_files(app_path)
    else:
        print(f"❌ App folder not found at: {app_path}")
        print("Please update the app_path variable with correct path")
