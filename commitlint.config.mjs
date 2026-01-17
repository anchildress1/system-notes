export default {
    extends: ['@commitlint/config-conventional'],
    plugins: ['@checkmarkdevtools/commitlint-plugin-rai'],
    rules: {
        'rai-footer-exists': [2, 'always'],
        'signed-off-by-exists': [1, 'always'],
        'body-leading-blank': [2, 'always'],
        'footer-leading-blank': [2, 'always'],
    },
};
