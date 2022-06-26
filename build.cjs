const esbuild = require("esbuild");
const mfs = require("micro-fs");
const fs = require('fs');
const path = require('path');
const commandLineArgs = require("command-line-args");
const chalk = require("chalk");
const { analyzeText, transformAnalyzerResult } = require("web-component-analyzer");


function replace(inPath, outPath, patterns) {
    const content = fs.readFileSync(path.join(__dirname, inPath), "utf-8");
    const replaced = patterns.reduce((content, pattern) => {
        return content.replace(pattern.regex, pattern.replacement);
    }, content);
    const out = path.join(__dirname, outPath, path.basename(inPath));
    fs.writeFileSync(out, replaced, {encoding: 'utf-8'});
}

function docs(inPath) {
    const code = fs.readFileSync(path.join(__dirname, inPath), "utf-8");
    const { results, program } = analyzeText(code);
    const markdown = transformAnalyzerResult('markdown', results, program, {markdown: {titleLevel: 3}});
    replace('README.md', '.', [{regex: /## API.*$/g, replacement: `## API\n\n${markdown}`}]);
}

async function bundle() {
    console.log(chalk.blue('Bundling source files ...'));
    await esbuild
		.build({
			entryPoints: ['./src/jinn-codemirror.ts'],
            outdir: 'dist',
			bundle: true,
            minify: !args.dev,
			sourcemap: !args.dev,
			logLevel: "info",
		})
		.catch((err) => {
			console.error(err);
			process.exit(1);
		});
}

async function clean() {
    console.log(chalk.blue('Cleaning files ...'));
    await mfs.delete([
        'dist/**',
        'index.html'
    ], { allowEmpty: true, silent: false });
}

async function prepare() {
    console.log(chalk.green('Preparing build ...'));
    const distDir = path.join(__dirname, "..", "dist");
	if (!fs.existsSync(distDir)) {
		fs.mkdirSync(distDir);
	}

    replace('demo/index.html', '.', [
        {regex: /..\/src\/jinn-codemirror.ts/, replacement: 'dist/jinn-codemirror.js'},
        {regex: /..\/src\/epidoc.json/, replacement: 'dist/epidoc.json'}
    ]);
    await mfs.copy('src/epidoc.json', 'dist');
}

const args = commandLineArgs([
    { name: "command", type: String, defaultOption: true, defaultValue: 'build' }
]);

(async () => {
    if (args.command === 'clean') {
        await clean();
        return;
    }
    docs('./src/jinn-codemirror.ts');
    await prepare();
    await bundle();
})();