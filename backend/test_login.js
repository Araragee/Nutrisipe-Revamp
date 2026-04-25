async function testLogin() {
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'user@test.com',
        password: 'Test123!'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error during login test:', error);
  }
}

testLogin();
