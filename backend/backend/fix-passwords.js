import bcrypt from 'bcryptjs';
import db from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixPasswords() {
    try {
        console.log('Generating fresh hashes...');
        // Generate fresh hashes for the known passwords
        const adminPass = await bcrypt.hash('admin123', 10);
        const customerPass = await bcrypt.hash('customer123', 10);

        console.log('Updating database...');
        // Update staff table
        const staffRes = await db.query(
            "UPDATE staff SET password_hash = $1 WHERE email = 'admin@tacops.io' RETURNING id, callsign", 
            [adminPass]
        );
        
        // Update customers table
        const custRes = await db.query(
            "UPDATE customers SET password_hash = $1 WHERE email = 'customer@tacops.io' RETURNING id, name", 
            [customerPass]
        );

        if (staffRes.rowCount > 0) {
            console.log(`✅ Success! Staff updated: ${staffRes.rows[0].callsign}`);
        } else {
            console.log('❌ Staff record not found. Did the schema seed properly?');
        }

        if (custRes.rowCount > 0) {
            console.log(`✅ Success! Customer updated: ${custRes.rows[0].name}`);
        } else {
            console.log('❌ Customer record not found. Did the schema seed properly?');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing passwords:', err);
        process.exit(1);
    }
}

fixPasswords();
