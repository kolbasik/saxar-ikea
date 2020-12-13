module.exports = {
    root: true,
    parser: "@typescript-eslint/parser", // Specifies the ESLint parser
    parserOptions: {
        sourceType: "module",
        ecmaVersion: 2020,
        ecmaFeatures: {
            jsx: true
        }
    },
    env: {
        es2020: true,
        browser: true,
        node: true,
        jest: true,
        mocha: true
    },
    plugins: ["import", "promise", "@typescript-eslint", "prettier"],
    extends: [
        "plugin:import/errors",
        "plugin:import/warnings",
        "plugin:import/typescript",
        "plugin:promise/recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "prettier/@typescript-eslint",
        "plugin:prettier/recommended"
    ],
    settings: {
        "import/extensions": [".js", ".ts", ".mjs", ".jsx", ".tsx"],
        "import/resolver": {
            typescript: {} // this loads <rootdir>/tsconfig.json to eslint
        }
    },
    rules: {
    }
};
