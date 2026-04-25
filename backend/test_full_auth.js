async function testRegister() {
  const email = `test_${Date.now()}@example.com`;
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `user_${Date.now()}`,
        email: email,
        password: 'Password123!',
        displayName: 'Test User'
      })
    });
    
    const data = await response.json();
    console.log('Registration Status:', response.status);
    console.log('Registration Data:', JSON.stringify(data, null, 2));
    
    if (response.status === 201) {
      const token = data.data.token;
      console.log('Token received:', token);
      
      // Now test /me route
      const meResponse = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const meData = await meResponse.json();
      console.log('Me Status:', meResponse.status);
      console.log('Me Data:', JSON.stringify(meData, null, 2));
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testRegister();
