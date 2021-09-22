export class EasyError extends Error
{
    public code: number
    public data: string|unknown[]|Record<string, unknown> 
    constructor(code: number, message: string, data: string|unknown[]|Record<string, unknown> = '')
    {
        super(message)
        this.code = code
        this.data = data
    }

    static BadRequest =  (message: string, data = ''): EasyError =>
    {
        return new EasyError(400, message, data)
    }

    static NotAuthentified = (message: string, data = ''): EasyError =>
    {
        return new EasyError(401, message, data)
    }

    static Forbidden = (message: string, data = ''): EasyError =>
    {
        return new EasyError(403, message, data)
    }

    static NotFound = (message: string, data = ''): EasyError => 
    {
        return new EasyError(404, message, data)
    }

    static ServerError = (message: string, data = ''): EasyError => 
    {
        return new EasyError(500, message, data)
    }

}

export enum EASY_ERRORS 
{
    MISSING_PARAMETER = 'A parameter is missing : ',
    UNKNOW_PARAMETER = 'Unknown parameter : ',
    UNABLE_TO_READ_BODY = 'Unabled to read body'
}
