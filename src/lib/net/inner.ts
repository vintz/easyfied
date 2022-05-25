import * as Http from 'http'
import { EasyError, EASY_ERRORS } from '../error/error'

export interface IParam
{
    Name: string,
    Required: boolean, 
}


export enum RouteMethod
{
    DELETE = 'DELETE',
    GET = 'GET',
    HEAD = 'HEAD',
    MIDDLEWARE = 'MIDDLEWARE',
    PATCH = 'PATCH',
    POST = 'POST',
    PUT  = 'PUT',
    REDIRECT = 'REDIRECT',
    STATIC = 'STATIC',
    USE = 'USE',

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
    ValueReturned = 2,
    Redirect = 3,
    Static = 4 
}

export interface IEasyServer 
{
    InnerServer: Http.Server,
    Routes: Array<IRoute>,
    AddRoute: (type: RouteMethod, path: string, exec:  (...args: unknown[]) => unknown) => void,
    AddStatic: (baseUrl: string, folderPath: string) => void
    AddMiddleware: ( exec: (...args: unknown[]) => unknown) => void
    AddRedirect(destination: string,  relativeUrl: boolean): void
    DefaultError?: {code: number, message: string}
   // Plugins: Record<string, (server: IEasyServer) => void>
}

export interface IEasyOptions
{
    https?: {key: string, cert: string}
    defaultError?: {code: number, message: string}
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
*            3 => the current route is a redirect and should not return anything
*/
export const checkPath = (path: string | null, route: IRoute, method?: string): PathResult =>
{
    if (route.Method === RouteMethod.REDIRECT)
    {
        return PathResult.Redirect
    }
    if (route.Method === RouteMethod.MIDDLEWARE || ((route.Method === method || route.Method === RouteMethod.USE ) && route.Regexp.test(path ?? '')))
    {
        return route.Method === RouteMethod.MIDDLEWARE? PathResult.NoReturn : PathResult.ValueReturned 
    }

    if (route.Method === RouteMethod.STATIC && route.Regexp.test(path ?? ''))
        return PathResult.Static

    return PathResult.NotInPath
}

export const checkParams = (req: IncomingMessage, expectations: Array<IParam>, res: Http.ServerResponse, server: IEasyServer, params?: Record<string, unknown>): unknown[] =>
{
    const result: unknown[] = []
    const unset: string[] = []

    const infos: Record<string, unknown> = {
        '_req': req,
        '_res': res,
        '_method': req.method,
        '_headers': req.headers,
        '_server': server
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
        throw EasyError.BadRequest(`${EASY_ERRORS.MISSING_PARAMETER}${unset.join(',')}`)
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
                    reject(EasyError.BadRequest('unable to parse json body'))
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
            reject(new Error(EASY_ERRORS.UNABLE_TO_READ_BODY))
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

export const respond = (res: Http.ServerResponse, code: number, body : string|boolean|Record<string, unknown>|null): void =>
{
    const objType = typeof body
    if (objType === 'object')
    {
        res.writeHead(code, {'Content-Type': 'application/json'}) 
        body = JSON.stringify(body)
    }
    else 
    {
        res.writeHead(code, {'Content-Type': 'text/html'}) 
    }
    
    if (objType !== 'string')
    {
        body = body.toString()
    }

    res.write(body, 'utf-8')

    res.end() 
}


const getUriParams = (url: string, regexp: RegExp): Record<string, string> =>  
{
    const response = regexp.exec(url)
    return response?.groups ?? {}
}

const servers: Record<number, IEasyServer> = {}

export const manageError = (res: Http.ServerResponse, err: EasyError|Error): boolean =>
{
    const code = Object.keys(err).includes('code')? (err as EasyError).code : 500
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
            if (isPathValid === PathResult.Redirect)
            {
                await route.Exec(req, res)
                return
            }

            if (isPathValid !== PathResult.NotInPath)
            {
                try {
                    const params = req2.method === RouteMethod.GET? urlInfo.Parameters : urlInfo.Body
                    const uriParams = getUriParams(req.url || '', route.Regexp)
                    
                    const data = checkParams(req2, route.Params, res, server, {...params, ...uriParams})
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
                    if (error instanceof EasyError || !server.DefaultError)
                    {
                        error = err
                    }
                    else 
                    {
                        error = server.DefaultError 
                    }
                    
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

export const getServer = (port: number): IEasyServer => 
{
    return servers[port]
}

export const setServer = (port: number, server: IEasyServer): void => 
{
    servers[port] = server
}

export const deleteServer = (port: number): void => 
{
    delete servers[port]
}