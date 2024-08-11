import * as Http from 'http'
import * as Https from 'https'
import * as Url from 'url'
import * as Fs from 'fs'

import {
    getParamsFromFunction, 
    IInnerEasyServer, 
    IRoute, 
    RouteMethod, 
    pathToRegexp, 
    getServer,
    parseRequest,
    setServer,
    deleteServer,
    IEasyOptions,
    setResponseCode,
} 
    from './net/inner'

    
import { fileServer } from './file/fileserver'
// import { AddRedirect } from './net/proxy'


let MainPort = 80

const generateServerOptions = (options: IEasyOptions): Https.ServerOptions=> 
{
    const result: Https.ServerOptions = {}
    if (options.https)
    {
        result.cert = Fs.readFileSync(options.https.cert)
        result.key = Fs.readFileSync(options.https.key)
    }
    return result
}

const innerEasyFied = (port = 0, options: IEasyOptions = {}): IInnerEasyServer =>
{
    if (port === 0)
        port = MainPort

    let server = getServer(port)
    if (server)
    {
        return server
    }
    
    const _http = options.https?Https: Http
    const innerServer = _http.createServer(generateServerOptions(options), async (req: Http.IncomingMessage, res: Http.ServerResponse) => {
        await parseRequest(port, req, res)
    }).listen(port)
    
    server = {
        InnerServer: innerServer,
        Routes: [],
        AddRoute: (type: RouteMethod, path: string, exec:  (...args: unknown[]) => unknown) => AddRoute(type, path, exec, server),
        AddStatic: (baseUrl: string, folderPath: string, options?: {listFiles: boolean}) => AddStatic(baseUrl, folderPath, options, server),
        AddMiddleware: ( exec: (...args: unknown[]) => unknown) => AddMiddleware(exec, server),
        //AddRedirect: (destination: string, relativeUrl?: boolean) => {AddRedirect(destination, server, relativeUrl)},
        Close: () => {server.InnerServer.close(); deleteServer(port)},
        SetResponseCode: (code: number) => {setResponseCode(code)},
        DefaultError: options.defaultError
    }  
    
    setServer(port, server)

    return server
}

export const SetMainPort = (port: number): void => { MainPort = port}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AddRoute = (type: RouteMethod, path: string, exec: (...args: any[]) => unknown, portOrServer: number|IInnerEasyServer = 0): void =>
{
    const truePath = path.trim().toLowerCase()
    const server =  typeof portOrServer === 'object' ? portOrServer as IInnerEasyServer : innerEasyFied(portOrServer as number)
    const route: IRoute = {
        Method: type,
        Exec: exec,
        Path: truePath,
        Regexp: pathToRegexp(truePath, type),
        Params: getParamsFromFunction(exec), 
    }
    server.Routes.push(route)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AddMiddleware = ( exec: (...args: any[]) => unknown, portOrServer: number|IInnerEasyServer = 0): void => 
{
    AddRoute(RouteMethod.MIDDLEWARE, '', exec, portOrServer)
}

export const AddStatic = (baseUrl: string, folderPath: string, options?: {listFiles: boolean},  portOrServer: number|IInnerEasyServer = 0): void =>
{
    const fServer = fileServer(folderPath, {listFiles: options?.listFiles, srcPath: baseUrl})
    const exec = async (_req: unknown, _res: unknown) => {
        const url = (_req as Http.IncomingMessage).url
        let subPath = (url && url.startsWith('/'))? url: new Url.URL(url ?? '').pathname
        subPath = (subPath ?? '').replace(baseUrl, '.')
        await fServer.getFile(subPath as string, _res as Http.ServerResponse)
    }

    AddRoute(RouteMethod.STATIC, baseUrl, exec, portOrServer)
}

export interface IEasyServer 
{
    AddRoute: (type: RouteMethod, path: string, exec:  (...args: unknown[]) => unknown) => void,
    AddStatic: (baseUrl: string, folderPath: string, options?: {listFiles: boolean}) => void
    AddMiddleware: ( exec: (...args: unknown[]) => unknown) => void
    // AddRedirect(destination: string,  relativeUrl: boolean): void
    Close(): void
    SetResponseCode: (code: number) => void
   // Plugins: Record<string, (server: IEasyServer) => void>
}


/**
 * Initialize a Easyfied web server
 * {string} [somebody=John Doe] 
 * @param {number} [port=80] - Web server port (the default port value is 80 by default and can be changed using SetMainPort)
 * @param {Object} options - Options of the web server
 * @param {Object} [options.https] - Configuration for HTTPS
 * @param {string} options.https.key - Filepath of https key
 * @param {string} options.https.cert - Filepath of https certification
 * @param {string} [options.defaultError={code: 400, message: ''}] - Default error when answering 
 * @param {string} options.https.cert - Filepath of https certification
 * @param {string} options.https.cert - Filepath of https certification
 * 
    defaultError?: {code: number, message: string}
 * @returns 
 */

export const Easyfied = (port = 0, options: IEasyOptions = {}): IEasyServer =>
{
    if (getServer(port))
    {
        throw new Error('Server already initialized')
    }

    return innerEasyFied(port, options) as IEasyServer
}

export const Close = (port = 0): void =>
{
    if (port === 0)
        port = MainPort
    const server = getServer(port)
    if (server)
    {
        server.InnerServer.close()
        deleteServer(port)
    }
}

export {setResponseCode as SetResponseCode} from './net/inner'



