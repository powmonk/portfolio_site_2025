// Cache constants
const CACHE_KEY = 'portfolio_data_cache';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// NEW global variable to keep track of what's been loaded
let loadedItemDetails = new Set();

// Enhanced burger menu setup with bottom swipe handling
function setupBurgerMenu() {
    const burgerMenu = document.querySelector('.burger-menu:not(.carousel-burger)');
    const carouselBurger = document.querySelector('.carousel-burger');
    const menuOverlay = document.querySelector('.menu-overlay');
    const closeMenuBtn = document.querySelector('.close-menu-btn');
    const closeBtn = document.querySelector('.close-btn');

    let portfolioData = []; // To store the fetched data
    let isCarouselBuilt = false; // Flag to check if carousel is built    

    // Create backdrop element
    const backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    document.body.appendChild(backdrop);
    
    // Toggle menu on burger click
    burgerMenu.addEventListener('click', toggleMenu);
    
    // Also handle carousel burger if it exists
    if (carouselBurger) {
        carouselBurger.addEventListener('click', toggleMenu);
    }
    
    // Function to toggle the menu
    function toggleMenu() {
        burgerMenu.classList.add('active');
        if (carouselBurger) carouselBurger.classList.add('active');
        menuOverlay.classList.add('active');
        backdrop.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    // Close menu on close button click
    closeMenuBtn.addEventListener('click', closeMenu);
    
    // Close menu on backdrop click
    backdrop.addEventListener('click', closeMenu);
    
    // Function to close the menu
    function closeMenu() {
        burgerMenu.classList.remove('active');
        if (carouselBurger) carouselBurger.classList.remove('active');
        menuOverlay.classList.remove('active');
        backdrop.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
    
    // Close menu on escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuOverlay.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Add swipe down to close functionality
    let touchStartY = 0;
    let touchEndY = 0;
    const minSwipeDistance = 10; // Minimum distance for swipe to be registered
    
    // Touch start event
    menuOverlay.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });
    
    // Touch end event
    menuOverlay.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });
    
    // Handle the swipe
    function handleSwipe() {
        const swipeDistance = touchEndY - touchStartY;
        if (swipeDistance > minSwipeDistance) {
            // Swiped downward, close the menu
            closeMenu();
        }
    }
}

// DOM elements
const gridContainer = document.querySelector('.grid-container');
const carouselContainer = document.querySelector('.carousel-container');
const carouselWrapper = document.querySelector('.carousel-wrapper');
const carouselNav = document.querySelector('.carousel-nav');
const closeBtn = document.querySelector('.close-btn');

let portfolioData = []; // Will hold the lightweight grid data
let isCarouselBuilt = false; // Flag to check if the carousel DOM is ready

// Create placeholder grid items
function createPlaceholders(count = 6) {
    gridContainer.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const placeholderItem = document.createElement('div');
        placeholderItem.className = 'grid-item placeholder';
        
        const shimmer = document.createElement('div');
        shimmer.className = 'shimmer-effect';
        
        const placeholderImage = document.createElement('div');
        placeholderImage.className = 'placeholder-image';
        
        const placeholderInfo = document.createElement('div');
        placeholderInfo.className = 'placeholder-info';
        
        const placeholderTitle = document.createElement('div');
        placeholderTitle.className = 'placeholder-title';
        
        const placeholderTags = document.createElement('div');
        placeholderTags.className = 'placeholder-tags';
        
        placeholderInfo.appendChild(placeholderTitle);
        placeholderInfo.appendChild(placeholderTags);
        placeholderItem.appendChild(placeholderImage);
        placeholderItem.appendChild(placeholderInfo);
        placeholderItem.appendChild(shimmer);
        
        gridContainer.appendChild(placeholderItem);
    }
}

// Cache Management Functions
function saveToCache(data) {
    const cacheData = {
        timestamp: Date.now(),
        data: data
    };
    
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        return true;
    } catch (error) {
        console.warn('Failed to save to cache:', error);
        return false;
    }
}

function getFromCache() {
    try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (!cachedData) return null;
        
        const parsedData = JSON.parse(cachedData);
        const now = Date.now();
        
        if (now - parsedData.timestamp < CACHE_DURATION) {
            return parsedData.data;
        } else {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    } catch (error) {
        console.warn('Failed to retrieve from cache:', error);
        return null;
    }
}

// Fetch portfolio items from PHP script with caching
async function fetchPortfolioItems() {
    createPlaceholders();
    
    const cachedData = getFromCache();
    if (cachedData) {
        console.log('Using cached portfolio data');
        return cachedData;
    }
    
    try {
        console.log('Fetching fresh portfolio data');
        const response = await fetch('get-portfolio.php');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.error) {
            console.error('Error loading portfolio:', data.error);
            gridContainer.innerHTML = `<div class="error-message">Error loading portfolio: ${data.error}</div>`;
            return [];
        }
        
        saveToCache(data);
        
        return data;
    } catch (error) {
        console.error('Error fetching portfolio items:', error);
        gridContainer.innerHTML = `<div class="error-message">Error loading portfolio: ${error.message}</div>`;
        return [];
    }
}

// Preload images function
function preloadImages(items) {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalImages = items.length;
        
        if (totalImages === 0) {
            resolve();
            return;
        }
        
        items.forEach(item => {
            const img = new Image();
            img.onload = img.onerror = () => {
                loadedCount++;
                if (loadedCount >= totalImages) {
                    resolve();
                }
            };
            img.src = item.src;
        });
        
        setTimeout(() => {
            resolve();
        }, 5000);
    });
}

// Populate grid items
function populateGrid(portfolioItems) {
    gridContainer.innerHTML = '';
    
    portfolioItems.forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.dataset.id = item.id;
        
        let mediaElement;
        if (item.type === 'image') {
            mediaElement = document.createElement('img');
            mediaElement.src = item.src;
            mediaElement.alt = item.title;
            mediaElement.loading = 'lazy';
            
            mediaElement.style.opacity = '0';
            mediaElement.onload = function() { this.style.opacity = '1'; };

        } else if (item.type === 'video') {
			mediaElement = document.createElement('video');
			mediaElement.src = item.src;
			mediaElement.loop = true;
			mediaElement.muted = true;
			mediaElement.playsInline = true;
			mediaElement.autoplay = true;
			mediaElement.loading = 'lazy';
			
			mediaElement.style.opacity = '0';
			mediaElement.onloadeddata = function() {
				this.style.opacity = '1';
				
				const playPromise = this.play();
				if (playPromise !== undefined) {
					playPromise.catch(error => {
						console.log("Autoplay was prevented by the browser:", error);
					});
				}
			};
        }
        
        const infoElement = document.createElement('div');
        infoElement.className = 'info';
        infoElement.innerHTML = `
            <h3>${item.title}</h3>
            <p>${item.tags.join(' • ')}</p>
        `;
        
        gridItem.appendChild(mediaElement);
        gridItem.appendChild(infoElement);
        
        gridItem.addEventListener('click', () => {
            openCarousel(item.id);
        });
        
        if (item.link && item.link.trim() !== '') {
            gridItem.classList.add('has-link-in-carousel');
        }
        
        gridContainer.appendChild(gridItem);
    });
}

// This function creates a placeholder for a carousel item
function createCarouselPlaceholder(item) {
    const carouselItem = document.createElement('div');
    carouselItem.className = 'carousel-item';
    carouselItem.id = `carousel-item-${item.id}`;
    carouselItem.innerHTML = `
        <div class="media-container">
            <div class="carousel-loading-indicator" style="display: flex;">
                <div class="spinner"></div>
            </div>
        </div>
        <div class="carousel-info">
            <div class="carousel-header-info">
                <h2>${item.title}</h2>
            </div>
            <p class="tags">${item.tags.join(' • ')}</p>
        </div>
    `;
    return carouselItem;
}

// UPDATED function to create a single carousel item's content
function createSingleCarouselItemContent(item) {
    // Media Container
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'media-container';
    
    if (item.gallery && item.gallery.length > 1) {
        const galleryContainer = document.createElement('div');
        galleryContainer.className = 'gallery-container';
        
        item.gallery.forEach((imgSrc) => {
            const galleryItemWrapper = document.createElement('div');
            galleryItemWrapper.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = item.title;
            
            galleryItemWrapper.appendChild(img);
            galleryContainer.appendChild(galleryItemWrapper);
        });
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'gallery-nav gallery-prev';
        prevBtn.innerHTML = '&lt;';
        prevBtn.setAttribute('aria-label', 'Previous image');
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'gallery-nav gallery-next';
        nextBtn.innerHTML = '&gt;';
        nextBtn.setAttribute('aria-label', 'Next image');
        
        prevBtn.addEventListener('click', () => {
            galleryContainer.scrollBy({ left: -galleryContainer.clientWidth, behavior: 'smooth' });
        });
        
        nextBtn.addEventListener('click', () => {
            galleryContainer.scrollBy({ left: galleryContainer.clientWidth, behavior: 'smooth' });
        });
        
        mediaContainer.appendChild(prevBtn);
        mediaContainer.appendChild(galleryContainer);
        mediaContainer.appendChild(nextBtn);

    } else if (item.type === 'image' || (item.gallery && item.gallery.length === 1)) {
        const img = document.createElement('img');
        img.src = item.gallery && item.gallery.length === 1 ? item.gallery[0] : item.src;
        img.alt = item.title;
        mediaContainer.appendChild(img);

    } else if (item.type === 'video') {
        const video = document.createElement('video');
        video.src = item.src;
        video.controls = false;
        video.loop = true;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        mediaContainer.appendChild(video);
    }

    // Info Section
    const infoElement = document.createElement('div');
    infoElement.className = 'carousel-info';
    infoElement.innerHTML = `
        <div class="carousel-header-info">
            <h2>${item.title}</h2>
            ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="external-link-btn">Visit Project</a>` : ''}
        </div>
        <div class="description">${formatDescription(item.description)}</div>
        <p class="tags">${item.tags.join(' • ')}</p>
    `;
    
    return { mediaContainer, infoElement };
}

// REWRITTEN openCarousel function for on-demand loading
async function openCarousel(id) {
    carouselContainer.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new Event('carouselOpened'));

    // If the carousel isn't built yet, build it with placeholders
    if (!isCarouselBuilt) {
        carouselWrapper.innerHTML = '';
        carouselNav.innerHTML = ''; // Clear old nav dots

        portfolioData.forEach(item => {
            carouselWrapper.appendChild(createCarouselPlaceholder(item));

            const dot = document.createElement('div');
            dot.className = 'carousel-dot';
            dot.dataset.id = item.id;
            dot.addEventListener('click', () => {
                const targetElement = document.getElementById(`carousel-item-${item.id}`);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
            carouselNav.appendChild(dot);
        });
        isCarouselBuilt = true;
    }

    // Scroll to the target item immediately
    setTimeout(() => {
        const targetElement = document.getElementById(`carousel-item-${id}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'auto' });
            updateActiveDot(id);
            // Load this specific item's data
            loadItemDetails(id); 
        }
    }, 50);

    carouselWrapper.addEventListener('scroll', handleCarouselScroll);
    window.history.pushState({ view: 'carousel', id: id }, '', `#view=${id}`);
}

// NEW function to fetch and populate details for one item
async function loadItemDetails(id) {
    // Don't re-load if we already have the details
    if (loadedItemDetails.has(id)) return;

    try {
        const response = await fetch(`get-item-details.php?id=${id}`);
        if (!response.ok) throw new Error('Item not found');
        
        const itemDetails = await response.json();
        
        const targetElement = document.getElementById(`carousel-item-${itemDetails.id}`);
        if (targetElement) {
            // Create the real content
            const { mediaContainer, infoElement } = createSingleCarouselItemContent(itemDetails);
            
            // Replace the placeholder content
            targetElement.innerHTML = '';
            targetElement.appendChild(mediaContainer);
            targetElement.appendChild(infoElement);
            
            // Mark this item as loaded
            loadedItemDetails.add(itemDetails.id);
        }
    } catch (error) {
        console.error(`Failed to load details for item ${id}:`, error);
        // Optional: display an error in the placeholder
    }
}

// Close carousel
function closeCarousel() {
    carouselContainer.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    if (window.location.hash) {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    
    carouselWrapper.removeEventListener('scroll', handleCarouselScroll);
}

// Helper function to format description text
function formatDescription(text) {
    if (!text) return '';
    
    const paragraphs = text.split(/\n\n+/);
    if (paragraphs.length > 1) {
        return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    } else {
        return `<p>${text.replace(/\n/g, '<br>')}</p>`;
    }
}

// MODIFIED scroll handler to lazy-load items as they appear
function handleCarouselScroll() {
    const carouselItems = document.querySelectorAll('.carousel-item');
    const scrollPosition = carouselWrapper.scrollTop;
    const windowHeight = window.innerHeight;
    
    let activeItemId = -1;

    carouselItems.forEach(item => {
        const itemTop = item.offsetTop;
        const itemHeight = item.offsetHeight;
        
        // Check if item is in view
        const isVisible = itemTop < scrollPosition + windowHeight && itemTop + itemHeight > scrollPosition;

        if (isVisible) {
            const itemId = parseInt(item.id.split('-').pop());
            
            // Load its details if not already loaded
            loadItemDetails(itemId); 
            
            // Determine which item is most central to be "active"
            const itemMiddle = itemTop + itemHeight / 2;
            const windowMiddle = scrollPosition + windowHeight / 2;
            if (Math.abs(itemMiddle - windowMiddle) < windowHeight / 4) {
                activeItemId = itemId;
                 // Play video if visible item is a video
                const video = item.querySelector('video');
                if (video) {
                    video.muted = true;
                    video.play().catch(e => console.log("Autoplay blocked"));
                }
            } else {
                 // Pause video if not the central item
                const video = item.querySelector('video');
                if (video) {
                    video.pause();
                }
            }
        } else {
             // Pause video if not visible at all
            const video = item.querySelector('video');
            if (video) {
                video.pause();
            }
        }
    });

    if (activeItemId !== -1) {
        updateActiveDot(activeItemId);
    }
}


// Update active dot
function updateActiveDot(id) {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach(dot => {
        if (parseInt(dot.dataset.id) === id) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Handle header shrinking on scroll
function handleHeaderScroll() {
    const header = document.querySelector('header');
    const body = document.body;
    
    if (window.scrollY > 10) {
        header.classList.add('scrolled');
        body.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
        body.classList.remove('scrolled');
    }
}

// Initialize
async function init() {
    createPlaceholders();
    
    setupBurgerMenu();
    
    const fetchedItems = await fetchPortfolioItems();
    if (fetchedItems.length === 0) return;
	
	portfolioData = fetchedItems;

    const itemsToPreload = portfolioData.slice(0, 6);
    await preloadImages(itemsToPreload);
    
    populateGrid(portfolioData);
    
    closeBtn.addEventListener('click', closeCarousel);
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeCarousel();
        }
    });
    
    window.addEventListener('popstate', (event) => {
        if (carouselContainer.classList.contains('active')) {
            if (event.state && event.state.view === 'carousel') {
                if (event.state.id) {
                    document.getElementById(`carousel-item-${event.state.id}`).scrollIntoView({ behavior: 'smooth' });
                    updateActiveDot(event.state.id);
                }
            } else {
                closeCarousel();
            }
        } else if (event.state && event.state.view === 'carousel') {
            openCarousel(event.state.id);
        }
    });
    
    if (window.location.hash) {
        const viewMatch = window.location.hash.match(/[#&]view=(\d+)/);
        if (viewMatch && viewMatch[1]) {
            const id = parseInt(viewMatch[1]);
            if (!isNaN(id)) {
                openCarousel(id);
            }
        }
    }
    
    window.addEventListener('scroll', handleHeaderScroll);
	
	const carouselLogo = document.querySelector('.carousel-header .logo-image');
	if (carouselLogo) {
		carouselLogo.style.cursor = 'pointer';
		carouselLogo.addEventListener('click', closeCarousel);
	}
    
    document.addEventListener('carouselOpened', () => {
        const header = document.querySelector('header');
        const body = document.body;
        header.classList.add('scrolled');
        body.classList.add('scrolled');
    });
    
    handleHeaderScroll();
    
	const copyrightNotice = document.getElementById('copyright-notice');
    if (copyrightNotice) {
        const currentYear = new Date().getFullYear();
        copyrightNotice.textContent = `All material copyright Daniel Aldron ${currentYear}`;
    }
	
    if (portfolioData.length > 6) {
        preloadImages(portfolioData.slice(6));
    }
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);