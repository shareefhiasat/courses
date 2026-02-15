// Test Firebase Auth API directly
const testFirebaseAuth = async () => {
  const apiKey = "AIzaSyD9taKFsiHD16IqiOq8g22LKOkiH1Ak-7k";
  const email = "shareef.hiasat@gmail.com";
  const password = "test-password";
  
  try {
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        returnSecureToken: true
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const data = await response.text();
    console.log('Response body:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testFirebaseAuth();
