import {AddMiddleware, AddRoute} from '../src/lib/simplified'
import { RouteMethod } from '../src/lib/net/inner'
AddMiddleware(()=>{return}, 3020)
AddRoute(RouteMethod.GET, '/ping', () => {return {msg: 'ok'}}, 3020)