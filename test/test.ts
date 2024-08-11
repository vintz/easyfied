// import { IParam, getParamsFromFunction } from "./lib/web/codeextractor"

import {Easyfied, RouteMethod, EasyError, EasyValidator, Validate} from '../src/index'
// import { AddRedirect } from '../src/lib/net/proxy'

// const hs = Easyfied(443, {
//     https:
//     {
//         cert: './content/cert/localhost.pem',   
//         key: './content/cert/localhost-key.pem'    
//     }
// })

// hs.AddRoute(RouteMethod.GET, '/hw1', ()=>
// {
//     return 'I am a teapot'
// })

// hs.AddStatic('content', './content')

const server = Easyfied(8080)

server.AddRoute(RouteMethod.GET, '/proxy/*titi', (titi: string) =>
{
    console.log(titi)
    return 'ok proxy'
})

server.AddRoute(RouteMethod.POST, '/account', (account: string) => {
    try 
    {
        EasyValidator('account').HasProperties([
            {name: 'email', validator: EasyValidator('email').MatchesPattern('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$')},
            {name: 'password', validator: EasyValidator('password').IsString(8, 10)},
            'businessName',
            'address',
            'phoneNumber'
        ]).Validate(account)
    }
    catch (err) 
    {
        console.log(err)
        throw new EasyError(400, 'Invalid account')
    }
    return {test: 'ok'}
})


server.AddRoute(RouteMethod.POST, '/check', (element: unknown) => {
    EasyValidator('element').HasProperties([{name: 'val', validator: EasyValidator('val').Check((val) => {return val === 'toto'})}]).Validate(element)
    return 'CHECKED'
})

server.AddRoute(RouteMethod.GET, '/check', (val: string) => {
    EasyValidator('val').Check((val) => {return val === 'toto'}).Validate(val)
    return 'Hello World'
})

server.AddRoute(RouteMethod.GET, '/hw', () => {
    return 'Hello World'
})

server.AddRoute(RouteMethod.GET, '/hello', (name: string) =>{
    return 'hello ' + name
})

server.AddRoute(RouteMethod.GET, '/hello2/:name', (name: string) =>{
    return 'hello ' + name
})

server.AddRoute(RouteMethod.GET, '/no', () =>{
    console.log('no response')
})

server.AddRoute(RouteMethod.GET, '/null', () =>{
    return null
})

server.AddRoute(RouteMethod.GET, '/test/moi', (test: string) => {
    Validate(test, EasyValidator('test').IsString(4).MatchesPattern('toto'))
    return test

})

server.AddMiddleware((_headers: Record<string, string>) => 
{
    if(!_headers.toto)
    {
        throw EasyError.Forbidden('not logged in')
    }
})

server.AddRoute(RouteMethod.POST, '/hello', (name: string) =>{
    return 'hello ' + name
})

server.AddStatic('/file', './test/media', {listFiles: false})

const server90 = Easyfied(90)

server90.AddStatic('/file', './test/media', {listFiles: true})

server.AddRoute(RouteMethod.GET, '/par1', (par1: string) => {
    return par1
})

server.AddRoute(RouteMethod.GET, '/crash', () => 
{
    throw new Error('test error')
})

const serv = Easyfied(91, {defaultError: {code: 400, message: 'CA A PLANTE'}})

serv.AddRoute(RouteMethod.GET, '/crash', () => 
{
    throw new Error('Test error other server')
})




//AddRedirect('https://localhost', 90, true)


// import {isSubPath} from './lib/file/fileserver'

// const test = [
//     {mainPath: './sub', current :'/sub'},
//     {mainPath: './sub', current :'./sub'},
//     {mainPath: './sub', current :'../sub'},
//     {mainPath: './sub', current :'../../sub'},
//     {mainPath: './sub', current :'./sub/../..'},
//     {mainPath: './sub', current :'/toto'},
//     {mainPath: 'c://tmp', current :'./plop'},
//     {mainPath: 'c://tmp', current :'../plop'},
// ]

// test.forEach(val => console.log(val,  val.current, isSubPath(val.mainPath, val.current)))
