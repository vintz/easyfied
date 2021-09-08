import {AddRoute, SetResponseCode} from '../src/lib/simplify'
import { RouteMethod } from '../src/lib/net/inner'
import { get } from './testLib'

AddRoute(RouteMethod.GET, '/ping', (val:number) => 
{
    SetResponseCode(val)
    let tmp = 0
    for (let idx = 0; idx < 100; idx++)
    {
        tmp += idx
    }
    return {msg: tmp}
}, 3020)

AddRoute(RouteMethod.GET, '/ping200', () => 
{
    return {msg: 'ok'}
}, 3020)

let count = 0

for (let idx = 0; idx < 100; idx++)
{
    const code = 200 + (idx % 10)
    console.log('AAAAAAA', idx, code)
    get({Hostname: 'localhost', Port: 3020, Path: `/ping?val=${code}`})
        .then((res) =>
        {
            count++

            if(res.Code != code)
            {
                console.log('failed', count, res.Code, code, res.Result)
            }
            else 
            {
                console.log(count, code, res.Result)
            }
        })
}

get({Hostname: 'localhost', Port: 3020, Path: '/ping200'})
    .then((res) =>
    {
        if(res.Code != 200)
        {
            console.log('failed on 200 ', res.Code, res.Result)
        }
        else 
        {
            console.log('200200200200200200200200200200200200200200200200200200200', res.Result)
        }
    })