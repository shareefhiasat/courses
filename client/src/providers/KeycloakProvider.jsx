import { ReactKeycloakProvider } from '@react-keycloak/web';
import keycloak from '../config/keycloak';
import { SimpleLoading } from '../components/ui';

import { info, error, warn, debug } from '@services/utils/logger.js';

export const KeycloakProvider = ({ children }) => {
  return (
      <ReactKeycloakProvider
          authClient={keycloak}
          initOptions={{
            onLoad: 'login-required',
            silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
            pkceMethod: 'S256',
            checkLoginIframe: false,
          }}
          LoadingComponent={<SimpleLoading />}
      >
        {children}
      </ReactKeycloakProvider>
  );
};