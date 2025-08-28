const cloudinary = require("cloudinary").v2;

// For production on Render, make sure these environment variables are set in the Render dashboard
const config = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dr0xh0y16',
  api_key: process.env.CLOUDINARY_API_KEY || '882621583315878',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'Tn2-uV839PlkGNfCfLP8q3iCZY8',
  secure: true
};

// Log configuration (without sensitive data)
console.log('Initializing Cloudinary with config:', {
  cloud_name: config.cloud_name ? 'Set' : 'Missing',
  api_key: config.api_key ? 'Set' : 'Missing',
  api_secret: config.api_secret ? 'Set' : 'Missing',
  secure: config.secure
});

// Configure Cloudinary
cloudinary.config(config);

module.exports = cloudinary;
