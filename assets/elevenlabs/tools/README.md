# ElevenLabs Tool Configurations for Resto AI

This directory contains tool configurations for ElevenLabs Conversational AI agents to interact with the Resto AI reservation system via phone calls.

## Tools Available

### 1. `check-availability.json`
**Purpose**: Check available time slots for a date and party size  
**When to use**: First step before making a reservation  
**Required**: date, numberOfPeople  
**Optional**: time (to check specific slot)

### 2. `make-reservation.json`
**Purpose**: Create a new reservation  
**When to use**: After checking availability and collecting customer details  
**Required**: date, time, phone, name, email, numberOfCustomers  
**Optional**: comments, roomId, allergies  
**Note**: Always check availability first!

### 3. `search-reservations.json` ✨ UPDATED
**Purpose**: Find reservations by any combination of phone, email, name, and/or date  
**When to use**: To find existing reservations using any available customer information  
**Required**: None - all parameters are optional  
**Optional**: phone, email, customerName, date (use any combination)  
**Note**: Can be called without parameters to get recent reservations. More filters = more specific results.

### 4. `get-reservation-by-id.json`
**Purpose**: Get complete details of a specific reservation  
**When to use**: Customer provides confirmation number, or after searching  
**Required**: bookingId  
**Returns**: Full details including status, canModify, canCancel flags

### 5. `update-reservation.json`
**Purpose**: Modify an existing reservation  
**When to use**: Customer wants to change reservation details  
**Required**: bookingId (from search/get operations)  
**Optional**: Any field to change (date, time, numberOfCustomers, phone, name, comments, allergies, email, roomId)  
**Note**: ✨ Supports partial updates - only send fields you want to change!

### 6. `cancel-reservation.json`
**Purpose**: Cancel a reservation  
**When to use**: Customer wants to cancel  
**Required**: bookingId (from search/get operations)  
**Important**: Always confirm details before canceling!

## Key Features

### 🔧 Automatic Phone Normalization
Phone numbers are automatically normalized to standard format. Accept any format:
- `+33612345678`
- `0612345678`
- `06 12 34 56 78`
- `06-12-34-56-78`

### 🎯 Partial Updates (NEW!)
The update tool now supports partial updates:
```json
// Update just the time
{"time": "20:00"}

// Update time and party size
{"time": "20:00", "numberOfCustomers": 6}

// Update just allergies
{"allergies": "Gluten-free, no shellfish"}
```

### 🥗 Separate Allergies Field (NEW!)
Allergies are now separate from comments:
- **allergies**: Dietary restrictions, food allergies (`"Gluten-free"`, `"Peanut allergy"`)
- **comments**: Other requests (`"Window seat"`, `"Birthday celebration"`)

### 🚦 Smart Status Flags (NEW!)
All reservation responses include:
- **canModify**: `true` if reservation can be modified (not past date, not cancelled)
- **canCancel**: `true` if reservation can be cancelled (not past date, not cancelled)
- Use these to guide conversation: "I'm sorry, this reservation has already passed and cannot be modified"

## Typical Conversation Flows

### Making a Reservation
1. Customer: "I'd like to book a table for Saturday at 7pm for 4 people"
2. Agent: Call `check-availability` → Get available slots
3. Agent: Confirm slot with customer
4. Agent: Collect name, phone, email, and any special requests
5. Agent: Call `make-reservation` with all details
6. Agent: Confirm booking ID to customer

### Modifying a Reservation
1. Customer: "I need to change my reservation"
2. Agent: Call `search-reservations` (with phone, email, name, or date - whatever is available)
3. Agent: Confirm which reservation to modify
4. Agent: Ask what to change
5. If changing date/time/party size: Call `check-availability` first
6. Agent: Call `update-reservation` with **only the fields being changed**
7. Agent: Confirm updates

### Cancelling a Reservation
1. Customer: "I need to cancel my booking"
2. Agent: Call `search-reservations` (with phone, email, name, or date - whatever is available)
3. Agent: **Verbally confirm** all details with customer
4. Agent: Get explicit confirmation: "Just to confirm, I'll cancel your reservation for Saturday at 7pm. Is that correct?"
5. Agent: Call `cancel-reservation`
6. Agent: Confirm cancellation

## Import to ElevenLabs

1. Go to your ElevenLabs agent configuration
2. Navigate to Tools section
3. Click "Add Tool" → "Import from JSON"
4. Upload each JSON file
5. Verify the webhook URL matches your deployment
6. Test each tool with sample inputs

## Important Notes

⚠️ **Always check availability** before creating or updating reservations with new date/time/party size

⚠️ **Always confirm cancellations** verbally with customer before calling the cancel tool

⚠️ **Booking IDs are confirmation numbers** - customers may refer to them as "confirmation number" or "booking reference"

✅ **Use partial updates** - only send fields that are changing (makes conversations more natural)

✅ **Phone format is flexible** - don't interrupt conversation to correct phone format

✅ **Separate allergies from comments** - helps kitchen prepare safely

## Authentication

All tools use the same authentication connection:
- Connection ID: `auth_6601k887hn15f14ag2fqx7qck7d7`
- This should be configured in your ElevenLabs account
- Base URL: `https://resto-ai.adhityan.com/api`

## Support

For issues or questions:
- Review the CHANGELOG.md for recent updates
- Check API documentation in `/docs`
- Test endpoints directly before configuring LLM

---
Last updated: November 19, 2025

