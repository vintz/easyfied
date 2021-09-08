import * as Http from 'http'
import * as Url from 'url'

import {
    getParamsFromFunction, 
    ISimpleServer, 
    IRoute, 
    RouteMethod, 
    pathToRegexp, 
    getServer,
    parseRequest,
    setServer,
    deleteServer,
} 
    from './net/inner'

    
import { fileServer } from './file/fileserver'


let MainPort = 80

export const setMainPort = (port: number): void => { MainPort = port}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AddRoute = (type: RouteMethod, path: string, exec: (...args: any[]) => unknown, portOrServer: number|ISimpleServer = 0): void =>
{
    const truePath = path.trim().toLowerCase()
    const server =  typeof portOrServer === 'object' ? portOrServer as ISimpleServer : Simplified(portOrServer as number)
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
export const AddMiddleware = ( exec: (...args: any[]) => unknown, portOrServer: number|ISimpleServer = 0): void => 
{
    AddRoute(RouteMethod.MIDDLEWARE, '', exec, portOrServer)
}

export const AddStatic = (baseUrl: string, folderPath: string, portOrServer: number|ISimpleServer = 0): void =>
{
    const fServer = fileServer(folderPath)
    const exec = async (_req: unknown, _res: unknown) => {
        const url = (_req as Http.IncomingMessage).url
        let subPath = (url && url.startsWith('/'))? url: new Url.URL(url ?? '').pathname
        subPath = (subPath ?? '').replace(baseUrl, '.')
        await fServer.getFile(subPath as string, _res as Http.ServerResponse)
    }

    AddRoute(RouteMethod.STATIC, baseUrl, exec, portOrServer)
}

export const Simplified = (port = 0): ISimpleServer =>
{
    if (port === 0)
        port = MainPort

    let server = getServer(port)
    if (server)
    {
        return server
    }
    const innerServer = Http.createServer(async (req: Http.IncomingMessage, res: Http.ServerResponse) => {
        await parseRequest(port, req, res)
    }).listen(port)
    
    server = {
        InnerServer: innerServer,
        Routes: [],
        AddRoute: (type: RouteMethod, path: string, exec:  (...args: unknown[]) => unknown) => AddRoute(type, path, exec, server),
        AddStatic: (baseUrl: string, folderPath: string) => AddStatic(baseUrl, folderPath, server)
    }   

    setServer(port, server)

    return server
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



