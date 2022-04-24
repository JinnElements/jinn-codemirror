import {nodeResolve} from "@rollup/plugin-node-resolve"

export default [
    {
        input: './src/index.js',
        output: [{
            format: "es",
            file: "./dist/index.es.js"
        }],
        plugins: [
            nodeResolve()
        ]
    }
]