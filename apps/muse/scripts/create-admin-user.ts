// Simple admin user creation via API call
async function createAdminUser() {
  try {
    const adminEmail = 'admin@muse.local';
    const adminPassword = 'admin123456'; // Simple admin password
    
    console.log('🔐 Creating admin user via API...');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);

    // Make signup request to the auth API
    const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        name: 'MUSE Admin'
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Admin user created successfully!');
      console.log('\n🎉 Ready to login!');
      console.log('📧 Email: admin@muse.local');
      console.log('🔑 Password: admin123456');
      console.log('🔗 Login at: http://localhost:3000/login');
    } else {
      if (response.status === 422 && result.error && result.error.includes('already exists')) {
        console.log('⚠️  Admin user already exists!');
        console.log('\n🎉 Ready to login!');
        console.log('📧 Email: admin@muse.local');
        console.log('🔑 Password: admin123456');
        console.log('🔗 Login at: http://localhost:3000/login');
      } else {
        console.error('❌ Error creating admin user:', result);
      }
    }
    
  } catch (error) {
    console.error('❌ Network error creating admin user:', error);
  }
}

createAdminUser();