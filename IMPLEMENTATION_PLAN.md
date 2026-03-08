# Implementation Plan: Skate Hub Phase 4 & 5

## Step 1: Update skate.html with Dynamic Events
- Add province/city/type filter bar
- Load events dynamically from SkateEvents system
- Show both sessions and competitions

## Step 2: Update dashboard.html with Real Auth
- Remove mock auth and use studioAuth from auth.js
- Add role-based navigation for organizer/supplier
- Create dashboard modules for each role

## Step 3: Add Role-Based Dashboards
- Organizer: Create/manage events, view RSVPs, competitor registration
- Supplier: Add products, manage stock, view supplier orders

## Step 4: Update Navigation
- Add role indicator badge to nav
- Show role-specific links

