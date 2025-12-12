// Christmas Tree Editor
// Load selected tree image into canvas

let selectedOrnament = null;
let isDragging = false;
let isResizing = false;
let startX, startY;
let startWidth, startHeight;
let ornamentCounter = 0;
let textCounter = 0;

// Text tool settings
let currentFont = 'Arial';
let currentFontSize = 24;
let currentTextColor = '#000000';

// History management for undo/redo
let history = [];
let historyStep = -1;
const MAX_HISTORY = 50;

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('.canvas');
    const selectedTreeImage = localStorage.getItem('selectedTreeImage');
    
    if (selectedTreeImage && canvas) {
        // Create container for tree and ornaments
        canvas.innerHTML = '';
        canvas.style.position = 'relative';
        canvas.style.display = 'flex';
        canvas.style.alignItems = 'center';
        canvas.style.justifyContent = 'center';
        
        // Create wrapper for tree (movable/resizable)
        const treeWrapper = document.createElement('div');
        treeWrapper.className = 'tree-wrapper';
        treeWrapper.style.position = 'absolute';
        treeWrapper.style.left = '50%';
        treeWrapper.style.top = '50%';
        treeWrapper.style.transform = 'translate(-50%, -50%)';
        treeWrapper.style.width = '500px';
        treeWrapper.style.height = '500px';
        treeWrapper.style.cursor = 'move';
        treeWrapper.style.zIndex = '1';
        
        // Create image element for the tree
        const treeImg = document.createElement('img');
        treeImg.src = selectedTreeImage;
        treeImg.alt = 'Selected Tree';
        treeImg.style.width = '100%';
        treeImg.style.height = '100%';
        treeImg.style.objectFit = 'contain';
        treeImg.style.pointerEvents = 'none';
        
        // Create resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.width = '15px';
        resizeHandle.style.height = '15px';
        resizeHandle.style.backgroundColor = '#4CAF50';
        resizeHandle.style.cursor = 'nwse-resize';
        resizeHandle.style.borderRadius = '50%';
        resizeHandle.style.border = '2px solid white';
        resizeHandle.style.zIndex = '100';
        
        treeWrapper.appendChild(treeImg);
        treeWrapper.appendChild(resizeHandle);
        canvas.appendChild(treeWrapper);
        
        // Make tree draggable and resizable
        makeTreeInteractive(treeWrapper);
    }
    
    // Tool button switching
    const toolButtons = document.querySelectorAll('.tool-btn');
    const defaultSections = document.querySelectorAll('.default-section');
    const textSections = document.querySelectorAll('.text-section');
    const imageSections = document.querySelectorAll('.image-section');
    
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.getAttribute('data-tool');
            
            // Remove active class from all buttons
            toolButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (tool === 'default') {
                // Show default sections (background, tree, ornaments)
                defaultSections.forEach(section => section.style.display = 'block');
                textSections.forEach(section => section.style.display = 'none');
                imageSections.forEach(section => section.style.display = 'none');
            } else if (tool === 'text') {
                // Hide default sections, show text sections
                defaultSections.forEach(section => section.style.display = 'none');
                textSections.forEach(section => section.style.display = 'block');
                imageSections.forEach(section => section.style.display = 'none');
            } else if (tool === 'image') {
                // Show image sections
                defaultSections.forEach(section => section.style.display = 'none');
                textSections.forEach(section => section.style.display = 'none');
                imageSections.forEach(section => section.style.display = 'block');
            }
        });
    });
    
    // Background options
    const bgOptions = document.querySelectorAll('.bg-option');
    bgOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active class from all options
            bgOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Get the background class name (pattern-1, christmas-red, etc.)
            const bgClass = Array.from(option.classList).find(cls => 
                cls.startsWith('pattern-') || cls.startsWith('christmas-')
            ) || 'plain-bg';
            
            // Store the class name on canvas for later retrieval
            canvas.dataset.backgroundClass = bgClass;
            
            // Get the background style from the clicked option
            const bgColor = option.style.backgroundColor;
            const bgImage = window.getComputedStyle(option).backgroundImage;
            const bgSize = window.getComputedStyle(option).backgroundSize;
            
            // Apply to canvas
            if (canvas) {
                if (bgImage && bgImage !== 'none') {
                    canvas.style.background = window.getComputedStyle(option).background;
                    canvas.style.backgroundSize = bgSize;
                } else {
                    canvas.style.background = bgColor;
                    canvas.dataset.backgroundClass = 'solid-' + (bgColor || 'white');
                }
                // Save state after background change
                saveState();
            }
        });
    });
    
    // Text tool functionality
    const addTextBtn = document.querySelector('.add-text-btn');
    const textInput = document.querySelector('.text-input');
    
    if (addTextBtn && textInput) {
        addTextBtn.addEventListener('click', () => {
            const text = textInput.value.trim();
            if (text) {
                addTextToCanvas(text);
                textInput.value = '';
            }
        });
        
        // Also add on Enter key
        textInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = textInput.value.trim();
                if (text) {
                    addTextToCanvas(text);
                    textInput.value = '';
                }
            }
        });
    }
    
    // Font family selection
    const fontOptions = document.querySelectorAll('.font-option');
    fontOptions.forEach(option => {
        option.addEventListener('click', () => {
            currentFont = option.getAttribute('data-font');
            fontOptions.forEach(o => o.style.border = '1px solid #ddd');
            option.style.border = '2px solid #4CAF50';
        });
    });
    
    // Font size slider
    const fontSizeSlider = document.querySelector('.font-size-slider');
    const fontSizeDisplay = document.querySelector('.font-size-display');
    
    if (fontSizeSlider && fontSizeDisplay) {
        fontSizeSlider.addEventListener('input', (e) => {
            currentFontSize = e.target.value;
            fontSizeDisplay.textContent = `${currentFontSize}px`;
        });
    }
    
    // Text color selection
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            currentTextColor = option.getAttribute('data-color');
            colorOptions.forEach(o => o.style.border = '2px solid #ddd');
            option.style.border = '2px solid #4CAF50';
        });
    });
    
    // Emoji buttons
    const emojiButtons = document.querySelectorAll('.emoji-btn');
    emojiButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const emoji = btn.getAttribute('data-emoji');
            addTextToCanvas(emoji);
        });
    });
    
    // Make trees in Tree section clickable to change canvas tree
    const allSections = document.querySelectorAll('.section.default-section');
    allSections.forEach(section => {
        const sectionHeader = section.querySelector('.section-header span');
        if (sectionHeader && sectionHeader.textContent.trim() === 'Tree') {
            const treeBoxes = section.querySelectorAll('.ornament-box.has-image');
            treeBoxes.forEach(treeBox => {
                treeBox.style.cursor = 'pointer';
                treeBox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const treeImg = treeBox.querySelector('img.tree-preview');
                    if (treeImg) {
                        changeCanvasTree(treeImg.src);
                    }
                });
            });
        }
    });
    
    // Make ornaments draggable from sidebar (excluding tree images)
    const ornamentSections = document.querySelectorAll('.section.default-section');
    ornamentSections.forEach(section => {
        const sectionHeader = section.querySelector('.section-header span');
        if (sectionHeader && sectionHeader.textContent.trim() !== 'Tree' && sectionHeader.textContent.trim() !== 'Background') {
            const ornamentBoxes = section.querySelectorAll('.ornament-box.has-image img');
            ornamentBoxes.forEach(ornamentImg => {
                ornamentImg.draggable = true;
                ornamentImg.style.cursor = 'grab';
                
                ornamentImg.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('ornamentSrc', ornamentImg.src);
                    ornamentImg.style.cursor = 'grabbing';
                });
                
                ornamentImg.addEventListener('dragend', () => {
                    ornamentImg.style.cursor = 'grab';
                });
            });
        }
    });
    
    // Image upload functionality
    const uploadImageBtn = document.querySelector('.upload-image-btn');
    const imageUploadInput = document.getElementById('image-upload');
    const uploadPreview = document.querySelector('.upload-preview');
    const uploadedImagesGrid = document.querySelector('.uploaded-images-grid');
    
    if (uploadImageBtn && imageUploadInput) {
        uploadImageBtn.addEventListener('click', () => {
            imageUploadInput.click();
        });
        
        imageUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    const imgSrc = event.target.result;
                    
                    // Update preview
                    uploadPreview.textContent = `Selected: ${file.name}`;
                    uploadPreview.style.color = '#4CAF50';
                    
                    // Clear placeholder text if it exists
                    const placeholder = uploadedImagesGrid.querySelector('div[style*="grid-column"]');
                    if (placeholder) {
                        placeholder.remove();
                    }
                    
                    // Add to uploaded images grid
                    const imgBox = document.createElement('div');
                    imgBox.className = 'uploaded-image-box';
                    imgBox.style.cssText = 'width: 100%; aspect-ratio: 1; border: 2px solid #ddd; border-radius: 8px; cursor: pointer; overflow: hidden; position: relative;';
                    
                    const img = document.createElement('img');
                    img.src = imgSrc;
                    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
                    img.draggable = true;
                    
                    // Make uploaded image draggable
                    img.addEventListener('dragstart', (e) => {
                        e.dataTransfer.setData('ornamentSrc', imgSrc);
                        img.style.cursor = 'grabbing';
                    });
                    
                    img.addEventListener('dragend', () => {
                        img.style.cursor = 'grab';
                    });
                    
                    imgBox.appendChild(img);
                    uploadedImagesGrid.appendChild(imgBox);
                    
                    // Reset input
                    imageUploadInput.value = '';
                    uploadPreview.textContent = 'Image added! Upload another?';
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Allow canvas to accept drops
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        
        const ornamentSrc = e.dataTransfer.getData('ornamentSrc');
        if (!ornamentSrc) return;
        
        // Get canvas position
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;
        
        addOrnamentToCanvas(ornamentSrc, x, y);
    });
    
    // Save button functionality
    const saveBtn = document.querySelector('.save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            // Disable button during save
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            
            try {
                await saveCanvasDesign();
            } catch (error) {
                console.error('Save failed:', error);
                alert('Failed to save design. Please check your connection and try again.');
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save';
            }
        });
    }
    
    // Back button functionality
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'decorator.html';
        });
    }
    
    // Clear button functionality
    const clearBtn = document.querySelector('.clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Clear everything on the canvas?')) {
                clearCanvas();
            }
        });
    }
    
    // Undo button functionality
    const undoBtn = document.querySelector('.undo-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            undo();
        });
    }
    
    // Redo button functionality
    const redoBtn = document.querySelector('.redo-btn');
    if (redoBtn) {
        redoBtn.addEventListener('click', () => {
            redo();
        });
    }
    
    // Keyboard shortcuts for undo/redo
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        }
    });
    
    // Save initial state to history
    saveState();
});

async function saveCanvasDesign() {
    // Check if Supabase is loaded
    if (typeof supabase === 'undefined' || typeof html2canvas === 'undefined') {
        alert('Required libraries not loaded. Please refresh the page and try again.');
        throw new Error('Supabase or html2canvas not loaded');
    }
    
    const canvas = document.querySelector('.canvas');
    
    // Get canvas background
    const canvasBg = canvas.style.background || 'white';
    const backgroundClass = canvas.dataset.backgroundClass || '';
    
    // Get all placed ornaments
    const ornaments = [];
    document.querySelectorAll('.placed-ornament').forEach(ornament => {
        const img = ornament.querySelector('img');
        ornaments.push({
            type: 'ornament',
            src: img.src,
            left: ornament.style.left,
            top: ornament.style.top,
            width: ornament.style.width,
            height: ornament.style.height,
            zIndex: ornament.style.zIndex
        });
    });
    
    // Get all placed text
    const texts = [];
    document.querySelectorAll('.placed-text').forEach(text => {
        texts.push({
            type: 'text',
            content: text.textContent,
            left: text.style.left,
            top: text.style.top,
            fontFamily: text.style.fontFamily,
            fontSize: text.style.fontSize,
            color: text.style.color,
            zIndex: text.style.zIndex
        });
    });
    
    // Get tree image
    const treeImg = canvas.querySelector('img');
    const treeData = treeImg ? treeImg.src : localStorage.getItem('selectedTreeImage');
    
    // Create design data object
    const designData = {
        background: canvasBg,
        backgroundClass: backgroundClass,
        tree: treeData,
        ornaments: ornaments,
        texts: texts,
        timestamp: Date.now()
    };
    
    // Show nickname popup first
    showNicknamePopup(designData);
}

// Helper function to get background image URL from style
function getBackgroundImageUrl(bgStyle) {
    const urlMatch = bgStyle.match(/url\(['"]?([^'"()]+)['"]?\)/);
    return urlMatch ? urlMatch[1] : null;
}

// Helper function to convert CSS background to SVG or image URL
function cssBackgroundToImageUrl(bgStyle, width, height) {
    // Check if it's a background-image URL (like gingham.jpeg)
    const imageUrl = getBackgroundImageUrl(bgStyle);
    if (imageUrl) {
        return imageUrl;
    }
    
    let svgContent = '';
    
    if (bgStyle.includes('linear-gradient')) {
        // Parse linear gradient
        const angleMatch = bgStyle.match(/(\d+)deg/);
        const angle = angleMatch ? angleMatch[1] : '180';
        const colorMatches = [...bgStyle.matchAll(/(#[0-9a-f]{6}|rgb\([^)]+\))\s*(\d+)?%?/gi)];
        
        if (colorMatches.length > 0) {
            const stops = colorMatches.map((match, i) => {
                const color = match[1];
                const offset = match[2] || (i * 100 / (colorMatches.length - 1));
                return `<stop offset="${offset}%" stop-color="${color}"/>`;
            }).join('\n');
            
            svgContent = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                    <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="${angle == 135 ? '100%' : '0%'}" y2="${angle == 135 ? '100%' : '100%'}">
                            ${stops}
                        </linearGradient>
                    </defs>
                    <rect width="${width}" height="${height}" fill="url(#grad)"/>
                </svg>`;
        }
    } else if (bgStyle.includes('radial-gradient')) {
        svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <rect width="${width}" height="${height}" fill="${bgStyle.includes('#e8f4f8') ? '#e8f4f8' : '#1a237e'}"/>
            </svg>`;
    } else if (bgStyle.includes('repeating-linear-gradient')) {
        svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <rect width="${width}" height="${height}" fill="#c41e3a"/>
            </svg>`;
    } else {
        // Solid color
        const color = bgStyle.startsWith('#') || bgStyle.startsWith('rgb') ? bgStyle : '#ffffff';
        svgContent = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <rect width="${width}" height="${height}" fill="${color}"/>
            </svg>`;
    }
    
    return 'data:image/svg+xml;base64,' + btoa(svgContent);
}

async function saveToSupabase(designData, nickname, shareToGallery) {
    try {
        console.log('Starting save to Supabase...', { nickname, shareToGallery });
        
        const canvasDiv = document.querySelector('.canvas');
        console.log('Generating thumbnail...');
        
        // Clone canvas content WITH its background
        const canvasClone = canvasDiv.cloneNode(true);
        canvasClone.style.position = 'fixed';
        canvasClone.style.left = '-9999px';
        canvasClone.style.top = '-9999px';
        canvasClone.style.width = canvasDiv.offsetWidth + 'px';
        canvasClone.style.height = canvasDiv.offsetHeight + 'px';
        // Preserve the background from the original canvas
        canvasClone.style.background = canvasDiv.style.background || 'white';
        canvasClone.style.backgroundSize = 'cover';
        canvasClone.style.backgroundPosition = 'center';
        
        // Remove resize handles from clone
        canvasClone.querySelectorAll('.resize-handle').forEach(el => el.remove());
        
        document.body.appendChild(canvasClone);
        
        // Capture with html2canvas with the actual background
        const thumbnail = await html2canvas(canvasClone, {
            backgroundColor: null,
            scale: 0.5,
            useCORS: true,
            allowTaint: true,
            logging: false
        });
        
        // Clean up
        document.body.removeChild(canvasClone);
        
        // Use PNG to preserve transparency
        const thumbnailUrl = thumbnail.toDataURL('image/png');
        console.log('Thumbnail generated, size:', thumbnailUrl.length, 'bytes');
        
        // Save to Supabase
        console.log('Inserting to Supabase...');
        const { data, error } = await supabase
            .from('decorated_trees')
            .insert({
                nickname: nickname,
                design_data: designData,
                thumbnail_url: thumbnailUrl
            })
            .select()
            .single();
        
        console.log('Supabase insert response:', { data, error });
        
        if (error) throw error;
        
        // Also save to localStorage for backward compatibility
        localStorage.setItem(data.id, JSON.stringify(designData));
        
        // Create shareable link with Supabase ID
        const shareableLink = `${window.location.origin}${window.location.pathname.replace('editor.html', '')}view.html?id=${data.id}`;
        
        return { success: true, link: shareableLink, id: data.id };
    } catch (error) {
        console.error('Error saving to Supabase:', error);
        // Fallback to localStorage
        const designId = 'design_' + Date.now();
        localStorage.setItem(designId, JSON.stringify(designData));
        const shareableLink = `${window.location.origin}${window.location.pathname.replace('editor.html', '')}view.html?id=${designId}`;
        return { success: true, link: shareableLink, id: designId };
    }
}

function showNicknamePopup(designData) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    // Create popup
    const popup = document.createElement('div');
    popup.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    
    popup.innerHTML = `
        <h2 style="margin: 0 0 15px 0; color: #333; font-size: 24px;">Save Your Design</h2>
        <p style="margin: 0 0 15px 0; color: #666;">Enter a nickname to share your creation with others!</p>
        <input type="text" id="nickname-input" placeholder="Enter your nickname..." value="Anonymous" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; margin-bottom: 15px;">
        <div style="margin-bottom: 15px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="share-gallery" checked style="width: 18px; height: 18px;">
                <span style="color: #666; font-size: 14px;">Share to public gallery</span>
            </label>
        </div>
        <div style="display: flex; gap: 10px;">
            <button id="cancel-save-btn" style="flex: 1; padding: 12px; background: #ccc; color: #333; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">Cancel</button>
            <button id="confirm-save-btn" style="flex: 1; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">Save & Share</button>
        </div>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Focus nickname input
    setTimeout(() => document.getElementById('nickname-input').focus(), 100);
    
    // Cancel button
    document.getElementById('cancel-save-btn').addEventListener('click', () => {
        overlay.remove();
    });
    
    // Save button
    document.getElementById('confirm-save-btn').addEventListener('click', async () => {
        const nickname = document.getElementById('nickname-input').value.trim() || 'Anonymous';
        const shareToGallery = document.getElementById('share-gallery').checked;
        
        // Show loading
        document.getElementById('confirm-save-btn').textContent = 'Saving...';
        document.getElementById('confirm-save-btn').disabled = true;
        
        // Save to Supabase
        const result = await saveToSupabase(designData, nickname, shareToGallery);
        
        overlay.remove();
        
        if (result.success) {
            showSharePopup(result.link);
        }
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

function showSharePopup(link) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    // Create popup
    const popup = document.createElement('div');
    popup.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    
    popup.innerHTML = `
        <h2 style="margin: 0 0 15px 0; color: #333; font-size: 24px;">Design Saved!</h2>
        <p style="margin: 0 0 15px 0; color: #666;">Share this link with your friends to show them your decorated tree:</p>
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <input type="text" id="share-link-input" value="${link}" readonly style="flex: 1; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 14px; background: #f9f9f9;">
            <button id="copy-link-btn" style="padding: 12px 20px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; white-space: nowrap;">Copy Link</button>
        </div>
        <button id="close-popup-btn" style="width: 100%; padding: 12px; background: #666; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">Close</button>
    `;
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // Copy link functionality
    document.getElementById('copy-link-btn').addEventListener('click', () => {
        const input = document.getElementById('share-link-input');
        input.select();
        document.execCommand('copy');
        
        const btn = document.getElementById('copy-link-btn');
        btn.textContent = 'Copied! ✓';
        btn.style.background = '#2196F3';
        
        setTimeout(() => {
            btn.textContent = 'Copy Link';
            btn.style.background = '#4CAF50';
        }, 2000);
    });
    
    // Close popup
    document.getElementById('close-popup-btn').addEventListener('click', () => {
        overlay.remove();
    });
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

let selectedText = null;

function addTextToCanvas(text) {
    const canvas = document.querySelector('.canvas');
    const canvasRect = canvas.getBoundingClientRect();
    textCounter++;
    
    // Create text wrapper
    const textWrapper = document.createElement('div');
    textWrapper.className = 'placed-text';
    textWrapper.id = `text-${textCounter}`;
    textWrapper.style.position = 'absolute';
    textWrapper.style.left = `${canvasRect.width / 2 - 50}px`;
    textWrapper.style.top = `${canvasRect.height / 2 - 20}px`;
    textWrapper.style.cursor = 'move';
    textWrapper.style.zIndex = '10';
    textWrapper.style.fontFamily = currentFont;
    textWrapper.style.fontSize = `${currentFontSize}px`;
    textWrapper.style.color = currentTextColor;
    textWrapper.style.fontWeight = 'bold';
    textWrapper.style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
    textWrapper.style.whiteSpace = 'nowrap';
    textWrapper.style.userSelect = 'none';
    textWrapper.contentEditable = 'true';
    textWrapper.textContent = text;
    
    canvas.appendChild(textWrapper);
    
    // Save state after adding text
    saveState();
    
    // Click to select text
    textWrapper.addEventListener('click', (e) => {
        if (selectedText && selectedText !== textWrapper) {
            selectedText.style.outline = 'none';
        }
        selectedText = textWrapper;
        textWrapper.style.outline = '2px dashed #4CAF50';
        e.stopPropagation();
    });
    
    // Make text draggable
    textWrapper.addEventListener('mousedown', (e) => {
        // Only drag if not editing text
        if (e.target === textWrapper && !textWrapper.getAttribute('contenteditable-active')) {
            isDragging = true;
            selectedOrnament = textWrapper;
            
            startX = e.clientX - textWrapper.offsetLeft;
            startY = e.clientY - textWrapper.offsetTop;
            
            textWrapper.style.zIndex = '100';
            e.preventDefault();
        }
    });
    
    // Focus for editing
    textWrapper.addEventListener('focus', () => {
        textWrapper.setAttribute('contenteditable-active', 'true');
        textWrapper.style.userSelect = 'text';
        textWrapper.style.cursor = 'text';
    });
    
    textWrapper.addEventListener('blur', () => {
        textWrapper.removeAttribute('contenteditable-active');
        textWrapper.style.userSelect = 'none';
        textWrapper.style.cursor = 'move';
    });
    
    // Right-click to remove
    textWrapper.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (confirm('Remove this text?')) {
            textWrapper.remove();
            if (selectedText === textWrapper) {
                selectedText = null;
            }
        }
    });
}

// Apply font changes to selected text
document.addEventListener('DOMContentLoaded', function() {
    const fontOptions = document.querySelectorAll('.font-option');
    fontOptions.forEach(option => {
        option.addEventListener('click', () => {
            const font = option.getAttribute('data-font');
            currentFont = font;
            if (selectedText) {
                selectedText.style.fontFamily = font;
            }
            fontOptions.forEach(o => o.style.border = '1px solid #ddd');
            option.style.border = '2px solid #4CAF50';
        });
    });
    
    const fontSizeSlider = document.querySelector('.font-size-slider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
            currentFontSize = e.target.value;
            document.querySelector('.font-size-display').textContent = `${currentFontSize}px`;
            if (selectedText) {
                selectedText.style.fontSize = `${currentFontSize}px`;
            }
        });
    }
    
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            const color = option.getAttribute('data-color');
            currentTextColor = color;
            if (selectedText) {
                selectedText.style.color = color;
            }
            colorOptions.forEach(o => o.style.border = '2px solid #ddd');
            option.style.border = '2px solid #4CAF50';
        });
    });
    
    // Deselect text when clicking canvas
    document.querySelector('.canvas').addEventListener('click', (e) => {
        if (e.target.classList.contains('canvas')) {
            if (selectedText) {
                selectedText.style.outline = 'none';
                selectedText = null;
            }
        }
    });
});

function changeCanvasTree(treeSrc) {
    const canvas = document.querySelector('.canvas');
    const treeWrapper = canvas.querySelector('.tree-wrapper');
    
    if (treeWrapper) {
        // Find the tree image inside the wrapper
        const treeImg = treeWrapper.querySelector('img');
        if (treeImg) {
            treeImg.src = treeSrc;
            localStorage.setItem('selectedTreeImage', treeSrc);
        }
    } else {
        // If no tree wrapper exists, create one
        const newTreeWrapper = document.createElement('div');
        newTreeWrapper.className = 'tree-wrapper';
        newTreeWrapper.style.position = 'absolute';
        newTreeWrapper.style.left = '50%';
        newTreeWrapper.style.top = '50%';
        newTreeWrapper.style.transform = 'translate(-50%, -50%)';
        newTreeWrapper.style.width = '500px';
        newTreeWrapper.style.height = '500px';
        newTreeWrapper.style.cursor = 'move';
        newTreeWrapper.style.zIndex = '1';
        
        const treeImg = document.createElement('img');
        treeImg.src = treeSrc;
        treeImg.alt = 'Selected Tree';
        treeImg.style.width = '100%';
        treeImg.style.height = '100%';
        treeImg.style.objectFit = 'contain';
        treeImg.style.pointerEvents = 'none';
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.bottom = '0';
        resizeHandle.style.right = '0';
        resizeHandle.style.width = '15px';
        resizeHandle.style.height = '15px';
        resizeHandle.style.backgroundColor = '#4CAF50';
        resizeHandle.style.cursor = 'nwse-resize';
        resizeHandle.style.borderRadius = '50%';
        resizeHandle.style.border = '2px solid white';
        resizeHandle.style.zIndex = '100';
        
        newTreeWrapper.appendChild(treeImg);
        newTreeWrapper.appendChild(resizeHandle);
        canvas.insertBefore(newTreeWrapper, canvas.firstChild);
        
        makeTreeInteractive(newTreeWrapper);
        localStorage.setItem('selectedTreeImage', treeSrc);
        
        // Save state after adding tree
        saveState();
    }
    
    // Save state after changing tree
    saveState();
}

function makeTreeInteractive(treeWrapper) {
    const resizeHandle = treeWrapper.querySelector('.resize-handle');
    let isDragging = false;
    let isResizing = false;
    let startX, startY, startLeft, startTop, startWidth, startHeight;
    
    // Dragging functionality
    treeWrapper.addEventListener('mousedown', (e) => {
        if (e.target === resizeHandle) return;
        
        isDragging = true;
        const rect = treeWrapper.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startLeft = rect.left;
        startTop = rect.top;
        
        e.preventDefault();
    });
    
    // Resizing functionality
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = treeWrapper.offsetWidth;
        startHeight = treeWrapper.offsetHeight;
        
        e.stopPropagation();
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            treeWrapper.style.left = (startLeft + deltaX) + 'px';
            treeWrapper.style.top = (startTop + deltaY) + 'px';
            treeWrapper.style.transform = 'none';
        }
        
        if (isResizing) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const delta = Math.max(deltaX, deltaY);
            
            const newSize = Math.max(100, startWidth + delta);
            treeWrapper.style.width = newSize + 'px';
            treeWrapper.style.height = newSize + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging || isResizing) {
            saveState();
        }
        isDragging = false;
        isResizing = false;
    });
}

function addOrnamentToCanvas(src, x, y) {
    const canvas = document.querySelector('.canvas');
    ornamentCounter++;
    
    // Create ornament wrapper
    const ornamentWrapper = document.createElement('div');
    ornamentWrapper.className = 'placed-ornament';
    ornamentWrapper.id = `ornament-${ornamentCounter}`;
    ornamentWrapper.style.position = 'absolute';
    ornamentWrapper.style.left = `${x - 50}px`;
    ornamentWrapper.style.top = `${y - 50}px`;
    ornamentWrapper.style.width = '100px';
    ornamentWrapper.style.height = '100px';
    ornamentWrapper.style.cursor = 'move';
    ornamentWrapper.style.zIndex = '10';
    
    // Create ornament image
    const ornamentImg = document.createElement('img');
    ornamentImg.src = src;
    ornamentImg.style.width = '100%';
    ornamentImg.style.height = '100%';
    ornamentImg.style.objectFit = 'contain';
    ornamentImg.style.pointerEvents = 'none';
    
    // Create resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.right = '0';
    resizeHandle.style.width = '15px';
    resizeHandle.style.height = '15px';
    resizeHandle.style.backgroundColor = '#ff6b6b';
    resizeHandle.style.cursor = 'nwse-resize';
    resizeHandle.style.borderRadius = '50%';
    resizeHandle.style.border = '2px solid white';
    resizeHandle.style.opacity = '0';
    resizeHandle.style.transition = 'opacity 0.2s';
    
    ornamentWrapper.appendChild(ornamentImg);
    ornamentWrapper.appendChild(resizeHandle);
    canvas.appendChild(ornamentWrapper);
    
    // Save state after adding ornament
    saveState();
    
    // Show resize handle on hover
    ornamentWrapper.addEventListener('mouseenter', () => {
        resizeHandle.style.opacity = '1';
    });
    
    ornamentWrapper.addEventListener('mouseleave', () => {
        if (!isResizing) {
            resizeHandle.style.opacity = '0';
        }
    });
    
    // Make ornament draggable
    ornamentWrapper.addEventListener('mousedown', (e) => {
        if (e.target === resizeHandle) return;
        
        isDragging = true;
        selectedOrnament = ornamentWrapper;
        
        startX = e.clientX - ornamentWrapper.offsetLeft;
        startY = e.clientY - ornamentWrapper.offsetTop;
        
        ornamentWrapper.style.zIndex = '100';
        e.preventDefault();
    });
    
    // Make ornament resizable
    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        selectedOrnament = ornamentWrapper;
        
        startX = e.clientX;
        startY = e.clientY;
        startWidth = ornamentWrapper.offsetWidth;
        startHeight = ornamentWrapper.offsetHeight;
        
        e.stopPropagation();
        e.preventDefault();
    });
    
    // Double-click to remove
    ornamentWrapper.addEventListener('dblclick', () => {
        ornamentWrapper.remove();
        saveState();
    });
}

// Global mouse move handler
document.addEventListener('mousemove', (e) => {
    if (isDragging && selectedOrnament) {
        const canvas = document.querySelector('.canvas');
        const canvasRect = canvas.getBoundingClientRect();
        
        let newX = e.clientX - startX;
        let newY = e.clientY - startY;
        
        // Keep ornament within canvas bounds
        newX = Math.max(0, Math.min(newX, canvasRect.width - selectedOrnament.offsetWidth));
        newY = Math.max(0, Math.min(newY, canvasRect.height - selectedOrnament.offsetHeight));
        
        selectedOrnament.style.left = `${newX}px`;
        selectedOrnament.style.top = `${newY}px`;
    }
    
    if (isResizing && selectedOrnament) {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const newWidth = Math.max(30, startWidth + deltaX);
        const newHeight = Math.max(30, startHeight + deltaY);
        
        selectedOrnament.style.width = `${newWidth}px`;
        selectedOrnament.style.height = `${newHeight}px`;
    }
});

// Global mouse up handler
document.addEventListener('mouseup', () => {
    if (isDragging && selectedOrnament) {
        selectedOrnament.style.zIndex = '10';
        saveState(); // Save state after dragging
    }
    
    if (isResizing && selectedOrnament) {
        const resizeHandle = selectedOrnament.querySelector('.resize-handle');
        if (resizeHandle) {
            resizeHandle.style.opacity = '0';
        }
        saveState(); // Save state after resizing
    }
    
    isDragging = false;
    isResizing = false;
    selectedOrnament = null;
});

// History management functions
function saveState() {
    const canvas = document.querySelector('.canvas');
    if (!canvas) return;
    
    const state = {
        background: canvas.style.background || 'white',
        backgroundClass: canvas.dataset.backgroundClass || '',
        html: canvas.innerHTML
    };
    
    // Remove any states after current step
    history = history.slice(0, historyStep + 1);
    
    // Add new state
    history.push(state);
    
    // Limit history size
    if (history.length > MAX_HISTORY) {
        history.shift();
    } else {
        historyStep++;
    }
    
    updateUndoRedoButtons();
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        restoreState(history[historyStep]);
        updateUndoRedoButtons();
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        restoreState(history[historyStep]);
        updateUndoRedoButtons();
    }
}

function restoreState(state) {
    const canvas = document.querySelector('.canvas');
    if (!canvas || !state) return;
    
    canvas.style.background = state.background;
    canvas.dataset.backgroundClass = state.backgroundClass;
    canvas.innerHTML = state.html;
    
    // Reattach event listeners to restored elements
    reattachEventListeners();
}

function reattachEventListeners() {
    const canvas = document.querySelector('.canvas');
    if (!canvas) return;
    
    // Reattach ornament listeners
    const ornaments = canvas.querySelectorAll('.placed-ornament');
    ornaments.forEach(ornament => {
        makeOrnamentInteractive(ornament);
    });
    
    // Reattach text listeners
    const texts = canvas.querySelectorAll('.placed-text');
    texts.forEach(text => {
        makeTextInteractive(text);
    });
    
    // Reattach tree wrapper listeners
    const treeWrapper = canvas.querySelector('.tree-wrapper');
    if (treeWrapper) {
        makeTreeInteractive(treeWrapper);
    }
}

function makeOrnamentInteractive(ornamentWrapper) {
    // Click to select
    ornamentWrapper.addEventListener('click', (e) => {
        if (selectedOrnament && selectedOrnament !== ornamentWrapper) {
            selectedOrnament.style.outline = 'none';
            const prevHandle = selectedOrnament.querySelector('.resize-handle');
            if (prevHandle) prevHandle.style.opacity = '0';
        }
        selectedOrnament = ornamentWrapper;
        ornamentWrapper.style.outline = '2px dashed #4CAF50';
        const handle = ornamentWrapper.querySelector('.resize-handle');
        if (handle) handle.style.opacity = '1';
        e.stopPropagation();
    });
    
    // Drag functionality
    ornamentWrapper.addEventListener('mousedown', (e) => {
        if (!e.target.classList.contains('resize-handle')) {
            isDragging = true;
            selectedOrnament = ornamentWrapper;
            const canvasRect = document.querySelector('.canvas').getBoundingClientRect();
            startX = e.clientX - ornamentWrapper.offsetLeft;
            startY = e.clientY - ornamentWrapper.offsetTop;
            ornamentWrapper.style.zIndex = '100';
            e.preventDefault();
        }
    });
    
    // Resize functionality
    const resizeHandle = ornamentWrapper.querySelector('.resize-handle');
    if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            selectedOrnament = ornamentWrapper;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = ornamentWrapper.offsetWidth;
            startHeight = ornamentWrapper.offsetHeight;
            e.stopPropagation();
            e.preventDefault();
        });
    }
    
    // Double-click to remove
    ornamentWrapper.addEventListener('dblclick', () => {
        ornamentWrapper.remove();
        saveState();
    });
}

function makeTextInteractive(textWrapper) {
    // Click to select text
    textWrapper.addEventListener('click', (e) => {
        if (selectedText && selectedText !== textWrapper) {
            selectedText.style.outline = 'none';
        }
        selectedText = textWrapper;
        textWrapper.style.outline = '2px dashed #4CAF50';
        e.stopPropagation();
    });
    
    // Make text draggable
    textWrapper.addEventListener('mousedown', (e) => {
        if (e.target === textWrapper && !textWrapper.getAttribute('contenteditable-active')) {
            isDragging = true;
            selectedOrnament = textWrapper;
            startX = e.clientX - textWrapper.offsetLeft;
            startY = e.clientY - textWrapper.offsetTop;
            textWrapper.style.zIndex = '100';
            e.preventDefault();
        }
    });
    
    // Focus for editing
    textWrapper.addEventListener('focus', () => {
        textWrapper.setAttribute('contenteditable-active', 'true');
        textWrapper.style.userSelect = 'text';
        textWrapper.style.cursor = 'text';
    });
    
    textWrapper.addEventListener('blur', () => {
        textWrapper.removeAttribute('contenteditable-active');
        textWrapper.style.userSelect = 'none';
        textWrapper.style.cursor = 'move';
        saveState();
    });
    
    // Right-click to remove
    textWrapper.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (confirm('Remove this text?')) {
            textWrapper.remove();
            if (selectedText === textWrapper) {
                selectedText = null;
            }
            saveState();
        }
    });
}

function updateUndoRedoButtons() {
    const undoBtn = document.querySelector('.undo-btn');
    const redoBtn = document.querySelector('.redo-btn');
    
    if (undoBtn) {
        undoBtn.disabled = historyStep <= 0;
    }
    
    if (redoBtn) {
        redoBtn.disabled = historyStep >= history.length - 1;
    }
}

function clearCanvas() {
    const canvas = document.querySelector('.canvas');
    if (!canvas) return;
    
    // Remove all ornaments and texts
    const ornaments = canvas.querySelectorAll('.placed-ornament');
    ornaments.forEach(o => o.remove());
    
    const texts = canvas.querySelectorAll('.placed-text');
    texts.forEach(t => t.remove());
    
    // Reset background to white
    canvas.style.background = 'white';
    canvas.dataset.backgroundClass = '';
    
    saveState();
}
