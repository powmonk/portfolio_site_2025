// Cache constants
const CACHE_KEY = 'portfolio_data_cache';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

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
    /*
    // For accessibility and better UX, let users swipe up from bottom of screen to open menu
    let bodyTouchStartY = 0;
    let bodyTouchEndY = 0;
    
    // Touch start event on body
    document.body.addEventListener('touchstart', (e) => {
        // Only capture touches near the bottom of the screen
        if (e.changedTouches[0].screenY > window.innerHeight * 0.8) {
            bodyTouchStartY = e.changedTouches[0].screenY;
        }
    }, { passive: true });
    
    // Touch end event on body
    document.body.addEventListener('touchend', (e) => {
        if (bodyTouchStartY > 0) { // Only if we captured a valid start position
            bodyTouchEndY = e.changedTouches[0].screenY;
            const swipeDistance = bodyTouchStartY - bodyTouchEndY;
            
            // If swiped up from bottom edge and menu is not already open
            if (swipeDistance > minSwipeDistance && !menuOverlay.classList.contains('active')) {
                toggleMenu();
            }
            
            // Reset for next swipe
            bodyTouchStartY = 0;
        }
    }, { passive: true });
	*/
}

// DOM elements
const gridContainer = document.querySelector('.grid-container');
const carouselContainer = document.querySelector('.carousel-container');
const carouselWrapper = document.querySelector('.carousel-wrapper');
const carouselNav = document.querySelector('.carousel-nav');
const closeBtn = document.querySelector('.close-btn');

// script.js
let portfolioData = []; // Will hold the lightweight grid data
let fullPortfolioData = []; // Will hold the full carousel data
let isCarouselBuilt = false; // Flag to check if the carousel DOM is ready

// Create placeholder grid items
function createPlaceholders(count = 6) {
    gridContainer.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const placeholderItem = document.createElement('div');
        placeholderItem.className = 'grid-item placeholder';
        
        // Create placeholder shimmer effect
        const shimmer = document.createElement('div');
        shimmer.className = 'shimmer-effect';
        
        // Create placeholder image
        const placeholderImage = document.createElement('div');
        placeholderImage.className = 'placeholder-image';
        
        // Create placeholder info
        const placeholderInfo = document.createElement('div');
        placeholderInfo.className = 'placeholder-info';
        
        // Create placeholder title
        const placeholderTitle = document.createElement('div');
        placeholderTitle.className = 'placeholder-title';
        
        // Create placeholder tags
        const placeholderTags = document.createElement('div');
        placeholderTags.className = 'placeholder-tags';
        
        // Append all elements
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
        
        // Check if cache is still valid
        if (now - parsedData.timestamp < CACHE_DURATION) {
            return parsedData.data;
        } else {
            // Cache expired, remove it
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
    } catch (error) {
        console.warn('Failed to retrieve from cache:', error);
        return null;
    }
}

// Fetch portfolio items from PHP script with caching
// script.js

// Fetch portfolio items from PHP script with caching
async function fetchPortfolioItems() {
    // Show placeholders while loading
    createPlaceholders();
    
    // Try to get data from cache first
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
        
        // Save the data to cache for future use
        saveToCache(data);
        
        return data;
    } catch (error) {
        console.error('Error fetching portfolio items:', error);
        gridContainer.innerHTML = `<div class="error-message">Error loading portfolio: ${error.message}</div>`;
        return [];
    }
}
// script.js

// This function creates all carousel items and nav dots from a full data array
async function openCarousel(id) {
    // Show the main carousel container
    carouselContainer.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new Event('carouselOpened'));

    // If the carousel has NOT been built yet...
    if (!isCarouselBuilt) {
        // ...show a loading indicator.
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'carousel-loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div>';
        carouselContainer.appendChild(loadingIndicator);

        try {
            // Fetch the FULL data from our new endpoint
            const response = await fetch('get-portfolio-full.php');
            fullPortfolioData = await response.json();
            
            // Now, build the entire carousel with all items
            createCarouselItems(fullPortfolioData);
            
            isCarouselBuilt = true; // Mark it as built!

        } catch (error) {
            console.error('Failed to load full portfolio:', error);
            // You can add error handling here
        } finally {
            // ALWAYS remove the loading indicator
            carouselContainer.removeChild(loadingIndicator);
        }
    }

    // Now that the carousel is built, scroll to the correct item
    // A small timeout ensures the browser has rendered the new items
    setTimeout(() => {
        const targetElement = document.getElementById(`carousel-item-${id}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'auto' }); // Use 'auto' for instant jump
            updateActiveDot(id);
        }
    }, 50);

    // Add scroll listener and history state
    carouselWrapper.addEventListener('scroll', handleCarouselScroll);
    window.history.pushState({ view: 'carousel', id: id }, '', `#view=${id}`);
}

// Preload images function
function preloadImages(items) {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalImages = items.length;
        
        // If no images to preload, resolve immediately
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
        
        // Set a timeout to resolve anyway after 5 seconds
        // This prevents waiting indefinitely if some images fail to load
        setTimeout(() => {
            resolve();
        }, 5000);
    });
}

// Populate grid items - Updated to remove direct linking from tiles
function populateGrid(portfolioItems) {
    gridContainer.innerHTML = '';
    
    portfolioItems.forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        gridItem.dataset.id = item.id;
        
        // Create media element (image or video)
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
			
			// Add fade-in effect and attempt to play when video loads
			mediaElement.style.opacity = '0';
			mediaElement.onloadeddata = function() {
				this.style.opacity = '1';
				
				// Explicitly call play() for better browser compatibility
				const playPromise = this.play();
				if (playPromise !== undefined) {
					playPromise.catch(error => {
						// This catches errors if the browser blocks autoplay
						console.log("Autoplay was prevented by the browser:", error);
					});
				}
			};
        }
        
        // Create info element with title and tags
        const infoElement = document.createElement('div');
        infoElement.className = 'info';
        infoElement.innerHTML = `
            <h3>${item.title}</h3>
            <p>${item.tags.join(' • ')}</p>
        `;
        
        gridItem.appendChild(mediaElement);
        gridItem.appendChild(infoElement);
        
        // This adds the click event listener back to every grid item
        gridItem.addEventListener('click', () => {
            console.log('Grid item clicked, id:', item.id); // Debugging line
            openCarousel(item.id);
        });
        
        // Add a special class if the item has a link
        if (item.link && item.link.trim() !== '') {
            gridItem.classList.add('has-link-in-carousel');
        }
        
        gridContainer.appendChild(gridItem);
    });
}

// Create the carousel items
// In script.js

function createCarouselItems(portfolioItems) {
    carouselWrapper.innerHTML = '';
    carouselNav.innerHTML = '';
    
    portfolioItems.forEach((item, index) => {
        // Create carousel item
        const carouselItem = document.createElement('div');
        carouselItem.className = 'carousel-item';
        carouselItem.id = `carousel-item-${item.id}`;
        
        // Create media container
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'media-container';
        
        // Check if there is a gallery with more than one image
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
            
            // --- START: Re-added button creation logic ---
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
            mediaContainer.appendChild(nextBtn);
            // --- END: Re-added button creation logic ---

            mediaContainer.appendChild(galleryContainer);

        } else if (item.type === 'image' || (item.gallery && item.gallery.length === 1)) {
            // Handle single images or "galleries" with only one image
            const img = document.createElement('img');
            img.src = item.gallery && item.gallery.length === 1 ? item.gallery[0] : item.src;
            img.alt = item.title;
            mediaContainer.appendChild(img);

        } else if (item.type === 'video') {
            const video = document.createElement('video');
            video.src = item.src;
            video.controls = true;
            video.loop = true;
            video.autoplay = true;
            video.muted = true;
            mediaContainer.appendChild(video);
        }

        // Create info section
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

        carouselItem.appendChild(mediaContainer);
        carouselItem.appendChild(infoElement);
        carouselWrapper.appendChild(carouselItem);
        
        // Create navigation dot
        const dot = document.createElement('div');
        dot.className = 'carousel-dot';
        dot.dataset.id = item.id;
        carouselNav.appendChild(dot);
        
        dot.addEventListener('click', () => {
            document.getElementById(`carousel-item-${item.id}`).scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Close carousel
function closeCarousel() {
    carouselContainer.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Remove the hash from the URL without triggering a page reload
    if (window.location.hash) {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    
    // Remove scroll event
    carouselWrapper.removeEventListener('scroll', handleCarouselScroll);
}

// This function builds the navigation dots on the side
function buildCarouselNav(portfolioItems) {
    carouselNav.innerHTML = '';
    portfolioItems.forEach(item => {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot';
        dot.dataset.id = item.id;
        carouselNav.appendChild(dot);

        dot.addEventListener('click', () => {
            // We call openCarousel which will handle fetching and showing
            openCarousel(item.id);
        });
    });
}

// This function creates the HTML for a SINGLE carousel item
// It will be called after we fetch the item's full details
function createSingleCarouselItem(item) {
    // Check if this item's slide already exists in the DOM
    if (document.getElementById(`carousel-item-${item.id}`)) {
        return; // Do nothing if it's already there
    }

    const carouselItem = document.createElement('div');
    carouselItem.className = 'carousel-item';
    carouselItem.id = `carousel-item-${item.id}`;

    // --- This is the same logic from your original createCarouselItems function, ---
    // --- but it now works for just one item. ---

    // Create media container, info section, etc.
    const mediaContainer = document.createElement('div');
    mediaContainer.className = 'media-container';
    // ... (Add the rest of your media container logic here, including gallery, video, etc.)
    // For simplicity, here's a basic version:
    let mediaElement;
    if (item.type === 'image') {
        mediaElement = document.createElement('img');
    } else {
        mediaElement = document.createElement('video');
        mediaElement.controls = true;
    }
    mediaElement.src = item.src;
    mediaContainer.appendChild(mediaElement);

    const infoElement = document.createElement('div');
    infoElement.className = 'carousel-info';
    infoElement.innerHTML = `
        <div class="carousel-header-info">
            <h2>${item.title}</h2>
            ${item.link ? `<a href="${item.link}" target="_blank" class="external-link-btn">Visit Project</a>` : ''}
        </div>
        <div class="description">${formatDescription(item.description)}</div>
        <p class="tags">${item.tags.join(' • ')}</p>
    `;

    carouselItem.appendChild(mediaContainer);
    carouselItem.appendChild(infoElement);

    // Add the new item to the carousel wrapper
    carouselWrapper.appendChild(carouselItem);
}

// Helper function to format description text
function formatDescription(text) {
    if (!text) return '';
    
    // Convert line breaks to paragraphs
    const paragraphs = text.split(/\n\n+/);
    if (paragraphs.length > 1) {
        return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    } else {
        return `<p>${text.replace(/\n/g, '<br>')}</p>`;
    }
}

// Open carousel
// Keep track of whether the nav dots have been built
let isNavBuilt = false;

// In script.js

async function openCarousel(id) {
    console.log('openCarousel function called with id:', id); // Debugging line

    // Show the main carousel container
    carouselContainer.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.dispatchEvent(new Event('carouselOpened'));

    // If the carousel has NOT been built yet...
    if (!isCarouselBuilt) {
        // ...show a loading indicator.
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'carousel-loading-indicator';
        loadingIndicator.innerHTML = '<div class="spinner"></div>';
        carouselContainer.appendChild(loadingIndicator);

        try {
            // Fetch the FULL data from our new endpoint
            const response = await fetch('get-portfolio-full.php');
            fullPortfolioData = await response.json();
            
            // Now, build the entire carousel with all items
            createCarouselItems(fullPortfolioData);
            
            isCarouselBuilt = true; // Mark it as built!

        } catch (error) {
            console.error('Failed to load full portfolio:', error);
            // You can add error handling here
        } finally {
            // ALWAYS remove the loading indicator
            carouselContainer.removeChild(loadingIndicator);
        }
    }

    // Now that the carousel is built, scroll to the correct item
    setTimeout(() => {
        const targetElement = document.getElementById(`carousel-item-${id}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'auto' });
            updateActiveDot(id);
        }
    }, 50);

    // Add scroll listener and history state
    carouselWrapper.addEventListener('scroll', handleCarouselScroll);
    window.history.pushState({ view: 'carousel', id: id }, '', `#view=${id}`);
}

// Handle carousel scroll
function handleCarouselScroll() {
    const carouselItems = document.querySelectorAll('.carousel-item');
    const scrollPosition = carouselWrapper.scrollTop;
    const windowHeight = window.innerHeight;
    
    carouselItems.forEach(item => {
        const itemTop = item.offsetTop;
        const itemHeight = item.offsetHeight;
        const itemMiddle = itemTop + itemHeight / 2;
        const windowMiddle = scrollPosition + windowHeight / 2;
        
        if (Math.abs(itemMiddle - windowMiddle) < windowHeight / 4) {
            const itemId = parseInt(item.id.split('-').pop());
            updateActiveDot(itemId);
            
            // Play video if visible item is a video
            const video = item.querySelector('video');
            if (video) {
                // Ensure video is muted during autoplay
                video.muted = true;
                video.play();
            }
        } else {
            // Pause video if not visible
            const video = item.querySelector('video');
            if (video) {
                video.pause();
            }
        }
    });
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

// Function to toggle full screen media view
function toggleFullScreenMedia(mediaElement) {
    // Create or remove full screen container
    const existingContainer = document.querySelector('.fullscreen-media-container');
    
    if (existingContainer) {
        document.body.removeChild(existingContainer);
        document.body.style.overflow = '';
        
        // Return to carousel state in browser history
        const currentHash = window.location.hash;
        const match = currentHash.match(/[#&]view=(\d+)/);
        if (match && match[1]) {
            const id = match[1];
            window.history.pushState({ view: 'carousel', id: id }, '', `#view=${id}`);
        }
        return;
    }
    
    // Create full screen container
    const fullscreenContainer = document.createElement('div');
    fullscreenContainer.className = 'fullscreen-media-container';
    
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'fullscreen-loading-indicator';
    loadingIndicator.innerHTML = '<div class="spinner"></div>';
    fullscreenContainer.appendChild(loadingIndicator);
    
    // Clone the media element
    let fullscreenMedia;
    if (mediaElement.tagName === 'IMG') {
        fullscreenMedia = document.createElement('img');
        fullscreenMedia.src = mediaElement.src;
        fullscreenMedia.alt = mediaElement.alt;
        fullscreenMedia.onload = function() {
            loadingIndicator.style.display = 'none';
        };
    } else if (mediaElement.tagName === 'VIDEO') {
        fullscreenMedia = document.createElement('video');
        fullscreenMedia.src = mediaElement.src;
        fullscreenMedia.controls = true;
        fullscreenMedia.autoplay = true;
        fullscreenMedia.muted = false; // Allow sound in full screen mode
        fullscreenMedia.onloadeddata = function() {
            loadingIndicator.style.display = 'none';
        };
        
        // If the original video was playing, start playing the fullscreen one
        if (!mediaElement.paused) {
            fullscreenMedia.currentTime = mediaElement.currentTime;
        }
    }
    
    fullscreenMedia.className = 'fullscreen-media';
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'fullscreen-close-btn';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(fullscreenContainer);
        document.body.style.overflow = '';
        
        // Return to carousel state in browser history
        const currentHash = window.location.hash;
        const match = currentHash.match(/[#&]view=(\d+)/);
        if (match && match[1]) {
            const id = match[1];
            window.history.pushState({ view: 'carousel', id: id }, '', `#view=${id}`);
        }
    });
    
    // Find the current item ID from URL
    const currentHash = window.location.hash;
    const match = currentHash.match(/[#&]view=(\d+)/);
    let itemId = null;
    if (match && match[1]) {
        itemId = match[1];
    }
    
    // Add history entry for fullscreen view
    if (itemId) {
        window.history.pushState({ view: 'fullscreen', id: itemId }, '', `#view=${itemId}&fullscreen=true`);
    }
    
    // Add click event to close on background click
    fullscreenContainer.addEventListener('click', (e) => {
        if (e.target === fullscreenContainer) {
            document.body.removeChild(fullscreenContainer);
            document.body.style.overflow = '';
            
            // Return to carousel state in browser history
            if (itemId) {
                window.history.pushState({ view: 'carousel', id: itemId }, '', `#view=${itemId}`);
            }
        }
    });
    
    // Add escape key to close
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(fullscreenContainer);
            document.body.style.overflow = '';
            
            // Return to carousel state in browser history
            if (itemId) {
                window.history.pushState({ view: 'carousel', id: itemId }, '', `#view=${itemId}`);
            }
            
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Append elements
    fullscreenContainer.appendChild(fullscreenMedia);
    fullscreenContainer.appendChild(closeButton);
    document.body.appendChild(fullscreenContainer);
    document.body.style.overflow = 'hidden';
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
    // Display placeholders immediately
    createPlaceholders();
    
    // Set up burger menu (this can happen in parallel with data loading)
    setupBurgerMenu();
    
    // Fetch portfolio items (with caching)
    const portfolioItems = await fetchPortfolioItems();
    if (portfolioItems.length === 0) return;
	
	portfolioData = portfolioItems; // Added 2025_08_28

    
    // Preload the first few images before rendering the grid
    const itemsToPreload = portfolioItems.slice(0, 6); // Preload first 6 items
    await preloadImages(itemsToPreload);
    
    // Now populate the grid and carousel
    populateGrid(portfolioItems);
    //2025_08_28
	//createCarouselItems(portfolioItems); //Now called later
    
    // Add event listener to close button
    closeBtn.addEventListener('click', closeCarousel);
    
    // Add event listener to close carousel on escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeCarousel();
        }
    });
    
    // Handle browser back/forward button clicks
    window.addEventListener('popstate', (event) => {
        // Check if fullscreen view is active
        const fullscreenContainer = document.querySelector('.fullscreen-media-container');
        if (fullscreenContainer) {
            // Close fullscreen view
            document.body.removeChild(fullscreenContainer);
            document.body.style.overflow = '';
            
            // We're now in carousel view, don't close it
            return;
        }
        
        // Check if carousel view is active
        if (carouselContainer.classList.contains('active')) {
            // Check if we should stay in carousel view or go back to grid
            if (event.state && event.state.view === 'carousel') {
                // Stay in carousel, maybe scroll to a different item
                if (event.state.id) {
                    document.getElementById(`carousel-item-${event.state.id}`).scrollIntoView({ behavior: 'smooth' });
                    updateActiveDot(event.state.id);
                }
            } else {
                // Go back to grid view
                closeCarousel();
            }
        } else if (event.state && event.state.view === 'carousel') {
            // Open carousel to the specified item
            openCarousel(event.state.id);
        }
    });
    

    // Check if there's a hash in the URL to open a specific item
    if (window.location.hash) {
        const viewMatch = window.location.hash.match(/[#&]view=(\d+)/);
        const fullscreenMatch = window.location.hash.match(/[#&]fullscreen=true/);
        
        if (viewMatch && viewMatch[1]) {
            const id = parseInt(viewMatch[1]);
            if (!isNaN(id)) {
                openCarousel(id);
                
                // If fullscreen is also specified, open fullscreen view after a short delay
                if (fullscreenMatch) {
                    setTimeout(() => {
                        const mediaElement = document.querySelector(`#carousel-item-${id} .media-container > *:not(.carousel-loading-indicator)`);
                        if (mediaElement) {
                            toggleFullScreenMedia(mediaElement);
                        }
                    }, 500);
                }
            }
        }
    }
    
    // Handle header shrinking on scroll
    window.addEventListener('scroll', handleHeaderScroll);
	
	// Make the carousel logo a button to return to the grid view
	const carouselLogo = document.querySelector('.carousel-header .logo-image');
	if (carouselLogo) {
		carouselLogo.style.cursor = 'pointer'; // Make it look clickable
		carouselLogo.addEventListener('click', closeCarousel);
	}
    
    // Shrink header when opening carousel view
    document.addEventListener('carouselOpened', () => {
        const header = document.querySelector('header');
        const body = document.body;
        header.classList.add('scrolled');
        body.classList.add('scrolled');
    });
    
    // Initialize header state
    handleHeaderScroll();
    
	const copyrightNotice = document.getElementById('copyright-notice');
    if (copyrightNotice) {
        const currentYear = new Date().getFullYear();
        copyrightNotice.textContent = `All material copyright Daniel Aldron ${currentYear}`;
    }
	
    // Continue preloading remaining images in the background
    if (portfolioItems.length > 6) {
        preloadImages(portfolioItems.slice(6));
    }
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
