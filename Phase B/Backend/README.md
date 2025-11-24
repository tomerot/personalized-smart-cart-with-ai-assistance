## Project Structure

```
Backend/
├── clients.py                 # Twilio and Genimi clients
├── main.py                    # FastAPI app entry point, CORS, DB init
├── database.py                # MongoDB connection setup
├── store_layout.json          # Store grid map & category positions
├── distance_matrix.json       # Pre-calculated walking distances
├── calculate_distances.py     # Script: Generate distance matrix
├── sync_categories_to_db.py   # Script: Sync categories JSON → MongoDB
│
├── models/                    # MongoDB document models (Beanie)
│   ├── user.py
│   ├── product.py
│   ├── category.py
│   ├── cart_session.py
│   ├── shopping_list.py
│   ├── purchase_history.py
│   └── otp.py
│
├── schemas/                   # Pydantic models for request/response
│   ├── user.py
│   ├── product.py
│   ├── shopping_list.py
│   ├── purchase_history.py
│   ├── cart_session.py
│   ├── item.py
│   └── otp.py
│
├── services/                  # Business logic layer
│   ├── user.py
│   ├── product.py
│   ├── shopping_list.py
│   ├── purchase_history.py
│   ├── cart_session.py
│   ├── otp.py
│   ├── pathfinding.py        # BFS algorithm for store navigation
│   └── route_optimizer.py    # TSP solver using Google OR-Tools
│
└── routers/                   # API endpoints (thin controllers)
    ├── users.py              
    ├── products.py           
    ├── shopping_list.py      
    ├── purchase_history.py  
    ├── cart_session.py       
    ├── otp.py                
    └── store.py              # Store layout
```
