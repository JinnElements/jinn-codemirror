import typescript from "rollup-plugin-ts";
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

export default [
    {
        input: ['./src/index.ts', './src/jinn-codemirror.ts'],
        // external: id => id != "tslib" && !/^(\.?\/|\w:)/.test(id),
        output: [{
            format: "es",
            dir: "./dist"
        }],
        plugins: [
            resolve(),
            typescript(),
            terser({
                compress: {
                    reduce_vars: false
                }
            }),
            copy({
                targets: [
                    {
                        src: 'demo/index.html',
                        dest: '.',
                        transform: (contents) =>
                            contents.toString().replace(/..\/src\/jinn-codemirror.ts/, 'dist/jinn-codemirror.js')
                            .replace(/..\/src\/epidoc.json/, 'dist/epidoc.json')
                    },
                    {
                        src: 'src/epidoc.json',
                        dest: 'dist'
                    }
                ]
            })
        ]
    }
]