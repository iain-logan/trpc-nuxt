// generated by trpc-nuxt
      import * as trpc from '@trpc/server'
      
      export const router = trpc
        .router()
        .query('hello', {
          resolve: () => 'world',
        });
      
      export type Router = typeof router
    