import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
        forward: jest.fn(),
        refresh: jest.fn(),
        prefetch: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}));

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
        return <img { ...props } />;
    },
}));

// Mock next/link
jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => {
        return <a href={ href } {...props
} > { children } </a>;
    },
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
} as any;
