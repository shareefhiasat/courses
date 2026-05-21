# QAF LMS Collabora Branding

This directory contains custom branding for Collabora Online with QAF LMS theme.

## Security Features Enabled

- SSL certificate checking: `--o:security.enable_ssl_cert_check=true`
- SSL revocation checking: `--o:security.enable_ssl_revocation=true`
- Update check disabled: `--o:security.update_check_enable=false` (for offline environments)

## Branding Configuration

- **Brand Name**: QAF
- **Logo Text**: QAF LMS
- **Primary Color**: Maroon (#800000)

## Custom Logo

To add the QAF logo:

1. Place your QAF logo file in this directory as `logo.png` or `logo.svg`
2. Supported formats: PNG, SVG, JPG
3. Recommended size: 200x50px
4. The logo will replace the Collabora logo in the editor

## Applying Changes

To apply the branding changes:

```bash
# Restart Collabora container
docker restart lms-qaf-collabora

# Or restart the entire stack
docker compose -p qaf-lms -f scripts/docker/docker-compose.yml restart collabora
```

## Custom CSS

The `branding.css` file contains custom styling with QAF maroon color (#800000). You can modify colors in this file to match your exact brand requirements.

## Color Scheme

- Primary: #800000 (Maroon)
- Primary Light: #990000
- Primary Dark: #660000
- Accent: #800000

## Notes

- The branding is applied via volume mount to `/etc/coolwsd/branding`
- CSS overrides are applied after Collabora's default styles
- For production use, consider getting Collabora Enterprise Edition for full white-label capabilities
