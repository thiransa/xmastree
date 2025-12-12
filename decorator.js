// Christmas Tree Decorator Page
// Add click handlers to all image boxes

document.addEventListener('DOMContentLoaded', () => {
    console.log('Decorator page loaded');
    
    // Create button handler
    const createBtn = document.getElementById('createBtn');
    if (createBtn) {
        console.log('Create button found');
        createBtn.addEventListener('click', () => {
            // Navigate to editor with no tree pre-selected (user will choose in editor)
            window.location.href = 'editor.html';
        });
    } else {
        console.error('Create button not found!');
    }
    
    // Check if Supabase is loaded
    if (typeof supabase === 'undefined') {
        console.error('Supabase is not loaded!');
    } else {
        console.log('Supabase is loaded');
    }
    
    // Load gallery initially
    console.log('Calling loadGallery...');
    loadGallery();
    
    // Auto-refresh gallery every 5 seconds to show new designs
    setInterval(() => {
        console.log('Auto-refreshing gallery...');
        loadGallery();
    }, 5000);
});

async function loadGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    try {
        console.log('Fetching designs from Supabase...');
        
        // First, fetch all designs to check if we need to delete old ones
        const { data: allDesigns, error: fetchError } = await supabase
            .from('decorated_trees')
            .select('id, created_at')
            .order('created_at', { ascending: false });
        
        if (fetchError) throw fetchError;
        
        // Delete old designs if we have more than 2
        if (allDesigns && allDesigns.length > 2) {
            const designsToDelete = allDesigns.slice(2);
            const idsToDelete = designsToDelete.map(d => d.id);
            
            console.log(`Deleting ${idsToDelete.length} old designs:`, idsToDelete);
            
            const { error: deleteError } = await supabase
                .from('decorated_trees')
                .delete()
                .in('id', idsToDelete);
            
            if (deleteError) {
                console.error('Error deleting old designs:', deleteError);
            } else {
                console.log('Successfully deleted old designs');
            }
        }
        
        // Now fetch only the 2 most recent designs with full data
        const { data: designs, error } = await supabase
            .from('decorated_trees')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(2);
        
        console.log('Supabase response:', { designs, error });
        
        if (error) throw error;
        
        // Clear loading message
        galleryGrid.innerHTML = '';
        
        if (!designs || designs.length === 0) {
            console.log('No designs found');
            galleryGrid.innerHTML = '<div class="loading-message">No designs yet. Be the first to create one! 🎨</div>';
            return;
        }
        
        console.log(`Displaying ${designs.length} designs`);
        
        // Render gallery items in image-box format
        designs.forEach(design => {
            const wrapper = document.createElement('div');
            wrapper.className = 'gallery-item-wrapper';
            
            const date = new Date(design.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            // Get background class from design data
            const bgClass = design.design_data?.backgroundClass || '';
            const isSolidColor = bgClass.startsWith('solid-');
            const hasBackground = bgClass && bgClass.trim() !== '';
            
            // If no background class, default to white
            let bgStyle = '';
            if (isSolidColor) {
                bgStyle = `style="background: ${bgClass.replace('solid-', '')}"`;
            } else if (!hasBackground) {
                bgStyle = 'style="background: white"';
            }
            
            // Get background from design data - use the actual CSS background like view.js does
            const cssBackground = design.design_data?.background || 'white';
            
            console.log('Design background:', cssBackground);
            
            wrapper.innerHTML = `
                <div class="image-box has-image gallery-with-bg" style="background: ${cssBackground}; background-size: cover; background-position: center;">
                    <img src="${design.thumbnail_url}" alt="Design by ${design.nickname}" class="tree-preview">
                </div>
                <div class="gallery-info-below">
                    <div class="gallery-nickname">${design.nickname}</div>
                    <div class="gallery-stats">
                        <span class="views">${design.views} views</span>
                        <span class="date">${date}</span>
                    </div>
                </div>
                <div class="gallery-actions">
                    <button class="like-btn" data-id="${design.id}" data-likes="${design.likes}">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span class="like-count">${design.likes}</span>
                    </button>
                </div>
            `;
            
            // Like button handler
            const likeBtn = wrapper.querySelector('.like-btn');
            likeBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                e.preventDefault();
                
                const currentLikes = parseInt(likeBtn.dataset.likes);
                const newLikes = currentLikes + 1;
                
                // Update UI immediately
                likeBtn.classList.add('liked');
                likeBtn.querySelector('.like-count').textContent = newLikes;
                likeBtn.dataset.likes = newLikes;
                
                // Update in database
                try {
                    await supabase
                        .from('decorated_trees')
                        .update({ likes: newLikes })
                        .eq('id', design.id);
                } catch (error) {
                    console.error('Error updating likes:', error);
                }
            });
            
            // Click to view design
            const imageBox = wrapper.querySelector('.image-box');
            imageBox.addEventListener('click', (e) => {
                window.location.href = `view.html?id=${design.id}`;
            });
            
            console.log('Appending wrapper to gallery:', wrapper);
            galleryGrid.appendChild(wrapper);
        });
        
        console.log('Gallery grid children count:', galleryGrid.children.length);
    } catch (error) {
        console.error('Error loading gallery:', error);
        galleryGrid.innerHTML = '<div class="loading-message">Error loading gallery. Please refresh the page.</div>';
    }
}
