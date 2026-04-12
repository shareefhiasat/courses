import React, { useEffect } from 'react';

/**
 * Silent Check SSO Component
 * 
 * This component handles Keycloak's silent SSO checks.
 * It's a minimal page that Keycloak loads in an iframe to check
 * if the user is still authenticated without interrupting the user experience.
 */

const SilentCheckSso = () => {
  useEffect(() => {
    // This component is intentionally minimal
    // Keycloak will handle the SSO check automatically
    // The page will be loaded in an iframe and will communicate back to the parent
    
    // Optional: Log for debugging (can be removed in production)
    console.log('Silent SSO check initiated');
    
    // Clean up if needed
    return () => {
      console.log('Silent SSO check completed');
    };
  }, []);

  return (
    <div style={{ display: 'none' }}>
      {/* This component is intentionally empty */}
      {/* Keycloak will inject its scripts and handle the SSO check */}
      <script>
        {`
          // Keycloak will handle the SSO check automatically
          // This page is intentionally minimal to avoid any interference
        `}
      </script>
    </div>
  );
};

export default SilentCheckSso;
