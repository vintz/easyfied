import * as Http from 'http'
import { SimpleError, HAPPY_ERRORS } from '../error/error'

export interface IParam
{
    Name: string,
    Required: boolean, 
}


export enum RouteMethod
{
    POST = 'POST',
    GET = 'GET',
    USE = 'USE',
    HEAD = 'HEAD',
    PUT  = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH',
    MIDDLEWARE = 'MIDDLEWARE',
    STATIC = 'STATIC',
}

export interface IRoute
{
    Path: string,
    Exec: (...args: unknown[]) => unknown, 
    Method: RouteMethod, 
    Regexp: RegExp,
    Params: IParam[]
}

export enum PathResult 
{
    NotInPath =  -1,
    NoReturn = 1,
    ValueReturned = 2
}

export interface IHappyServer 
{
    InnerServer: Http.Server,
    Routes: Array<IRoute>,
    AddRoute: (type: RouteMethod, path: string, exec:  (...args: unknown[]) => unknown) => void,
    AddStatic: (baseUrl: string, folderPath: string) => void
}

export class IncomingMessage extends Http.IncomingMessage
{
    query?: Record<string, unknown>   
    body?: Record<string, unknown> | string
}

export interface IUrlInfo 
{
    Route: string | null
    Parameters?: Record<string, unknown>
    Body?: Record<string, unknown>
}


// eslint-disable-next-line @typescript-eslint/ban-types
export const getParamsFromFunction = (func: Function, lowercase?:boolean): IParam[] => 
{ 
        
    // String representaation of the function code 
    let str = func.toString() 
    
    // Remove comments of the form /* ... */ 
    // Removing comments of the form // 
    // Remove body of the function { ... } 
    // removing '=>' if func is arrow function  
    str = str.replace(/\/\*[\s\S]*?\*\//g, '')  
        .replace(/\/\/(.)*/g, '')          
        .replace(/{[\s\S]*}/, '') 
        .replace(/=>/g, '') 
        .trim() 
    
    // Start parameter names after first '(' 
    const start = str.indexOf('(') + 1 
    
    // End parameter names is just before last ')' 
    const end = str.length - 1 
    
    const result = str.substring(start, end).split(', ') 
    
    const params: IParam[] = [] 
    
    result.forEach(element => { 
            
        // Removing any default value 
        const varname = element.replace(/=[\s\S]*/g, '').trim() 
        if (varname !== '')
        {
            const currentParam: IParam = {
                Name: lowercase? varname.toLowerCase() : varname,
                Required: element.indexOf('=') < 0
            }
        
            params.push(currentParam) 
        }
       
    }) 
        
    return params 
} 

/* @Return: -1 => the current route doesn't know current path
*            1 => the current route should parse the current request without returning a value (middleware) 
*            2 => the current route should parse the current request and return the final value
*/
export const checkPath = (path: string | null, route: IRoute, method?: string): PathResult =>
{
    if (route.Method === RouteMethod.MIDDLEWARE || ((route.Method === method || route.Method === RouteMethod.USE ) && route.Regexp.test(path ?? '')))
    {
        return route.Method === RouteMethod.MIDDLEWARE? 1 : 2 
    }

    if (route.Method === RouteMethod.STATIC && route.Regexp.test(path ?? ''))
        return 3

    return -1 
}

export const checkParams = (req: IncomingMessage, expectations: Array<IParam>, res: Http.ServerResponse, params?: Record<string, unknown>): unknown[] =>
{
    const result: unknown[] = []
    const unset: string[] = []

    const infos: Record<string, unknown> = {
        '_req': req,
        '_res': res,
        '_method': req.method,
        '_headers': req.headers,
    }
    
    expectations.forEach(expectation =>
    {
        const key = expectation.Name
        let val = params && params[key] 
       
        if (key in infos) val = infos[key] 

        if (val !== undefined)
        {
            return result.push(val)
        }

        if (expectation.Required)
        {
            unset.push(key)
        }

    })

    if (unset.length > 0)
    {
        throw SimpleError.BadRequest(`${HAPPY_ERRORS.MISSING_PARAMETER}${unset.join(',')}`)
    }

    return result
   
}

export const parseUrl = (url: string | undefined): IUrlInfo =>
{
    if (!url)
        return {Route: null}

    const splitted = url.split('?', 2) 
    const parametersSplitted = splitted.length > 1? splitted[1].split('&'): null
    const parameters: Record<string, unknown> = {}
    if (parametersSplitted)
    {
        for (let idx = 0; idx < parametersSplitted.length; idx++)
        {
            const current = parametersSplitted[idx]
            const parameter = current.split('=',2)
            parameters[parameter[0].toLowerCase()] = parameter.length > 1? parameter[1]: null
        }
    }
    return { Route: splitted[0].toLowerCase().trim(), Parameters: parameters}
}

export const parseBody = (req: IncomingMessage): Promise<Record<string, unknown>> =>
{
    return new Promise<Record<string, unknown>>((resolve, reject) =>
    {
        let body = ''
        let result: Record<string, unknown> = {}

        req.on('readable', function() {
            const tmp = req.read()
            if (tmp)
            {
                body += tmp
            }
        })

        req.on('end', function() {
            if (req.headers['content-type'] == 'application/json')
            {
                try {
                    result =  JSON.parse(body)
                }
                catch(err)
                {
                    reject(SimpleError.BadRequest('unable to parse json body'))
                    return 
                }
                
            }
            else 
            {
                // TODO ADD THIS INFO TO DOC
                result =  {body: body}
            }
            resolve(result)
        })

        req.on('error', ()=>
        {
            reject(new Error(HAPPY_ERRORS.UNABLE_TO_READ_BODY))
        })
    })
}

export const pathToRegexp = (path: string, method: RouteMethod): RegExp =>
{
    let res = path
    const regexp1 = new RegExp('(:[^/]+)', 'g')
    let tmp

    res = res.replace(/\*/g, '(.*)')
    while ((tmp = regexp1.exec(path)) !== null)
    {
        const name =  tmp[0].replace(':','')
        res = res.replace(tmp[0],`(?<${name}>[^/]*)`)
       
    }
    if (method !== RouteMethod.STATIC)
    {
        res += '$'
    }
   
    return new RegExp(res, '')
}

export const respond = (res: Http.ServerResponse, code: number, body : string|Record<string, unknown>|null): void =>
{
    if (typeof body === 'object')
    {
        res.writeHead(code, {'Content-Type': 'application/json'}) 
        body = JSON.stringify(body)
    }
    else 
    {
        res.writeHead(code, {'Content-Type': 'text/html'}) 
    }
    res.write(body, 'utf-8')

    res.end() 
}


const getUriParams = (url: string, regexp: RegExp): Record<string, string> =>  
{
    const response = regexp.exec(url)
    return response?.groups ?? {}
}

const servers: Record<number, IHappyServer> = {}

export const manageError = (res: Http.ServerResponse, err: SimpleError|Error): boolean =>
{
    const code = Object.keys(err).includes('code')? (err as SimpleError).code : 500
    respond(res, code, err.message)
    return true
}

const getResponseCode: () => number = () =>
{
    const code = this ? (this as Record<string, unknown>)?.statusCode : 200
    if (this)  (this as Record<string, unknown>).statusCode = 200
    return code as number || 200
}

export const setResponseCode = (code: number): void =>
{
    if (this) (this as Record<string, unknown>).statusCode = code
}

export const  parseRequest = async (port: number, req: Http.IncomingMessage, res: Http.ServerResponse): Promise<void> => 
{
    const server = servers[port]
    const urlInfo = parseUrl(req.url)
    const req2 = req as IncomingMessage
    req2.query = urlInfo.Parameters
    let error

    try {
        urlInfo.Body =  await parseBody(req2)
    }
    catch(err)
    {
        manageError(res, err)
        return 
    }
    
    let executed = false

    if (server){
        
        for (const idx in server.Routes) {
            const route = server.Routes[idx]
            const isPathValid = checkPath(urlInfo.Route, route, req.method)
            if (isPathValid !== PathResult.NotInPath)
            {
                try {
                    const params = req2.method === RouteMethod.GET? urlInfo.Parameters : urlInfo.Body
                    const uriParams = getUriParams(req.url || '', route.Regexp)
                    
                    const data = checkParams(req2, route.Params, res, {...params, ...uriParams})
                    const result = await route.Exec(...data)
                    if (isPathValid === PathResult.ValueReturned && !error)
                    {
                        if (result === void 0)
                        {
                            respond(res, 204, null)    
                            return 
                        }

                        const statusCode = getResponseCode()
                        respond(res, statusCode, result as string|Record<string, unknown>)
                    }
                }
                catch(err)
                {
                    error = err
                }
                finally
                {
                    executed = isPathValid === PathResult.ValueReturned
                }
            }
            if (executed) break
        }
    }
    if (!executed)
    {
        // TODO ENHANCE 404
        return respond(res, 404, 'not found')
    }
    if (error)
    {
        manageError(res, error)
    }
}

export const getServer = (port: number): IHappyServer => 
{
    return servers[port]
}

export const setServer = (port: number, server: IHappyServer): void => 
{
    servers[port] = server
}

export const deleteServer = (port: number): void => 
{
    delete servers[port]
}