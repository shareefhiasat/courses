@echo off
echo 🔒 Generating SSL certificates for localhost development...
echo.

cd /d "%~dp0client"

openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout localhost-key.pem -out localhost-cert.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ SSL certificates generated successfully!
    echo 📁 Files created in client directory:
    echo    - localhost-key.pem (private key)
    echo    - localhost-cert.pem (certificate)
    echo.
    echo 🌐 Now you can access: https://localhost:5174/
    echo ⚠️  You'll need to accept the security warning in your browser
    echo.
    echo 🔄 Restart your development server to use HTTPS
) else (
    echo.
    echo ❌ Error generating certificates. Make sure OpenSSL is installed.
    echo 💡 Download OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html
)

echo.
pause
