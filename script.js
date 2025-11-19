// Global variables
let currentCars = [];
let comparisonCars = [];
let currentBooking = {};
let selectedPaymentMethod = '';
let bookings = JSON.parse(localStorage.getItem('avisBookings')) || [];

// Philippine payment methods
const paymentMethods = [
    { id: 'credit_card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'gcash', name: 'GCash', icon: '📱' },
    { id: 'paymaya', name: 'PayMaya', icon: '💜' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' }
];

// Additional services
const additionalServices = [
    { id: 1, name: 'Additional Driver', price: 300, description: 'Add another authorized driver' },
    { id: 2, name: 'Child Safety Seat', price: 200, description: 'Safety seat for children' },
    { id: 3, name: 'GPS Navigation', price: 150, description: 'Portable GPS device' },
    { id: 4, name: 'Insurance Coverage', price: 500, description: 'Extended insurance protection' }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadCars();
    displayCars(carsData);
    updateCarAvailability(); // Update availability based on existing bookings
});

// Load cars data
function loadCars() {
    currentCars = [...carsData];
}

// Update car availability based on existing bookings
function updateCarAvailability() {
    const today = new Date().toISOString().split('T')[0];
    
    carsData.forEach(car => {
        // Check if car has active bookings
        const activeBookings = bookings.filter(booking => 
            booking.carId === car.id && 
            booking.status === 'confirmed' &&
            booking.returnDate >= today
        );
        
        // Update availability
        car.available = activeBookings.length === 0;
    });
    
    // Update currentCars as well
    currentCars = [...carsData];
}

// Check if car is available for selected dates
function isCarAvailable(carId, pickupDate, returnDate) {
    const car = carsData.find(c => c.id === carId);
    if (!car.available) return false;
    
    // Check for booking conflicts
    const conflictingBookings = bookings.filter(booking => 
        booking.carId === carId && 
        booking.status === 'confirmed' &&
        !(returnDate < booking.pickupDate || pickupDate > booking.returnDate)
    );
    
    return conflictingBookings.length === 0;
}

// Enhanced date validation
function validateDates(pickupDate, returnDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    
    // Check if dates are valid
    if (isNaN(pickup.getTime()) || isNaN(returnD.getTime())) {
        return { valid: false, message: 'Please select valid dates' };
    }
    
    // Check if pickup is in the past
    if (pickup < today) {
        return { valid: false, message: 'Pick-up date cannot be in the past' };
    }
    
    // Check if return is before pickup
    if (returnD <= pickup) {
        return { valid: false, message: 'Return date must be after pick-up date' };
    }
    
    // Check if rental period is reasonable (max 30 days for demo)
    const days = Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24));
    if (days > 30) {
        return { valid: false, message: 'Maximum rental period is 30 days' };
    }
    
    if (days < 1) {
        return { valid: false, message: 'Minimum rental period is 1 day' };
    }
    
    return { valid: true, days: days };
}

// Generate unique confirmation number
function generateConfirmationNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return 'AV' + timestamp.slice(-8) + random;
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

// Enhanced car details with booking option
function showCarDetails(carId) {
    const car = carsData.find(c => c.id === carId);
    const modalContent = document.getElementById('modalContent');
    
    // Enhanced vehicle specifications
    const enhancedSpecs = car.specifications || {
        engine: `${car.engine || '1.5L 4-cylinder'}`,
        horsepower: car.horsepower || '107 HP',
        fuelCapacity: car.fuelCapacity || '42 liters',
        fuelConsumption: car.fuelConsumption || '15-20 km/L',
        dimensions: car.dimensions || '4,425mm L x 1,730mm W',
        trunkCapacity: car.trunkCapacity || '480 liters',
        warranty: car.warranty || '3 years / 100,000 km'
    };

    // Multiple images gallery
    const carImages = car.images || [car.image, car.image, car.image, car.image];
    
    modalContent.innerHTML = `
        <div class="car-detail-view">
            <div class="vehicle-images">
                <div class="image-gallery-main">
                    <img src="${carImages[0]}" alt="${car.brand} ${car.model}" id="mainCarImage" onerror="this.style.display='none'">
                </div>
                <div class="image-gallery-thumbnails">
                    ${carImages.map((img, index) => `
                        <div class="gallery-thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">
                            <img src="${img}" alt="${car.brand} ${car.model} - View ${index + 1}" onerror="this.style.display='none'">
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="detail-info">
                <h2>${car.brand} ${car.model}</h2>
                <p>${car.description}</p>
                
                <div class="vehicle-specs-enhanced">
                    <div class="spec-category">
                        <h4>Vehicle Specifications</h4>
                        <div class="spec-detail"><span class="label">Type:</span><span class="value">${car.type}</span></div>
                        <div class="spec-detail"><span class="label">Year:</span><span class="value">${car.year}</span></div>
                        <div class="spec-detail"><span class="label">Transmission:</span><span class="value">${car.transmission}</span></div>
                        <div class="spec-detail"><span class="label">Fuel Type:</span><span class="value">${car.fuelType}</span></div>
                        <div class="spec-detail"><span class="label">Seating Capacity:</span><span class="value">${car.seats} persons</span></div>
                    </div>
                    
                    <div class="spec-category">
                        <h4>Technical Details</h4>
                        <div class="spec-detail"><span class="label">Engine:</span><span class="value">${enhancedSpecs.engine}</span></div>
                        <div class="spec-detail"><span class="label">Horsepower:</span><span class="value">${enhancedSpecs.horsepower}</span></div>
                        <div class="spec-detail"><span class="label">Fuel Capacity:</span><span class="value">${enhancedSpecs.fuelCapacity}</span></div>
                        <div class="spec-detail"><span class="label">Fuel Consumption:</span><span class="value">${enhancedSpecs.fuelConsumption}</span></div>
                        <div class="spec-detail"><span class="label">Dimensions:</span><span class="value">${enhancedSpecs.dimensions}</span></div>
                    </div>
                </div>
                
                <div class="features">
                    <h3>Features & Amenities</h3>
                    ${car.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')}
                </div>
                
                <div class="status ${car.available ? 'available' : 'rented'}">
                    ${car.available ? '✅ Available for Rental' : '❌ Currently Rented'}
                </div>
                
                <button class="book-btn" onclick="startBooking(${car.id})" ${!car.available ? 'disabled' : ''}>
                    ${car.available ? 'Book This Vehicle' : 'Currently Unavailable'}
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('carModal').style.display = 'block';
}

// Image gallery functionality
function changeMainImage(src, element) {
    document.getElementById('mainCarImage').src = src;
    document.querySelectorAll('.gallery-thumbnail').forEach(thumb => thumb.classList.remove('active'));
    element.classList.add('active');
}

// Start booking process with availability check
function startBooking(carId) {
    const car = carsData.find(c => c.id === carId);
    
    if (!car.available) {
        alert('Sorry, this vehicle is currently not available for rental.');
        return;
    }
    
    currentBooking = {
        car: car,
        carId: carId,
        step: 1,
        services: []
    };
    
    showBookingStep1();
    document.getElementById('bookingModal').style.display = 'block';
    document.getElementById('carModal').style.display = 'none';
}

// Enhanced booking Step 1 with date validation
function showBookingStep1() {
    const bookingContent = document.getElementById('bookingContent');
    
    bookingContent.innerHTML = `
        <div class="booking-form">
            <h2>Book Your Rental</h2>
            
            <div class="booking-steps">
                <div class="booking-step active">
                    <div class="step-number">1</div>
                    <div class="step-label">Rental Details</div>
                </div>
                <div class="booking-step">
                    <div class="step-number">2</div>
                    <div class="step-label">Your Information</div>
                </div>
                <div class="booking-step">
                    <div class="step-number">3</div>
                    <div class="step-label">Payment</div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="pickupDate">Pick-up Date</label>
                <input type="date" id="pickupDate" min="${getTomorrowDate()}" onchange="validateAndCalculate()">
            </div>
            
            <div class="form-group">
                <label for="returnDate">Return Date</label>
                <input type="date" id="returnDate" min="${getTomorrowDate()}" onchange="validateAndCalculate()">
            </div>
            
            <div class="form-group">
                <label for="pickupLocation">Pick-up Location</label>
                <select id="pickupLocation" onchange="calculateTotal()">
                    <option value="manila_airport">Manila Airport (MNL)</option>
                    <option value="makati_branch">Makati City Branch</option>
                    <option value="cebu_airport">Cebu Airport (CEB)</option>
                    <option value="davao_branch">Davao City Branch</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Additional Services</label>
                ${additionalServices.map(service => `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <div>
                            <strong>${service.name}</strong>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9rem;">${service.description}</p>
                        </div>
                        <div style="text-align: right;">
                            <span class="price-php">${service.price}</span>/day
                            <input type="checkbox" style="margin-left: 10px;" value="${service.id}" onchange="toggleService(this)">
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div id="availabilityMessage" style="margin: 15px 0; padding: 10px; border-radius: 4px; display: none;"></div>
            
            <div class="booking-summary">
                <h3>Rental Summary</h3>
                <div class="summary-item">
                    <span>${currentBooking.car.brand} ${currentBooking.car.model}</span>
                    <span class="price-php">${currentBooking.car.price.toLocaleString()}</span>/day
                </div>
                <div id="servicesSummary"></div>
                <div class="summary-item">
                    <span>Rental Period</span>
                    <span id="rentalPeriod">0 days</span>
                </div>
                <div class="summary-total">
                    <span>Total Amount</span>
                    <span id="totalAmount" class="price-php">0</span>
                </div>
            </div>
            
            <div class="form-navigation">
                <button class="btn btn-outline" onclick="closeBookingModal()">Cancel</button>
                <button class="btn btn-primary" onclick="goToStep2()" id="nextStep1" disabled>Continue to Information</button>
            </div>
        </div>
    `;
    
    calculateTotal();
}

// Enhanced validation and calculation
function validateAndCalculate() {
    const pickupDate = document.getElementById('pickupDate')?.value;
    const returnDate = document.getElementById('returnDate')?.value;
    const availabilityMessage = document.getElementById('availabilityMessage');
    
    if (!pickupDate || !returnDate) {
        availabilityMessage.style.display = 'none';
        document.getElementById('nextStep1').disabled = true;
        return;
    }
    
    // Validate dates
    const validation = validateDates(pickupDate, returnDate);
    if (!validation.valid) {
        availabilityMessage.innerHTML = `<div style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">${validation.message}</div>`;
        availabilityMessage.style.display = 'block';
        document.getElementById('nextStep1').disabled = true;
        return;
    }
    
    // Check availability
    const available = isCarAvailable(currentBooking.carId, pickupDate, returnDate);
    if (!available) {
        availabilityMessage.innerHTML = `<div style="color: #d32f2f; background: #ffebee; padding: 10px; border-radius: 4px;">This vehicle is not available for the selected dates. Please choose different dates.</div>`;
        availabilityMessage.style.display = 'block';
        document.getElementById('nextStep1').disabled = true;
        return;
    }
    
    // Show success message
    availabilityMessage.innerHTML = `<div style="color: #2e7d32; background: #e8f5e8; padding: 10px; border-radius: 4px;">Vehicle is available for the selected dates!</div>`;
    availabilityMessage.style.display = 'block';
    
    // Update booking object
    currentBooking.days = validation.days;
    currentBooking.pickupDate = pickupDate;
    currentBooking.returnDate = returnDate;
    currentBooking.pickupLocation = document.getElementById('pickupLocation')?.value;
    
    calculateTotal();
    document.getElementById('nextStep1').disabled = false;
}

// Calculate rental total
function calculateTotal() {
    if (!currentBooking.days || currentBooking.days <= 0) {
        document.getElementById('nextStep1').disabled = true;
        return;
    }
    
    let baseCost = currentBooking.car.price * currentBooking.days;
    let servicesCost = 0;
    
    // Calculate services cost
    currentBooking.services.forEach(serviceId => {
        const service = additionalServices.find(s => s.id == serviceId);
        if (service) {
            servicesCost += service.price * currentBooking.days;
        }
    });
    
    const totalCost = baseCost + servicesCost;
    
    // Update display
    document.getElementById('rentalPeriod').textContent = `${currentBooking.days} day${currentBooking.days > 1 ? 's' : ''}`;
    document.getElementById('totalAmount').textContent = totalCost.toLocaleString();
    
    // Update services summary
    const servicesSummary = document.getElementById('servicesSummary');
    if (currentBooking.services.length > 0) {
        servicesSummary.innerHTML = currentBooking.services.map(serviceId => {
            const service = additionalServices.find(s => s.id == serviceId);
            return service ? `
                <div class="summary-item">
                    <span>${service.name}</span>
                    <span class="price-php">${(service.price * currentBooking.days).toLocaleString()}</span>
                </div>
            ` : '';
        }).join('');
    } else {
        servicesSummary.innerHTML = '';
    }
    
    // Update booking object
    currentBooking.totalCost = totalCost;
}

// Toggle additional service
function toggleService(checkbox) {
    const serviceId = parseInt(checkbox.value);
    
    if (checkbox.checked) {
        currentBooking.services.push(serviceId);
    } else {
        currentBooking.services = currentBooking.services.filter(id => id !== serviceId);
    }
    
    calculateTotal();
}

// Get tomorrow's date for date input min attribute
function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// Go to Step 2: Customer Information
function goToStep2() {
    currentBooking.step = 2;
    showBookingStep2();
}

function showBookingStep2() {
    const bookingContent = document.getElementById('bookingContent');
    
    bookingContent.innerHTML = `
        <div class="booking-form">
            <h2>Your Information</h2>
            
            <div class="booking-steps">
                <div class="booking-step completed">
                    <div class="step-number">✓</div>
                    <div class="step-label">Rental Details</div>
                </div>
                <div class="booking-step active">
                    <div class="step-number">2</div>
                    <div class="step-label">Your Information</div>
                </div>
                <div class="booking-step">
                    <div class="step-number">3</div>
                    <div class="step-label">Payment</div>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" required>
                </div>
                <div class="form-group">
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" required>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" required>
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" required>
                </div>
            </div>
            
            <div class="form-group">
                <label for="address">Home Address</label>
                <textarea id="address" rows="3" required></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="licenseNumber">Driver's License Number</label>
                    <input type="text" id="licenseNumber" required>
                </div>
                <div class="form-group">
                    <label for="licenseExpiry">License Expiry Date</label>
                    <input type="date" id="licenseExpiry" required min="${getTomorrowDate()}">
                </div>
            </div>
            
            <div class="booking-summary">
                <h3>Booking Summary</h3>
                <div class="summary-item">
                    <span>Vehicle</span>
                    <span>${currentBooking.car.brand} ${currentBooking.car.model}</span>
                </div>
                <div class="summary-item">
                    <span>Rental Period</span>
                    <span>${currentBooking.days} day${currentBooking.days > 1 ? 's' : ''}</span>
                </div>
                <div class="summary-total">
                    <span>Total Amount</span>
                    <span class="price-php">${currentBooking.totalCost.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="form-navigation">
                <button class="btn btn-outline" onclick="showBookingStep1()">← Back</button>
                <button class="btn btn-primary" onclick="goToStep3()">Continue to Payment</button>
            </div>
        </div>
    `;
}

// Go to Step 3: Payment
function goToStep3() {
    // Validate customer information
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;
    const licenseNumber = document.getElementById('licenseNumber').value;
    const licenseExpiry = document.getElementById('licenseExpiry').value;
    
    if (!firstName || !lastName || !email || !phone || !address || !licenseNumber || !licenseExpiry) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }
    
    // Validate phone number (Philippines format)
    const phoneRegex = /^(09|\+639)\d{9}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
        alert('Please enter a valid Philippine phone number (09XXXXXXXXX or +639XXXXXXXXX).');
        return;
    }
    
    currentBooking.customer = {
        firstName,
        lastName,
        email,
        phone,
        address,
        licenseNumber,
        licenseExpiry
    };
    
    currentBooking.step = 3;
    showBookingStep3();
}

function showBookingStep3() {
    const bookingContent = document.getElementById('bookingContent');
    
    bookingContent.innerHTML = `
        <div class="booking-form">
            <h2>Payment Method</h2>
            
            <div class="booking-steps">
                <div class="booking-step completed">
                    <div class="step-number">✓</div>
                    <div class="step-label">Rental Details</div>
                </div>
                <div class="booking-step completed">
                    <div class="step-number">✓</div>
                    <div class="step-label">Your Information</div>
                </div>
                <div class="booking-step active">
                    <div class="step-number">3</div>
                    <div class="step-label">Payment</div>
                </div>
            </div>
            
            <div class="payment-methods">
                ${paymentMethods.map(method => `
                    <div class="payment-method ${selectedPaymentMethod === method.id ? 'selected' : ''}" 
                         onclick="selectPaymentMethod('${method.id}')">
                        <div class="payment-icon">${method.icon}</div>
                        <div class="payment-name">${method.name}</div>
                    </div>
                `).join('')}
            </div>
            
            ${selectedPaymentMethod ? `
                <div class="payment-form">
                    <div class="payment-details">
                        <h4>Payment Details</h4>
                        ${getPaymentForm(selectedPaymentMethod)}
                    </div>
                </div>
            ` : ''}
            
            <div class="booking-summary">
                <h3>Payment Summary</h3>
                <div class="summary-item">
                    <span>Vehicle Rental</span>
                    <span class="price-php">${(currentBooking.car.price * currentBooking.days).toLocaleString()}</span>
                </div>
                ${currentBooking.services.map(serviceId => {
                    const service = additionalServices.find(s => s.id == serviceId);
                    return service ? `
                        <div class="summary-item">
                            <span>${service.name}</span>
                            <span class="price-php">${(service.price * currentBooking.days).toLocaleString()}</span>
                        </div>
                    ` : '';
                }).join('')}
                <div class="summary-total">
                    <span>Total to Pay</span>
                    <span class="price-php">${currentBooking.totalCost.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="form-navigation">
                <button class="btn btn-outline" onclick="showBookingStep2()">← Back</button>
                <button class="btn btn-primary" onclick="processPayment()" ${!selectedPaymentMethod ? 'disabled' : ''}>
                    Complete Booking
                </button>
            </div>
        </div>
    `;
}

// Select payment method
function selectPaymentMethod(methodId) {
    selectedPaymentMethod = methodId;
    showBookingStep3();
}

// Get payment form based on selected method
function getPaymentForm(methodId) {
    switch(methodId) {
        case 'credit_card':
            return `
                <div class="form-group">
                    <label>Card Number</label>
                    <input type="text" placeholder="1234 5678 9012 3456" maxlength="19" pattern="[0-9]{13,19}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Expiry Date</label>
                        <input type="text" placeholder="MM/YY" maxlength="5" pattern="(0[1-9]|1[0-2])\/[0-9]{2}" required>
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input type="text" placeholder="123" maxlength="3" pattern="[0-9]{3}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Cardholder Name</label>
                    <input type="text" placeholder="Juan Dela Cruz" required>
                </div>
            `;
        case 'gcash':
            return `
                <div class="form-group">
                    <label>GCash Mobile Number</label>
                    <input type="tel" placeholder="09XX XXX XXXX" pattern="(09|\\+639)\\d{9}" required>
                </div>
                <p style="color: #666; font-size: 0.9rem;">You will be redirected to GCash to complete your payment.</p>
            `;
        case 'paymaya':
            return `
                <div class="form-group">
                    <label>PayMaya Mobile Number</label>
                    <input type="tel" placeholder="09XX XXX XXXX" pattern="(09|\\+639)\\d{9}" required>
                </div>
                <p style="color: #666; font-size: 0.9rem;">You will be redirected to PayMaya to complete your payment.</p>
            `;
        case 'bank_transfer':
            return `
                <div class="form-group">
                    <label>Select Bank</label>
                    <select required>
                        <option value="">Choose a bank</option>
                        <option>BPI (Bank of the Philippine Islands)</option>
                        <option>BDO (Banco de Oro)</option>
                        <option>Metrobank</option>
                        <option>Landbank</option>
                    </select>
                </div>
                <p style="color: #666; font-size: 0.9rem;">Bank transfer details will be provided after booking confirmation.</p>
            `;
        default:
            return '';
    }
}

// Process payment simulation
function processPayment() {
    // Final availability check before payment
    if (!isCarAvailable(currentBooking.carId, currentBooking.pickupDate, currentBooking.returnDate)) {
        alert('Sorry, this vehicle is no longer available for the selected dates. Please choose a different vehicle or dates.');
        showBookingStep1();
        return;
    }
    
    // Simulate payment processing
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for simulation
    
    if (paymentSuccess) {
        showConfirmation();
    } else {
        alert('Payment failed. Please try again or use a different payment method.');
    }
}

// Enhanced booking confirmation with storage
function showConfirmation() {
    const confirmationNumber = generateConfirmationNumber();
    
    // Create booking record
    const bookingRecord = {
        ...currentBooking,
        confirmationNumber,
        bookingDate: new Date().toISOString(),
        status: 'confirmed',
        paymentMethod: selectedPaymentMethod
    };
    
    // Store booking
    bookings.push(bookingRecord);
    localStorage.setItem('avisBookings', JSON.stringify(bookings));
    
    // Update car availability
    updateCarAvailability();
    
    document.getElementById('confirmationContent').innerHTML = `
        <div class="confirmation-success">
            <div class="icon">✅</div>
            <h2>Booking Confirmed!</h2>
            <p>Thank you for choosing Avis Car Rental.</p>
            
            <div class="confirmation-details">
                <h3>Booking Details</h3>
                <div class="confirmation-number">Confirmation #: <strong>${confirmationNumber}</strong></div>
                
                <div class="spec-detail"><span class="label">Vehicle:</span><span class="value">${currentBooking.car.brand} ${currentBooking.car.model}</span></div>
                <div class="spec-detail"><span class="label">Pick-up Date:</span><span class="value">${formatDate(currentBooking.pickupDate)}</span></div>
                <div class="spec-detail"><span class="label">Return Date:</span><span class="value">${formatDate(currentBooking.returnDate)}</span></div>
                <div class="spec-detail"><span class="label">Rental Period:</span><span class="value">${currentBooking.days} day${currentBooking.days > 1 ? 's' : ''}</span></div>
                <div class="spec-detail"><span class="label">Pick-up Location:</span><span class="value">${getLocationName(currentBooking.pickupLocation)}</span></div>
                <div class="spec-detail"><span class="label">Customer:</span><span class="value">${currentBooking.customer.firstName} ${currentBooking.customer.lastName}</span></div>
                
                <div class="summary-total" style="margin-top: 20px;">
                    <span>Total Paid</span>
                    <span class="price-php">${currentBooking.totalCost.toLocaleString()}</span>
                </div>
            </div>
            
            <p style="color: #666; margin: 20px 0;">
                A confirmation email has been sent to ${currentBooking.customer.email}<br>
                Please bring your driver's license and this confirmation number when picking up the vehicle.
            </p>
            
            <button class="btn btn-primary" onclick="closeConfirmationModal()">Done</button>
        </div>
    `;
    
    document.getElementById('bookingModal').style.display = 'none';
    document.getElementById('confirmationModal').style.display = 'block';
    
    // Reset for next booking
    currentBooking = {};
    selectedPaymentMethod = '';
}

// Helper functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-PH', options);
}

function getLocationName(locationId) {
    const locations = {
        'manila_airport': 'Manila Airport (MNL)',
        'makati_branch': 'Makati City Branch',
        'cebu_airport': 'Cebu Airport (CEB)',
        'davao_branch': 'Davao City Branch'
    };
    return locations[locationId] || locationId;
}

// Modal control functions
function closeBookingModal() {
    document.getElementById('bookingModal').style.display = 'none';
    currentBooking = {};
    selectedPaymentMethod = '';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
    // Refresh the car display to show updated availability
    displayCars(currentCars);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = ['carModal', 'bookingModal', 'paymentModal', 'confirmationModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            if (modalId === 'carModal') closeModal();
            if (modalId === 'bookingModal') closeBookingModal();
            if (modalId === 'paymentModal') closePaymentModal();
            if (modalId === 'confirmationModal') closeConfirmationModal();
        }
    });
}

// Enhanced search with Enter key support
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchCars();
    }
});

// Close modal function
function closeModal() {
    document.getElementById('carModal').style.display = 'none';
}

// Comparison functions
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

function removeFromComparison(carId) {
    comparisonCars = comparisonCars.filter(car => car.id !== carId);
    updateComparisonView();
}

function clearComparison() {
    comparisonCars = [];
    updateComparisonView();
}