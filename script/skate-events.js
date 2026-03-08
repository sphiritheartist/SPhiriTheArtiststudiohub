/* ================================================================
   SPHIRI SKATE EVENTS SYSTEM
   Multi-event platform for South African skate scene
   Supports: Events, Competitions, Organizers, Suppliers
   ================================================================ */

(function() {
    'use strict';

    // South African Provinces
    const PROVINCES = [
        'Eastern Cape',
        'Free State',
        'Gauteng',
        'KwaZulu-Natal',
        'Limpopo',
        'Mpumalanga',
        'Northern Cape',
        'North West',
        'Western Cape'
    ];

    // Major cities per province
    const CITIES_BY_PROVINCE = {
        'Eastern Cape': ['East London', 'Port Elizabeth', 'Mthatha', 'Queenstown', 'Graaff-Reinet'],
        'Free State': ['Bloemfontein', 'Welkom', 'Bethlehem', 'Kroonstad', 'Sasolburg'],
        'Gauteng': ['Johannesburg', 'Pretoria', 'Sandton', 'Alexandra', 'Soweto', 'Vereeniging', 'Roodepoort'],
        'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Richards Bay', 'Newcastle', 'Empangeni'],
        'Limpopo': ['Polokwane', 'Thabazimbi', 'Mokopane', 'Musina', 'Lephalale'],
        'Mpumalanga': ['Nelspruit', 'Witbank', 'Secunda', 'Middelburg', 'Bethal'],
        'Northern Cape': ['Kimberley', 'Upington', 'Springbok', 'Kuruman', 'De Aar'],
        'North West': ['Mafikeng', 'Rustenburg', 'Klerksdorp', 'Potchefstroom', ' Brits'],
        'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'Worcester', 'George', 'Mossel Bay']
    };

    // Event types
    const EVENT_TYPES = {
        SESSION: 'session',
        COMPETITION: 'competition',
        WORKSHOP: 'workshop',
        JAM: 'jam'
    };

    // Storage keys
    const EVENTS_KEY = 'sphiri_skate_events';
    const COMPETITIONS_KEY = 'sphiri_skate_competitions';
    const ORGANIZERS_KEY = 'sphiri_organizers';
    const SUPPLIER_PRODUCTS_KEY = 'sphiri_supplier_products';

    // ── STORAGE HELPERS ─────────────────────────────────────────
    function getEvents() {
        try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]'); } 
        catch(e) { return []; }
    }
    function saveEvents(events) {
        try { localStorage.setItem(EVENTS_KEY, JSON.stringify(events)); } 
        catch(e) {}
    }
    function getCompetitions() {
        try { return JSON.parse(localStorage.getItem(COMPETITIONS_KEY) || '[]'); } 
        catch(e) { return []; }
    }
    function saveCompetitions(comps) {
        try { localStorage.setItem(COMPETITIONS_KEY, JSON.stringify(comps)); } 
        catch(e) {}
    }
    function getSupplierProducts() {
        try { return JSON.parse(localStorage.getItem(SUPPLIER_PRODUCTS_KEY) || '[]'); } 
        catch(e) { return []; }
    }
    function saveSupplierProducts(products) {
        try { localStorage.setItem(SUPPLIER_PRODUCTS_KEY, JSON.stringify(products)); } 
        catch(e) {}
    }

    // ── EVENT CRUD ─────────────────────────────────────────────
    function createEvent(eventData) {
        const events = getEvents();
        const event = {
            id: 'evt_' + Date.now().toString(36),
            title: eventData.title,
            description: eventData.description,
            type: eventData.type || EVENT_TYPES.SESSION,
            province: eventData.province,
            city: eventData.city,
            town: eventData.town || '',
            venue: eventData.venue,
            address: eventData.address,
            date: eventData.date,
            time: eventData.time,
            organizerId: eventData.organizerId,
            organizerName: eventData.organizerName,
            image: eventData.image || '',
            entryFee: eventData.entryFee || 0,
            maxAttendees: eventData.maxAttendees || null,
            rsvps: [],
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        events.unshift(event);
        saveEvents(events);
        return event;
    }

    function updateEvent(eventId, updates) {
        const events = getEvents();
        const idx = events.findIndex(e => e.id === eventId);
        if (idx !== -1) {
            events[idx] = { ...events[idx], ...updates };
            saveEvents(events);
            return events[idx];
        }
        return null;
    }

    function deleteEvent(eventId) {
        const events = getEvents().filter(e => e.id !== eventId);
        saveEvents(events);
    }

    function getEventById(eventId) {
        return getEvents().find(e => e.id === eventId);
    }

    // ── COMPETITION CRUD ───────────────────────────────────────
    function createCompetition(compData) {
        const comps = getCompetitions();
        const comp = {
            id: 'comp_' + Date.now().toString(36),
            title: compData.title,
            description: compData.description,
            province: compData.province,
            city: compData.city,
            town: compData.town || '',
            venue: compData.venue,
            address: compData.address,
            date: compData.date,
            time: compData.time,
            organizerId: compData.organizerId,
            organizerName: compData.organizerName,
            image: compData.image || '',
            entryFee: compData.entryFee || 0,
            registrationDeadline: compData.registrationDeadline,
            categories: compData.categories || [],
            prizes: compData.prizes || [],
            maxParticipants: compData.maxParticipants || null,
            registrants: [],
            results: [],
            createdAt: new Date().toISOString(),
            status: 'upcoming'
        };
        comps.unshift(comp);
        saveCompetitions(comps);
        return comp;
    }

    function registerForCompetition(compId, userData) {
        const comps = getCompetitions();
        const idx = comps.findIndex(c => c.id === compId);
        if (idx !== -1) {
            const existing = comps[idx].registrants.find(r => r.email === userData.email);
            if (!existing) {
                comps[idx].registrants.push({
                    id: 'reg_' + Date.now().toString(36),
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone || '',
                    category: userData.category,
                    registeredAt: new Date().toISOString()
                });
                saveCompetitions(comps);
                return comps[idx];
            }
        }
        return null;
    }

    // ── FILTERING ─────────────────────────────────────────────
    function filterEvents(filters) {
        let events = getEvents();
        
        if (filters.province) {
            events = events.filter(e => e.province === filters.province);
        }
        if (filters.city) {
            events = events.filter(e => e.city === filters.city);
        }
        if (filters.type) {
            events = events.filter(e => e.type === filters.type);
        }
        if (filters.status) {
            events = events.filter(e => e.status === filters.status);
        }
        
        return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function filterCompetitions(filters) {
        let comps = getCompetitions();
        
        if (filters.province) {
            comps = comps.filter(c => c.province === filters.province);
        }
        if (filters.city) {
            comps = comps.filter(c => c.city === filters.city);
        }
        if (filters.status) {
            comps = comps.filter(c => c.status === filters.status);
        }
        
        return comps.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function getCitiesForProvince(province) {
        return CITIES_BY_PROVINCE[province] || [];
    }

    // ── RSVP ──────────────────────────────────────────────────
    function rsvpEvent(eventId, userData) {
        const events = getEvents();
        const idx = events.findIndex(e => e.id === eventId);
        if (idx !== -1) {
            const existing = events[idx].rsvps.find(r => r.email === userData.email);
            if (!existing) {
                events[idx].rsvps.push({
                    id: 'rsvp_' + Date.now().toString(36),
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone || '',
                    guests: userData.guests || 0,
                    role: userData.role || 'skater',
                    registeredAt: new Date().toISOString()
                });
                saveEvents(events);
                return events[idx];
            }
        }
        return null;
    }

    // ── SUPPLIER PRODUCTS ─────────────────────────────────────
    function addSupplierProduct(productData) {
        const products = getSupplierProducts();
        const product = {
            id: 'prod_' + Date.now().toString(36),
            supplierId: productData.supplierId,
            supplierName: productData.supplierName,
            name: productData.name,
            description: productData.description,
            category: productData.category,
            price: productData.price,
            image: productData.image || '',
            specs: productData.specs || [],
            stock: productData.stock || 0,
            approved: false, // Needs admin approval
            createdAt: new Date().toISOString()
        };
        products.unshift(product);
        saveSupplierProducts(products);
        return product;
    }

    function getSupplierProductsBySupplier(supplierId) {
        return getSupplierProducts().filter(p => p.supplierId === supplierId);
    }

    function getApprovedProducts() {
        return getSupplierProducts().filter(p => p.approved);
    }

    function approveProduct(productId) {
        const products = getSupplierProducts();
        const idx = products.findIndex(p => p.id === productId);
        if (idx !== -1) {
            products[idx].approved = true;
            saveSupplierProducts(products);
            return products[idx];
        }
        return null;
    }

    // ── SEED SAMPLE DATA ──────────────────────────────────────
    function seedSampleData() {
        const existing = getEvents();
        if (existing.length > 0) return;

        const sampleEvents = [
            {
                id: 'evt_sample1',
                title: 'JHB Street Skate Session',
                description: 'Monthly street session at the Johannesburg CBD skatepark. All skill levels welcome.',
                type: EVENT_TYPES.SESSION,
                province: 'Gauteng',
                city: 'Johannesburg',
                town: 'CBD',
                venue: 'Johannesburg Skatepark',
                address: 'Mary Fitzgerald Square, Johannesburg',
                date: '2025-02-15',
                time: '14:00',
                organizerId: 'org_1',
                organizerName: 'Skate SA',
                image: '',
                entryFee: 0,
                maxAttendees: 50,
                rsvps: [],
                createdAt: new Date().toISOString(),
                status: 'active'
            },
            {
                id: 'evt_sample2',
                title: 'CPT Open Skate Competition',
                description: 'Annual open skate competition at the V&A Waterfront. Open to all ages.',
                type: EVENT_TYPES.COMPETITION,
                province: 'Western Cape',
                city: 'Cape Town',
                town: 'V&A Waterfront',
                venue: 'Skate Park Cape Town',
                address: 'Breakwater Blvd, Cape Town',
                date: '2025-03-01',
                time: '10:00',
                organizerId: 'org_2',
                organizerName: 'Cape Town Skate Collective',
                image: '',
                entryFee: 150,
                maxAttendees: 100,
                rsvps: [],
                createdAt: new Date().toISOString(),
                status: 'active'
            },
            {
                id: 'evt_sample3',
                title: 'Durban Beginner Workshop',
                description: 'Learn to skate basics with certified instructors. Boards provided.',
                type: EVENT_TYPES.WORKSHOP,
                province: 'KwaZulu-Natal',
                city: 'Durban',
                town: 'UMhlanga',
                venue: 'Umhlanga Skate Park',
                address: 'Ocean Way Drive, Umhlanga',
                date: '2025-02-20',
                time: '09:00',
                organizerId: 'org_3',
                organizerName: 'Durban Skate Academy',
                image: '',
                entryFee: 50,
                maxAttendees: 20,
                rsvps: [],
                createdAt: new Date().toISOString(),
                status: 'active'
            }
        ];

        saveEvents(sampleEvents);
    }

    // Initialize with sample data
    seedSampleData();

    // ── PUBLIC API ─────────────────────────────────────────────
    window.SkateEvents = {
        // Constants
        PROVINCES: PROVINCES,
        CITIES_BY_PROVINCE: CITIES_BY_PROVINCE,
        EVENT_TYPES: EVENT_TYPES,

        // Events
        getEvents: getEvents,
        getEventById: getEventById,
        createEvent: createEvent,
        updateEvent: updateEvent,
        deleteEvent: deleteEvent,
        filterEvents: filterEvents,
        rsvpEvent: rsvpEvent,

        // Competitions
        getCompetitions: getCompetitions,
        createCompetition: createCompetition,
        registerForCompetition: registerForCompetition,
        filterCompetitions: filterCompetitions,

        // Location helpers
        getCitiesForProvince: getCitiesForProvince,

        // Supplier
        addSupplierProduct: addSupplierProduct,
        getSupplierProductsBySupplier: getSupplierProductsBySupplier,
        getApprovedProducts: getApprovedProducts,
        approveProduct: approveProduct,

        // Seed
        seedSampleData: seedSampleData
    };

})();

