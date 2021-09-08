export class SimpleError extends Error
{
    public code: number
    public data: string|Record<string, unknown> 
    constructor(code: number, message: string, data: string|Record<string, unknown> = '')
    {
        super(message)
        this.code = code
        this.data = data
    }

    static BadRequest =  (message: string, data = ''): SimpleError =>
    {
        return new SimpleError(400, message, data)
    }

    static NotAuthentified = (message: string, data = ''): SimpleError =>
    {
        return new SimpleError(401, message, data)
    }

    static Forbidden = (message: string, data = ''): SimpleError =>
    {
        return new SimpleError(403, message, data)
    }

    static NotFound = (message: string, data = ''): SimpleError => 
    {
        return new SimpleError(404, message, data)
    }

    static ServerError = (message: string, data = ''): SimpleError => 
    {
        return new SimpleError(500, message, data)
    }

}

export enum HAPPY_ERRORS 
{
    MISSING_PARAMETER = 'A parameter is missing : ',
    UNKNOW_PARAMETER = 'Unknown parameter : ',
    UNABLE_TO_READ_BODY = 'Unabled to read body'
}
