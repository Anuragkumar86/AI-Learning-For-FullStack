
interface RetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    factor?: number;
}

export async function GeminiRetry<T>(
    ApiCall: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const maxRetries = options?.maxRetries || 5;
    const initialsDelaysMs = options?.initialDelayMs || 1000;
    const maxDelayMs = options?.maxDelayMs || 32000;
    const factor = options?.factor || 2;

    let attempt = 0;
    while (true) {

        try {
            console.log(`API call to gemini in try block with ${attempt} attempts`);
            return await ApiCall();
        }
        catch (err: any) {
            attempt++;

            const status = err?.status || err?.statusCode

            // const isRetriable = status === 429 || status === 408 || (status >= 500 && status <= 600)

            if ( attempt > maxRetries) {
                console.log(`This Error is not Retriable with status code status ${status} OR attempts is reached to maximum of ${attempt}`)
                throw err
            }

            // nextretryTime, jitter, maxkitnajayega
            const nextretryTime = initialsDelaysMs * Math.pow(factor, attempt - 1);
            const maxkitnajayega = Math.min(nextretryTime, maxDelayMs);
            const jitter = nextretryTime +  Math.random() * 1000

            console.warn(`[Gemini API] Error ${status}. Retrying attempt ${attempt}/${maxRetries} after ${Math.round(jitter)}ms...`);

            await new Promise((resolve) => setTimeout(resolve, jitter))
        }
    }
}