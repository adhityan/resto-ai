import { AxiosError } from 'axios';
import { toast } from 'sonner';

export function handleServerError(error: unknown, exception: unknown) {
    // eslint-disable-next-line no-console
    console.error('handleServerError', error, exception);

    let errMsg = 'Something went wrong!';

    if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        Number(error.status) === 204
    ) {
        errMsg = 'Content not found.';
    }

    if (error instanceof AxiosError) {
        errMsg = error.response?.data.title;
    }

    if (typeof error === 'string' && error.length > 0) {
        errMsg = error;
    }

    toast.error(errMsg);
}
