// Avatar primitives from Radix UI are thin wrappers around native elements that provide
// accessibility attributes and state handling. We wrap those primitives with our own
// components so we can apply shared Tailwind CSS classes and expose a friendlier API.
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/utils/general';

/**
 * Avatar
 * -----
 * 1️⃣ Thin wrapper around `AvatarPrimitive.Root` that applies a consistent set of
 * Tailwind utility classes (size, border‑radius, overflow) while still allowing
 * the caller to pass additional `className` and props.
 */
function Avatar({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
    return (
        <AvatarPrimitive.Root
            data-slot='avatar'
            className={cn(
                'relative flex size-8 shrink-0 overflow-hidden rounded-full',
                className
            )}
            {...props}
        />
    );
}

/**
 * AvatarImage
 * ------------
 * Wrapper around `AvatarPrimitive.Image`. The component renders the actual
 * image for the avatar. If it fails to load or is not provided, Radix will
 * fall back to `AvatarPrimitive.Fallback` (see below).
 */
function AvatarImage({
    className,
    ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
        <AvatarPrimitive.Image
            data-slot='avatar-image'
            className={cn('aspect-square size-full', className)}
            {...props}
        />
    );
}

// Accept **only** a string as `children` so we can safely derive initials.
type AvatarFallbackProps = {
    /** The full name that should be converted to initials, e.g. "John Doe" */
    children: string;
};

/**
 * AvatarFallback
 * --------------
 * Displays a set of initials derived from the provided name when the avatar
 * image cannot be displayed.
 *
 * The initials are computed once per `children` string via `useMemo` to avoid
 * unnecessary work on re‑renders.
 */
function AvatarFallback({ children, ...props }: AvatarFallbackProps) {
    // 🧮 Compute initials – e.g. "John Doe"          -> "JD"
    //                              "Ada Lovelace"  -> "AL"
    //                              "Single"        -> "S"
    const fallbackText = React.useMemo(() => {
        return children
            .trim() // remove leading/trailing whitespace
            .split(/\s+/) // split on one or more spaces
            .map((word) => word.charAt(0).toUpperCase()) // take first letter of each word
            .join(''); // join the letters together
    }, [children]);

    return (
        <AvatarPrimitive.Fallback
            data-slot='avatar-fallback'
            className={cn(
                'bg-muted flex size-full items-center justify-center rounded-full'
            )}
            {...props}
        >
            {fallbackText}
        </AvatarPrimitive.Fallback>
    );
}

// We export the three building blocks so consumers can compose more complex
// UI patterns (e.g. status badges on the avatar) if needed.
export { Avatar, AvatarImage, AvatarFallback };
