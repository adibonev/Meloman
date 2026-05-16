// NativeWind v4 babel setup (CLAUDE.md §2.2). `jsxImportSource:
// "nativewind"` routes JSX through NativeWind so `className` works on RN
// primitives; `nativewind/babel` adds the CSS-interop transform.
// babel-preset-expo still honours app.json's reactCompiler experiment.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
