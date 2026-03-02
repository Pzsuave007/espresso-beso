#!/bin/bash

echo "=== Cleaning Extra Menu Items ==="

mongosh espresso_beso --quiet --eval '
// Remove items that are NOT part of Espresso Beso menu
// Keep only: Signature Drinks, Iced Drinks, Espresso Classics, Smoothies

var result = db.menu_items.deleteMany({
    category: { $in: ["Espresso", "Latte", "Cold"] }
});

print("Deleted " + result.deletedCount + " extra items");
print("");
print("=== Remaining Menu Items ===");
print("Total: " + db.menu_items.countDocuments());
print("");
db.menu_items.find({}, {_id: 0, name: 1, category: 1}).forEach(function(item) {
    print("  " + item.category + " | " + item.name);
});
'

echo ""
echo "Done! Refresh the menu page."
