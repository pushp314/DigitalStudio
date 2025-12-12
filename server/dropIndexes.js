const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const dropIndexes = async () => {
    try {
        const db = mongoose.connection.db;
        const collection = db.collection('products');

        // Drop all indexes except _id
        await collection.dropIndexes();

        console.log('✅ All indexes dropped successfully!');
        process.exit();
    } catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
};

// Wait for connection
mongoose.connection.once('open', () => {
    dropIndexes();
});
