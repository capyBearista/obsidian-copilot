module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "ts-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^obsidian$": "<rootDir>/__mocks__/obsidian.js",
    // @orama/orama uses conditional exports: "browser" → ESM, "require" → CJS.
    // Jest with jsdom prefers "browser" and hits ESM-only files.
    // Force resolution to the CJS entry point.
    "^@orama/orama$": "<rootDir>/node_modules/@orama/orama/dist/commonjs/index.js",
  },
  testRegex: ".*\\.test\\.(jsx?|tsx?)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: ["/node_modules/"],
  setupFiles: ["<rootDir>/jest.setup.js"],
};
