# Contacts Manager — User Guide

## Introduction
- Purpose: A mobile-friendly web app to manage your friends’ contact details (name, telephone, email) using your browser only. No server required.
- Audience: Anyone who needs a simple contact book on desktop or mobile.
- System requirements: A modern browser (Chrome, Edge, Firefox, Safari) with Local Storage enabled.

## Getting Started
1. Download or copy the project folder to your computer.
2. Open `contacts-app/index.html` in your browser (double-click or drag into a window).
3. You’ll see the Contacts page with a search bar and an Add Contact button.

Navigation
- Search: Filter by name, phone, or email.
- Add Contact: Opens a form to create a new contact.
- Card actions: Edit (pencil) and Delete (bin) on each contact card.

## Features and Functionality
- View contacts: Cards are sorted A→Z by name and show initials, phone, and email.
- Add contact: Click Add Contact, fill the form, and Save.
- Update contact: Click the pencil icon on a card to edit, then Save.
- Delete contact: Click the bin icon, confirm deletion.
- Search: Type to instantly filter across name, phone, and email.
- Persistence: All data is stored locally in your browser (LocalStorage). It stays after refresh.
- Responsive UI: Optimized for phones, tablets, and desktops with a clean, accessible design.

## Step-by-Step Instructions

Create a contact
1. Click “Add Contact”.
2. Enter Full Name, Telephone (7–15 digits, optional +), and Email.
3. Click “Save”. The contact appears in the list.

Edit a contact
1. Click the pencil icon on a contact.
2. Update fields and click “Save”.

Delete a contact
1. Click the bin icon on a contact.
2. Confirm deletion in the prompt.

Search contacts
1. Type into the search field to filter contacts by name, phone, or email.

Tips
- Use international phone format like +447700900123.
- Your data is only on this device. Clearing site data or using a different browser will reset the list.

## Troubleshooting
- Nothing shows: If the list is empty, use “Create contact” to add your first one.
- Validation errors: Ensure name has at least 2 characters, phone has 7–15 digits (optional +), and email is valid.
- Persistence: If contacts disappear, check your browser’s site storage settings.
