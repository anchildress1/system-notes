const config = {
  extends: ['@commitlint/config-conventional'],
  plugins: ['commitlint-plugin-rai'],
  rules: {
    'rai-footer-exists': [2, 'always'],
    'rai-signed-off-by': [2, 'always'],
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
  },
};

export default config;
