#!/bin/bash

#############################################
# Seed Espresso Beso Menu Items
#############################################

echo "Adding menu items to database..."

# Using mongosh to insert directly into MongoDB
mongosh espresso_beso --eval '
db.menu_items.deleteMany({});
db.menu_items.insertMany([
  {
    "id": "f6ef057a-33f4-4485-a66b-2bff1e3b2c75",
    "name": "Beso Delight",
    "description": "Hazelnut Sensation Mocha",
    "price": 5.0,
    "category": "Signature Drinks",
    "image_url": "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {"Half and Half": 0.5, "Almond Milk": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "59da1ca0-6ea2-4209-a7fc-40115a7a44c9",
    "name": "Sweet Beso",
    "description": "Coconut Caramel Mocha",
    "price": 5.0,
    "category": "Signature Drinks",
    "image_url": "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {"Half and Half": 0.5, "Almond Milk": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "8f96f80e-b467-4b48-9904-6186eebece95",
    "name": "White Beso",
    "description": "White Chocolate Mocha",
    "price": 5.0,
    "category": "Signature Drinks",
    "image_url": "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {"Half and Half": 0.5, "Almond Milk": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "18832647-402f-4273-a519-b4f4b149411a",
    "name": "Spice Beso",
    "description": "Cinnamon Salted Caramel Mocha",
    "price": 5.0,
    "category": "Signature Drinks",
    "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {"Half and Half": 0.5, "Almond Milk": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "75a1c67e-027b-4ad6-913e-672765e191f9",
    "name": "Creamy Beso",
    "description": "Rich Creamy White Chocolate Macadamia Nut Mocha",
    "price": 5.0,
    "category": "Signature Drinks",
    "image_url": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {"Half and Half": 0.5, "Almond Milk": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "8758715d-678a-4314-bdcc-10d2bc2fa2eb",
    "name": "Kids Beso",
    "description": "Hot Chocolate Milk with Whip Cream (100 Degrees - kid-safe temp)",
    "price": 3.5,
    "category": "Signature Drinks",
    "image_url": "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {"Half and Half": 0.5, "Almond Milk": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "a3b5658f-df24-4034-b47b-85027ba7ac7a",
    "name": "RedBull Beso",
    "description": "Redbull with your choice of syrup flavor, topped with whip cream",
    "price": 4.5,
    "category": "Iced Drinks",
    "image_url": "https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=400",
    "customizations": [
      {"name": "Add Flavor", "options": ["None", "Coconut", "Hazelnut", "Brown Sugar Cinnamon", "Salted Caramel", "White Chocolate", "Vanilla", "Caramel"], "default": "None", "price_modifier": {"Coconut": 0.5, "Hazelnut": 0.5, "Brown Sugar Cinnamon": 0.5, "Salted Caramel": 0.5, "White Chocolate": 0.5, "Vanilla": 0.5, "Caramel": 0.5}}
    ],
    "is_available": false,
    "created_at": new Date().toISOString()
  },
  {
    "id": "b915ad6a-5600-4223-817c-d88bf1387e19",
    "name": "Beso Frio",
    "description": "Coconut Caramel Ice Mocha - blended or iced",
    "price": 3.75,
    "category": "Iced Drinks",
    "image_url": "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.5}},
      {"name": "Style", "options": ["Iced", "Blended"], "default": "Iced", "price_modifier": {}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {}}
    ],
    "is_available": false,
    "created_at": new Date().toISOString()
  },
  {
    "id": "68dcbb95-b175-48a8-b2d3-9944ef19b7fa",
    "name": "Latte",
    "description": "Espresso shot with steamed whole milk - choose a flavor",
    "price": 5.0,
    "category": "Espresso Classics",
    "image_url": "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {"Half and Half": 0.5, "Almond Milk": 0.5}},
      {"name": "Add Flavor", "options": ["None", "Coconut", "Hazelnut", "Brown Sugar Cinnamon", "Salted Caramel", "White Chocolate", "Vanilla", "Caramel"], "default": "None", "price_modifier": {"Coconut": 0.5, "Hazelnut": 0.5, "Brown Sugar Cinnamon": 0.5, "Salted Caramel": 0.5, "White Chocolate": 0.5, "Vanilla": 0.5, "Caramel": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "77b184ac-758b-4025-bdec-301bcc2a2c3d",
    "name": "Mocha",
    "description": "Espresso with steamed milk, white or dark chocolate",
    "price": 5.0,
    "category": "Espresso Classics",
    "image_url": "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Chocolate", "options": ["Dark Chocolate", "White Chocolate"], "default": "Dark Chocolate", "price_modifier": {}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {"Half and Half": 0.5, "Almond Milk": 0.5}},
      {"name": "Add Flavor", "options": ["None", "Coconut", "Hazelnut", "Brown Sugar Cinnamon", "Salted Caramel", "White Chocolate", "Vanilla", "Caramel"], "default": "None", "price_modifier": {"Coconut": 0.5, "Hazelnut": 0.5, "Brown Sugar Cinnamon": 0.5, "Salted Caramel": 0.5, "White Chocolate": 0.5, "Vanilla": 0.5, "Caramel": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "b0a1010a-82b9-436a-8d64-b26033397995",
    "name": "Macchiato",
    "description": "Espresso shot with steamed milk and microfoam",
    "price": 5.0,
    "category": "Espresso Classics",
    "image_url": "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Milk", "options": ["2% Milk", "Whole Milk", "Half and Half", "Almond Milk"], "default": "Whole Milk", "price_modifier": {"Half and Half": 0.5, "Almond Milk": 0.5}},
      {"name": "Add Flavor", "options": ["None", "Coconut", "Hazelnut", "Brown Sugar Cinnamon", "Salted Caramel", "White Chocolate", "Vanilla", "Caramel"], "default": "None", "price_modifier": {"Coconut": 0.5, "Hazelnut": 0.5, "Brown Sugar Cinnamon": 0.5, "Salted Caramel": 0.5, "White Chocolate": 0.5, "Vanilla": 0.5, "Caramel": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "8b90288e-e385-47bf-9514-c56fbd63401c",
    "name": "Breves",
    "description": "Espresso shot with half and half steamed milk",
    "price": 5.0,
    "category": "Espresso Classics",
    "image_url": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.0}},
      {"name": "Add Flavor", "options": ["None", "Coconut", "Hazelnut", "Brown Sugar Cinnamon", "Salted Caramel", "White Chocolate", "Vanilla", "Caramel"], "default": "None", "price_modifier": {"Coconut": 0.5, "Hazelnut": 0.5, "Brown Sugar Cinnamon": 0.5, "Salted Caramel": 0.5, "White Chocolate": 0.5, "Vanilla": 0.5, "Caramel": 0.5}}
    ],
    "is_available": true,
    "created_at": new Date().toISOString()
  },
  {
    "id": "ce4259d7-cae3-47d4-b5c8-d15db2f4af8a",
    "name": "Fruit Smoothie",
    "description": "Blended fruit smoothie - Mango, Peach, or Strawberry",
    "price": 3.75,
    "category": "Smoothies",
    "image_url": "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400",
    "customizations": [
      {"name": "Size", "options": ["12oz", "16oz"], "default": "12oz", "price_modifier": {"16oz": 2.5}},
      {"name": "Flavor", "options": ["Mango", "Peach", "Strawberry"], "default": "Strawberry", "price_modifier": {}}
    ],
    "is_available": false,
    "created_at": new Date().toISOString()
  }
]);
print("✓ Added " + db.menu_items.countDocuments() + " menu items!");
'

echo ""
echo "Done! Check https://espressobeso.com/menu"
