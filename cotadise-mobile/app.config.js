module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    apiBase: process.env.EXPO_PUBLIC_API_BASE || config.extra?.apiBase || 'https://cotadise-api.onrender.com/api',
    privacyUrl:
      process.env.EXPO_PUBLIC_PRIVACY_URL ||
      config.extra?.privacyUrl ||
      'https://cotadise-admin.onrender.com/privacy.html',
    termsUrl:
      process.env.EXPO_PUBLIC_TERMS_URL ||
      config.extra?.termsUrl ||
      'https://cotadise-admin.onrender.com/terms.html',
  },
});
