module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'local'],
    extends: ['plugin:@typescript-eslint/recommended'],
    rules: {
        'array-bracket-spacing': ['error', 'never'],
        'block-spacing': ['error', 'always'],
        'object-curly-spacing': ['error', 'never'],
        'no-multi-spaces': 'error',
        'no-trailing-spaces': 'error',
        'no-whitespace-before-property': 'error',
        'semi': ['error', 'always'],
        'space-before-function-paren': ['error', {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always',
        }],
        'space-in-parens': ['error', 'never'],
        'spaced-comment': ['error', 'always', {exceptions: ['-']}],
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/func-call-spacing': ['error', 'never'],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-object-literal-type-assertion': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
    },
    overrides: [
        {
            files: ['tasks/**/*.js'],
            rules: {
                '@typescript-eslint/no-var-requires': 'off',
            },
        },
        {
            files: ['**/*.tsx'],
            rules: {
                'local/jsx-uses-m-pragma': 'error',
                'local/jsx-uses-vars': 'error',
            },
        },
    ],
};
