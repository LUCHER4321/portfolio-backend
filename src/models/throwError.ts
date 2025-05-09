export const throwError = (e: any, ...messages: string[]) => {
    if(e instanceof Error) if(messages.includes(e.message)) throw e;
}