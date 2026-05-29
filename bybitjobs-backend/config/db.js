const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Kết nối thành công tới MongoDB 🎉');
    } catch (err) {
        console.error('Lỗi kết nối MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;