const fs = require('fs');
const path = require('path');

// Copy .env.example to .env if .env doesn't exist
const envExamplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    try {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ Created .env file from .env.example');
        console.log('📝 Please review and update the .env file with your specific configuration');
    } catch (error) {
        console.error('❌ Error creating .env file:', error.message);
    }
} else {
    console.log('ℹ️  .env file already exists');
}
