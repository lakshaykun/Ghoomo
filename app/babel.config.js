const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
