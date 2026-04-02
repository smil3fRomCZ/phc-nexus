import { defineConfig } from 'vite';
import { resolve } from 'path';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    resolve: {
        alias: {
            'frappe-gantt-css': resolve(__dirname, 'node_modules/frappe-gantt/dist/frappe-gantt.css'),
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        tailwindcss(),
        react(),
    ],
    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: process.env.VITE_HMR_HOST
            ? {
                  host: process.env.VITE_HMR_HOST,
                  clientPort: parseInt(process.env.VITE_HMR_CLIENT_PORT || '443'),
              }
            : {
                  host: 'localhost',
              },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
