import { babel } from "@rollup/plugin-babel";
import pkg from "./package.json";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

// see https://rollupjs.org/guide/en/

const extensions = [`.mjs`, `.js`, `.json`, `.node`, `.ts`, `.tsx`]

export default [
	{
		input: `src/tag.mjs`,
    preserveModules: true,
    output: [
      {
        file: "dist/tag.umd.js",
        name: "text-annotation-graphs",
        format: 'umd'
      },
      {
        file: pkg.main,
        name: "text-annotation-graphs",
        format: "cjs"
      },
      {
        file: pkg.module,
        name: "text-annotation-graphs",
        format: "esm"
      }
      // { dir: "dist", 
      //   format: "esm", 
      //   entryFileNames: "[name].mjs" 
      // }
    ],
		plugins: [
      babel({
        extensions,
        babelHelpers: `runtime`,
        exclude: `node_modules/**`,
      }),
      // see https://www.npmjs.com/package/@rollup/plugin-node-resolve
      resolve({
        // pass custom options to the resolve plugin
        customResolveOptions: {
          moduleDirectories: ['node_modules']
        },
        // indicate which modules should be treated as external
        external: []
      }),
      commonjs()
      // terser(),
			// size({
			// 	writeFile: false,
			// }),
    ],
	},
];
