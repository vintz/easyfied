import * as Http from 'http'

export interface IOptions 
{
    JsonExpected?: boolean
    Headers?: NodeJS.Dict<string | number | string[]>
    Hostname: string,
    Port: number,
    Path: string,
}

export interface IResult 
{
    Code: number
    Result: string|Record<string, unknown>,
    Headers?: Http.IncomingHttpHeaders
    
}

export const post = (options:IOptions, data?: Record<string, unknown>): Promise<IResult> =>
{
    return call('POST', options, data)
}

export const get = (options:IOptions): Promise<IResult> =>
{
    return call('GET', options)
}

export const put = (options:IOptions): Promise<IResult> =>
{
    return call('PUT', options)
}


export const call = (method: string,  options:IOptions, data?: Record<string, unknown>): Promise<IResult> =>
{
    return new Promise<IResult>((resolve, reject) => 
    {
        try {
            const callOptions = {
                method: method,
                headers: options.Headers,
                hostname: options.Hostname, 
                port: options.Port.toString(),
                path: options.Path 
            }

            const req = Http.request(callOptions, (res: Http.IncomingMessage) => 
            {
                res.setEncoding('utf8')
                let rawData = ''
                res.on('data', (chunk) => { 
                    rawData += chunk 
                })
                res.on('end', () => {
                    const result: IResult = {Code: res.statusCode || 0, Result: {}, Headers: res.headers}
                    try {
                        if (options.JsonExpected){
                            const parsedData = JSON.parse(rawData)
                            result.Result = parsedData
                        }
                        else 
                        {
                            result.Result = rawData
                        }
                        resolve(result)
                        
                    } catch (e) {
                        resolve({Code: 500, Result: e.message})
                    }
                })
                    
            })
            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`)
            })
            if (data !== undefined)
            {
                req.write(JSON.stringify(data)) 
            }
            req.end()
        }
        catch(error)
        {
            reject(error)
        }
    })
}