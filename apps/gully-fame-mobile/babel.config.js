module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
          alias: {
            "@": "./src",
            "@api": "./src/api",
            "@assets": "./src/assets",
            "@components": "./src/components",
            "@contexts": "./src/contexts",
            "@features": "./src/features",
            "@hooks": "./src/hooks",
            "@navigation": "./src/navigation",
            "@screens": "./src/screens",
            "@store": "./src/store",
            "@styles": "./src/styles",
            "@types": "./src/types",
            "@utils": "./src/utils",
            "@constants": "./constants",
            "@modules": "./src/modules",
          },
        },
      ],
      // ✅ REMOVED: Reanimated, Vision Camera, FFmpeg plugins causing bundler errors
      // Will add back after core app is stable
    ],
  };
};
