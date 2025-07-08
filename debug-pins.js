// Debug tool to help find PIN for any deal
const deals = [
  { id: 1, title: "Premium Designer Clothing Collection", pin: "2003" },
  { id: 2, title: "Luxury Footwear Showcase", pin: "3014" },
  { id: 3, title: "Electronics & Gadgets", pin: "4025" },
  { id: 4, title: "Home & Kitchen", pin: "5036" },
  { id: 5, title: "Sports & Fitness", pin: "6047" },
  { id: 6, title: "Books & Education", pin: "7058" },
  { id: 7, title: "Health & Beauty", pin: "8069" },
  { id: 8, title: "Travel & Tourism", pin: "9080" },
  { id: 9, title: "Food & Beverages", pin: "1091" },
  { id: 10, title: "Entertainment", pin: "2102" },
  { id: 11, title: "Gourmet Fine Dining Experience", pin: "4121" },
  // Add more as needed
];

console.log("Available deals and their PINs:");
deals.forEach(deal => {
  console.log(`Deal ${deal.id}: ${deal.title} - PIN: ${deal.pin}`);
});

console.log("\nTo verify a PIN:");
console.log("1. Find your deal in the list above");
console.log("2. Use the corresponding PIN");
console.log("3. Make sure you're logged in with the new JWT token");