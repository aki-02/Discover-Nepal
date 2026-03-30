// Wishlist Management System

class WishlistManager {
    constructor() {
        this.storageKey = 'nepal-wishlist';
        this.loadWishlist();
    }

    loadWishlist() {
        const saved = localStorage.getItem(this.storageKey);
        this.items = saved ? JSON.parse(saved) : [];
    }

    saveWishlist() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
        this.updateWishlistDisplay();
        this.updateAllHeartButtons();
    }

    addToWishlist(destination) {
        const exists = this.items.some(item => item.name === destination.name);
        if (!exists) {
            this.items.push(destination);
            this.saveWishlist();
            this.showNotification(`${destination.name} added to wishlist!`, 'success');
        } else {
            this.showNotification(`${destination.name} is already in your wishlist!`, 'info');
        }
    }

    removeFromWishlist(name) {
        this.items = this.items.filter(item => item.name !== name);
        this.saveWishlist();
        this.showNotification(`Removed from wishlist!`, 'info');
    }

    isInWishlist(name) {
        return this.items.some(item => item.name === name);
    }

    getWishlist() {
        return this.items;
    }

    clearWishlist() {
        if (confirm('Are you sure you want to clear your entire wishlist?')) {
            this.items = [];
            this.saveWishlist();
            this.showNotification('Wishlist cleared!', 'info');
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateWishlistDisplay() {
        const itemsContainer = document.getElementById('wishlist-items');
        const emptyMessage = document.getElementById('empty-wishlist');

        if (!itemsContainer) return;

        if (this.items.length === 0) {
            itemsContainer.innerHTML = '';
            if (emptyMessage) emptyMessage.style.display = 'block';
        } else {
            if (emptyMessage) emptyMessage.style.display = 'none';
            itemsContainer.innerHTML = this.items.map(item => `
                <div class="wishlist-item">
                    <img src="${item.image}" alt="${item.name}" class="wishlist-item-image">
                    <div class="wishlist-item-content">
                        <h3>${item.name}</h3>
                        <p class="item-type">${item.type || 'Destination'}</p>
                        <p class="item-description">${item.description || ''}</p>
                    </div>
                    <div class="wishlist-item-actions">
                        <button class="remove-btn" onclick="wishlistManager.removeFromWishlist('${item.name}')">Remove</button>
                        <a href="${item.link}" class="learn-more-btn">Learn More</a>
                    </div>
                </div>
            `).join('');
        }
    }

    updateAllHeartButtons() {
        document.querySelectorAll('.heart-btn').forEach(btn => {
            const destination = btn.getAttribute('data-destination');
            if (this.isInWishlist(destination)) {
                btn.classList.add('active');
                btn.innerHTML = '❤️';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '🤍';
            }
        });
    }
}

// Initialize wishlist manager globally
const wishlistManager = new WishlistManager();

document.addEventListener('DOMContentLoaded', () => {
    // Initialize wishlist page if we're on it
    if (document.getElementById('wishlist-items')) {
        wishlistManager.updateWishlistDisplay();
        
        const clearBtn = document.getElementById('clear-wishlist-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => wishlistManager.clearWishlist());
        }
    }

    // Update all heart buttons to show correct state
    wishlistManager.updateAllHeartButtons();

    // Add heart button functionality to destination cards
    document.querySelectorAll('.heart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const destination = btn.getAttribute('data-destination');
            const image = btn.getAttribute('data-image');
            const type = btn.getAttribute('data-type');
            const description = btn.getAttribute('data-description');
            const link = btn.getAttribute('data-link');

            if (wishlistManager.isInWishlist(destination)) {
                wishlistManager.removeFromWishlist(destination);
            } else {
                wishlistManager.addToWishlist({
                    name: destination,
                    image: image,
                    type: type,
                    description: description,
                    link: link
                });
            }
        });
    });
});
