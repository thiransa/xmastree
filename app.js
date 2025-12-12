// Christmas Tree Decorator App - Snow Effect

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
    const createButton = document.querySelector('.create-btn');
    
    if (createButton) {
        createButton.addEventListener('click', () => {
            // Check if user is on mobile or tablet
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isSmallScreen = window.innerWidth < 1024;
            
            if (isMobile || isSmallScreen) {
                alert('For the best experience, please use a laptop or desktop computer to create your Christmas tree decoration! 🎄💻');
                return;
            }
            
            window.location.href = 'decorator.html';
        });
    }
});
