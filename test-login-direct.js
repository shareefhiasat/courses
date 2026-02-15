// Test direct Firebase login (bypasses any app functions)
const testDirectLogin = async () => {
  const apiKey = "AIzaSyD9taKFsiHD16IqiOq8g22LKOkiH1Ak-7k";
  
  try {
    // Use the REST API directly (bypasses any app-level functions)
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'shareef.hiasat@gmail.com',
        password: 'Jordan123$', // Try this password
        returnSecureToken: true
      })
    });
    
    const data = await response.json();
    console.log('Direct login response:', response.status);
    console.log('Response body:', data);
    
    if (response.ok && data.idToken) {
      console.log('✅ Direct login successful!');
      console.log('User ID:', data.localId);
      console.log('Email:', data.email);
    } else {
      console.log('❌ Direct login failed:', data.error?.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testDirectLogin();
