#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const basketRoutePath = path.join(__dirname, '../app/api/basket/route.ts');

// Read the file
let content = fs.readFileSync(basketRoutePath, 'utf8');

// Replace all remaining session.user references with user
content = content.replace(/session\.user\.id/g, 'user.id');
content = content.replace(/session\.user\.email/g, 'user.email');

// Write the file back
fs.writeFileSync(basketRoutePath, content);

console.log('✅ Fixed all session.user references in basket API route');
console.log('📝 Updated:', basketRoutePath);
