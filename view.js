// View saved Christmas tree design

// Snow effect
function createSnowflake() {
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.innerHTML = '❄';
    snowflake.style.left = Math.random() * 100 + '%';
    snowflake.style.animationDuration = Math.random() * 3 + 5 + 's';
    snowflake.style.opacity = Math.random();
    snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';
    
    document.body.appendChild(snowflake);
    
    setTimeout(() => {
        snowflake.remove();
    }, 8000);
}

// Create snowflakes continuously
setInterval(createSnowflake, 200);

document.addEventListener('DOMContentLoaded', () => {
    // Auto-play Christmas music with aggressive fallbacks
    const music = document.getElementById('christmas-music');
    
    const playMusic = () => {
        if (music) {
            music.volume = 0.5;
            const playPromise = music.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Music playing');
                }).catch(error => {
                    console.log('Autoplay blocked, waiting for interaction:', error);
                });
            }
        }
    };
    
    // Try to play immediately
    setTimeout(playMusic, 100);
    
    // Also try on any user interaction
    const interactions = ['click', 'touchstart', 'keydown', 'scroll', 'mousemove'];
    interactions.forEach(event => {
        document.addEventListener(event, () => {
            if (music && music.paused) {
                playMusic();
            }
        }, { once: true });
    });
    
    // Get design ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const designId = urlParams.get('id');
    
    const viewCanvas = document.getElementById('viewCanvas');
    
    if (!designId) {
        showError('No design ID provided');
        return;
    }
    
    // Load design from Supabase
    loadAndRenderDesign(designId);
});

async function loadAndRenderDesign(designId) {
    const viewCanvas = document.getElementById('viewCanvas');
    
    try {
        // Fetch design from Supabase
        const { data: design, error } = await supabase
            .from('decorated_trees')
            .select('*')
            .eq('id', designId)
            .single();
        
        if (error) {
            // Fallback to localStorage for legacy designs
            const designDataString = localStorage.getItem(designId);
            if (designDataString) {
                const designData = JSON.parse(designDataString);
                renderDesign(designData);
                return;
            }
            throw error;
        }
        
        if (!design) {
            showError('Design not found. It may have been deleted.');
            return;
        }
        
        // Increment view counter
        const newViews = (design.views || 0) + 1;
        await supabase
            .from('decorated_trees')
            .update({ views: newViews })
            .eq('id', designId);
        
        // Render the design
        renderDesign(design.design_data);
    } catch (error) {
        showError('Error loading design');
        console.error(error);
    }
}

function renderDesign(data) {
    const viewCanvas = document.getElementById('viewCanvas');
    
    // Set canvas background
    viewCanvas.style.background = data.background || 'white';
    viewCanvas.style.display = 'flex';
    viewCanvas.style.alignItems = 'center';
    viewCanvas.style.justifyContent = 'center';
    
    // Add tree image
    if (data.tree) {
        const treeImg = document.createElement('img');
        treeImg.src = data.tree;
        treeImg.alt = 'Christmas Tree';
        treeImg.style.maxWidth = '80%';
        treeImg.style.maxHeight = '80%';
        treeImg.style.objectFit = 'contain';
        treeImg.style.position = 'relative';
        treeImg.style.zIndex = '1';
        viewCanvas.appendChild(treeImg);
    }
    
    // Add ornaments
    if (data.ornaments && data.ornaments.length > 0) {
        data.ornaments.forEach(ornament => {
            const ornamentDiv = document.createElement('div');
            ornamentDiv.style.position = 'absolute';
            ornamentDiv.style.left = ornament.left;
            ornamentDiv.style.top = ornament.top;
            ornamentDiv.style.width = ornament.width;
            ornamentDiv.style.height = ornament.height;
            ornamentDiv.style.zIndex = ornament.zIndex || '10';
            
            const img = document.createElement('img');
            img.src = ornament.src;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            
            ornamentDiv.appendChild(img);
            viewCanvas.appendChild(ornamentDiv);
        });
    }
    
    // Add text elements
    if (data.texts && data.texts.length > 0) {
        data.texts.forEach(text => {
            const textDiv = document.createElement('div');
            textDiv.style.position = 'absolute';
            textDiv.style.left = text.left;
            textDiv.style.top = text.top;
            textDiv.style.fontFamily = text.fontFamily;
            textDiv.style.fontSize = text.fontSize;
            textDiv.style.color = text.color;
            textDiv.style.fontWeight = 'bold';
            textDiv.style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
            textDiv.style.whiteSpace = 'nowrap';
            textDiv.style.zIndex = text.zIndex || '10';
            textDiv.textContent = text.content;
            
            viewCanvas.appendChild(textDiv);
        });
    }
}

function showError(message) {
    const viewCanvas = document.getElementById('viewCanvas');
    viewCanvas.innerHTML = `
        <div class="error-message">
            <p>${message}</p>
            <p style="margin-top: 20px;">
                <a href="index.html">Go back to create your own tree</a>
            </p>
        </div>
    `;
    viewCanvas.style.background = 'rgba(255, 255, 255, 0.1)';
    viewCanvas.style.display = 'flex';
    viewCanvas.style.alignItems = 'center';
    viewCanvas.style.justifyContent = 'center';
}
