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
};