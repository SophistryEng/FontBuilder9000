import typescript from '@rollup/plugin-typescript';

export default {
  input: 'ts/index.ts',
  output: {
    file: 'main.js',
    format: 'es',
  },
  plugins: [
    typescript(),
  ],
};
