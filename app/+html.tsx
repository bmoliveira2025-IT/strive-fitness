import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="pt-BR">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1.00001, viewport-fit=cover"
                />

                {/* PWA Settings */}
                <title>Strive Fitness</title>
                <meta name="description" content="Seu companheiro inteligente de treinos, musculação e evolução física." />
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#8B5CF6" />

                {/* Apple iOS PWA tags */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Strive" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
                <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />

                {/* Service Worker Registration */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration error:', err);
                  });
                });
              }
            `,
                    }}
                />

                <ScrollViewStyleReset />
            </head>
            <body>{children}</body>
        </html>
    );
}
