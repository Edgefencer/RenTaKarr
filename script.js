// Global variables
let currentCars = [];
let comparisonCars = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadCars();
    displayCars(carsData);
});

function loadCars() {
    currentCars = [...carsData];
}

// Display cars in the grid
function displayCars(cars) {
    const carsGrid = document.getElementById('carsGrid');
    carsGrid.innerHTML = '';

    if (cars.length === 0) {
        carsGrid.innerHTML = '<div class="no-cars">No vehicles found matching your criteria.</div>';
        return;
    }

    cars.forEach(car => {
        const carCard = document.createElement('div');
        carCard.className = 'car-card';
        carCard.innerHTML = `
            <img class="car-image" src="${car.image}" alt="${car.brand} ${car.model}" onerror="this.style.display='none'">
            <div class="car-info">
                <div class="car-header">
                    <div class="car-title">
                        <h3>${car.brand} ${car.model}</h3>
                        <span class="type">${car.type} • ${car.year}</span>
                    </div>
                    <div class="car-price price-php">${car.price.toLocaleString()}/day</div>
                </div>
                <div class="car-details">
                    <p>${car.transmission} • ${car.fuelType}</p>
                    <p>Mileage: ${car.mileage.toLocaleString()} km</p>
                    <p>Seats: ${car.seats}</p>
                </div>
                <div class="status ${car.available ? 'available' : 'rented'}">
                    ${car.available ? 'Available' : 'Currently Rented'}
                </div>
                <div class="car-actions">
                    <button class="btn btn-primary" onclick="showCarDetails(${car.id})">View Details</button>
                    <button class="btn btn-secondary" onclick="addToComparison(${car.id})">Compare</button>
                </div>
            </div>
        `;
        carsGrid.appendChild(carCard);
    });
}

// Search functionality
function searchCars() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredCars = carsData.filter(car => 
        car.brand.toLowerCase().includes(searchTerm) || 
        car.model.toLowerCase().includes(searchTerm) ||
        car.type.toLowerCase().includes(searchTerm)
    );
    displayCars(filteredCars);
}

// Filter functionality
function filterCars() {
    const typeFilter = document.getElementById('typeFilter').value;
    const brandFilter = document.getElementById('brandFilter').value;
    const priceFilter = document.getElementById('priceFilter').value;

    let filteredCars = carsData.filter(car => {
        const matchesType = !typeFilter || car.type === typeFilter;
        const matchesBrand = !brandFilter || car.brand === brandFilter;
        
        let matchesPrice = true;
        if (priceFilter) {
            const [min, max] = priceFilter.split('-').map(Number);
            matchesPrice = car.price >= min && car.price <= max;
        }
        
        return matchesType && matchesBrand && matchesPrice;
    });

    displayCars(filteredCars);
}

// Sort functionality
function sortCars() {
    const sortValue = document.getElementById('sortSelect').value;
    let sortedCars = [...currentCars];

    switch (sortValue) {
        case 'price-low':
            sortedCars.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedCars.sort((a, b) => b.price - a.price);
            break;
        case 'year-new':
            sortedCars.sort((a, b) => b.year - a.year);
            break;
        case 'year-old':
            sortedCars.sort((a, b) => a.year - b.year);
            break;
        default:
            return;
    }

    displayCars(sortedCars);
}

// Show car details in modal
function showCarDetails(carId) {
    const car = carsData.find(c => c.id === carId);
    const modalContent = document.getElementById('modalContent');
    
    modalContent.innerHTML = `
        <div class="car-detail-view">
            <img class="detail-image" src="${car.image}" alt="${car.brand} ${car.model}" onerror="this.style.display='none'">
            <div class="detail-info">
                <h2>${car.brand} ${car.model}</h2>
                <p>${car.description}</p>
                <div class="specs-grid">
                    <div class="spec-item"><strong>Vehicle Type:</strong> ${car.type}</div>
                    <div class="spec-item"><strong>Model Year:</strong> ${car.year}</div>
                    <div class="spec-item"><strong>Daily Rate:</strong> <span class="price-php">${car.price.toLocaleString()}</span>/day</div>
                    <div class="spec-item"><strong>Transmission:</strong> ${car.transmission}</div>
                    <div class="spec-item"><strong>Fuel Type:</strong> ${car.fuelType}</div>
                    <div class="spec-item"><strong>Mileage:</strong> ${car.mileage.toLocaleString()} km</div>
                    <div class="spec-item"><strong>Seating Capacity:</strong> ${car.seats}</div>
                    <div class="spec-item"><strong>Availability:</strong> <span class="status ${car.available ? 'available' : 'rented'}">${car.available ? 'Available' : 'Currently Rented'}</span></div>
                </div>
                <div class="features">
                    <h3>Features & Amenities</h3>
                    ${car.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                </div>
                <button class="book-btn" ${!car.available ? 'disabled' : ''}>${car.available ? 'Reserve This Vehicle' : 'Currently Unavailable'}</button>
            </div>
        </div>
    `;
    
    document.getElementById('carModal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('carModal').style.display = 'none';
}

// Add car to comparison
function addToComparison(carId) {
    const car = carsData.find(c => c.id === carId);
    
    if (comparisonCars.length >= 3) {
        alert('You can only compare up to 3 vehicles at a time.');
        return;
    }
    
    if (!comparisonCars.some(c => c.id === carId)) {
        comparisonCars.push(car);
        updateComparisonView();
    }
}

// Update comparison view
function updateComparisonView() {
    const comparisonSection = document.getElementById('comparisonSection');
    const comparisonCarsDiv = document.getElementById('comparisonCars');
    
    if (comparisonCars.length > 0) {
        comparisonSection.style.display = 'block';
        comparisonCarsDiv.innerHTML = comparisonCars.map(car => `
            <div class="car-card">
                <img class="car-image" src="${car.image}" alt="${car.brand} ${car.model}" onerror="this.style.display='none'">
                <div class="car-info">
                    <h3>${car.brand} ${car.model}</h3>
                    <p>Type: ${car.type}</p>
                    <p>Year: ${car.year}</p>
                    <p>Price: <span class="price-php">${car.price.toLocaleString()}</span>/day</p>
                    <p>Transmission: ${car.transmission}</p>
                    <p>Fuel: ${car.fuelType}</p>
                    <p>Seats: ${car.seats}</p>
                    <div class="status ${car.available ? 'available' : 'rented'}">
                        ${car.available ? 'Available' : 'Rented'}
                    </div>
                    <button class="btn btn-secondary" onclick="removeFromComparison(${car.id})" style="margin-top: 10px;">Remove</button>
                </div>
            </div>
        `).join('');
    } else {
        comparisonSection.style.display = 'none';
    }
}

// Remove car from comparison
function removeFromComparison(carId) {
    comparisonCars = comparisonCars.filter(car => car.id !== carId);
    updateComparisonView();
}

// Clear comparison
function clearComparison() {
    comparisonCars = [];
    updateComparisonView();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('carModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Enhanced search with Enter key support
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchCars();
    }
});

// Add loading state for better UX
function showLoading() {
    const carsGrid = document.getElementById('carsGrid');
    carsGrid.innerHTML = '<div class="no-cars">Loading vehicles...</div>';
}

// Enhanced car data with multiple images (optional future feature)
function showImageGallery(car) {
    // This can be expanded to show multiple images in a gallery
    if (car.images && car.images.length > 0) {
        return `
            <div class="image-gallery">
                ${car.images.map(img => `<img src="${img}" alt="${car.brand} ${car.model}">`).join('')}
            </div>
        `;
    }
    return `<img class="detail-image" src="${car.image}" alt="${car.brand} ${car.model}" onerror="this.style.display='none'">`;
}