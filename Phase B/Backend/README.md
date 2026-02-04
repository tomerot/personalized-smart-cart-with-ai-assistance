## 📁 Backend Structure

```
Backend/
├── main.py                    # FastAPI app entry point, CORS, DB init
├── database.py                # MongoDB connection setup
├── store_layout.json          # Store grid map
├── grid_distance_matrix.json  # Pre-calculated BFS distances (all points to all points)
│
├── clients/                   # External API clients
│   ├── gemini_client.py       # Google Gemini AI client
│   └── twilio_client.py       # Twilio SMS client
│
├── models/                    # MongoDB document models (Beanie)
│   ├── user.py
│   ├── product.py
│   ├── category.py            
│   ├── cart_session.py
│   ├── shopping_list.py
│   ├── product_purchase_tracking.py
│   └── otp.py
│
├── schemas/                   # Pydantic models for request/response validation
│   ├── user.py
│   ├── product.py
│   ├── product_item.py
│   ├── shopping_list.py
│   ├── purchase_tracking.py
│   ├── cart_session.py
│   └── otp.py
│
├── services/                  # Business logic layer
│   ├── user.py
│   ├── product.py
│   ├── shopping_list.py       
│   ├── product_purchase_tracking.py
│   ├── cart_session.py
│   ├── otp.py
│   └── route_optimizer.py     # TSP solver using Google OR-Tools + numpy
│
├── routers/                   # API endpoints (thin controllers)
│   ├── users.py
│   ├── products.py
│   ├── shopping_list.py
│   ├── checkout.py
│   ├── cart_session.py        # Cart sync/recovery
│   ├── otp.py                 # SMS authentication
│   └── vapi_webhook.py        # VAPI voice assistant webhook
│
└── maintenance/               # Maintenance scripts (run manually)
    └── calculate_grid_distances.py  # Generate grid distance matrix
```
