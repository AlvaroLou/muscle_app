module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './src',
          },
        },
      ],
      // Reanimated 4 usa o plugin do worklets, que precisa ser o ÚLTIMO.
      'react-native-worklets/plugin',
    ],
  };
};
