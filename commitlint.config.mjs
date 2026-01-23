export default {
    extends: ['@commitlint/config-conventional'],
    plugins: ['@checkmarkdevtools/commitlint-plugin-rai'],
    rules: {
        'rai-footer-exists': [2, 'always'],
        'signed-off-by': [1, 'always'],
        'body-leading-blank': [1, 'always'],
        'footer-leading-blank': [1, 'always'],
    },
};
