// Simple client-side router
class Router {
    constructor() {
        this.routes = {};
        this.currentPath = window.location.pathname;
        
        // Bind methods
        this.navigate = this.navigate.bind(this);
        this.handleRoute = this.handleRoute.bind(this);
        
        // Add event listeners
        document.addEventListener('DOMContentLoaded', () => {
            document.body.addEventListener('click', (e) => {
                if (e.target.matches('[data-route]')) {
                    e.preventDefault();
                    const path = e.target.getAttribute('href');
                    this.navigate(path);
                }
            });
            
            // Handle browser back/forward
            window.addEventListener('popstate', () => {
                this.currentPath = window.location.pathname;
                this.handleRoute();
            });
            
            // Initial route handling
            this.handleRoute();
        });
    }
    
    addRoute(path, callback) {
        this.routes[path] = callback;
    }
    
    navigate(path) {
        if (path === this.currentPath) return;
        
        // Update the URL without reloading the page
        window.history.pushState({}, '', path);
        this.currentPath = path;
        this.handleRoute();
    }
    
    handleRoute() {
        const path = window.location.pathname;
        const matchingRoute = Object.keys(this.routes).find(route => {
            // Simple exact match for now
            return route === path;
        });
        
        if (matchingRoute) {
            this.routes[matchingRoute]();
        } else {
            // Default route (404)
            if (this.routes['/404']) {
                this.routes['/404']();
            } else {
                console.error('No route found for:', path);
            }
        }
    }
}

// Create and export a singleton instance
const router = new Router();

// Helper function for navigation
export function navigateTo(path) {
    router.navigate(path);
}

export default router;
