import { esbuildPlugin } from "@web/dev-server-esbuild";

export default {
  plugins: [
    {
      name: 'xhr',
      transform(context) {
        context.response.set('Access-Control-Allow-Origin', 'http://localhost:8080');
        return {
            body: context.body.replace(/process.env.NODE_ENV/g, JSON.stringify('production'))
        };
      }
    },
    esbuildPlugin({ ts: true })
  ],
  middlewares: [
    // Custom middleware to serve static content from a specific directory
    (ctx, next) => {
      // Check if the request path starts with "/static"
      if (ctx.url.startsWith('/css')) {
        // Specify the directory from which to serve static content
        ctx.filePath = `./dist/css${ctx.url}`;
      }

      // Call the next middleware in the stack
      return next();
    },
  ],
};