const cloudinary = require("cloudinary").v2;

// Debug log environment variables
console.log('Cloudinary Config - Environment Variables:', {
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not Set',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Not Set',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Not Set'
});

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true // Ensure HTTPS
});

// Verify configuration
console.log('Cloudinary Config - Current Config:', {
  cloud_name: cloudinary.config().cloud_name ? 'Configured' : 'Missing',
  api_key: cloudinary.config().api_key ? 'Configured' : 'Missing',
  api_secret: cloudinary.config().api_secret ? 'Configured' : 'Missing'
});

module.exports = cloudinary;
