module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiBase: process.env.EXPO_PUBLIC_API_BASE || config.extra?.apiBase || 'http://localhost:3000/api',
    privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL || config.extra?.privacyUrl,
    termsUrl: process.env.EXPO_PUBLIC_TERMS_URL || config.extra?.termsUrl,
  },
});
