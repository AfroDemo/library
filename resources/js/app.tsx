import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Error Boundary Component
function ErrorBoundary({ error }: { error: Error }) {
    console.error('ErrorBoundary caught:', error);
    return (
        <div className="p-4 text-red-600">
            <h1>Error</h1>
            <p>Something went wrong: {error.message}</p>
            <p>Please refresh the page or contact support.</p>
        </div>
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        const rawError = props.initialPage.props.error;
        const error = rawError
            ? rawError instanceof Error
                ? rawError
                : new Error(typeof rawError === 'string' ? rawError : JSON.stringify(rawError))
            : null;
        root.render(
            error ? (
                <ErrorBoundary error={error} />
            ) : (
                <App {...props} />
            ),
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
