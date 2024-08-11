import * as Http from 'http'
import {URL} from 'url'
import * as Path from 'path'

import {  AddRoute } from '../easyfied'
import { IInnerEasyServer, RouteMethod } from './inner'



/*export const AddRedirect = (destination: string, portOrServer: number|IInnerEasyServer = 0, relativeUrl: boolean): void =>
{
    AddRoute(RouteMethod.REDIRECT, '', (_req: Http.IncomingMessage, _res: Http.ServerResponse) => {

        if (relativeUrl)
        {
            try
            {
                const srcUri = new URL(_req.url, 'http://localhost')
                const destUri = new URL(destination)
                destUri.search = srcUri.search
                destUri.pathname = Path.posix.join(destUri.pathname, srcUri.pathname)
                destination = destUri.href
            }
            catch(err)
            {
                // TODO LOG ERROR
                console.log(err)
            }
        }
        _res.writeHead(301, {Location: destination})
        _res.end()
    }, portOrServer)
}*/

/*export const AddFullRedirection = (originUrl: string, destinationUrl: string): void => 
{
    AddRoute(RouteMethod.REDIRECT, '',(_req: Http.IncomingMessage, _res: Http.ServerResponse) => 
    {
        try 
        {
            return ''
        }
        catch(err)
        {
            // TODO LOG ERROR
            console.log(err)
        
        }
    })
}*/