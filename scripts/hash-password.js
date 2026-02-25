const bcrypt = require('bcryptjs');

const password = 'demo';
const hash = bcrypt.hashSync(password, 10);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('\n--- SQL to update database ---');
console.log(`UPDATE "users" SET "password_hash" = '${hash}';`);
