#!/bin/bash

echo "=== Checking Menu Items in Database ==="

mongosh espresso_beso --quiet --eval '
print("Total menu items: " + db.menu_items.countDocuments());
print("");
print("=== All Menu Items ===");
db.menu_items.find({}, {_id: 0, id: 1, name: 1, category: 1, is_available: 1}).forEach(function(item) {
    print(item.category + " | " + item.name + " | Available: " + item.is_available);
});
'

echo ""
echo "=== Categories ==="
mongosh espresso_beso --quiet --eval '
db.menu_items.distinct("category").forEach(function(cat) {
    print("  - " + cat);
});
'
