// import { IParam, getParamsFromFunction } from "./lib/web/codeextractor"

import {Easyfied, AddRoute, AddStatic, AddMiddleware, RouteMethod, EasyError} from '../src/index'
import { AddRedirect } from '../src/lib/net/proxy'

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

AddRoute(RouteMethod.GET, '/hw', () => {
    return 'Hello World'
}, 8080)

AddRoute(RouteMethod.GET, '/hello', (name: string) =>{
    return 'hello ' + name
}, 8080)

AddRoute(RouteMethod.GET, '/hello2/:name', (name: string) =>{
    return 'hello ' + name
}, 8080)

AddRoute(RouteMethod.GET, '/no', () =>{
    console.log('no response')
}, 8080)

AddRoute(RouteMethod.GET, '/null', () =>{
    return null
}, 8080)


AddMiddleware((_headers: Record<string, string>) => 
{
    if(!_headers.toto)
    {
        throw EasyError.Forbidden('not logged in')
    }
}, 8080)

AddRoute(RouteMethod.POST, '/hello', (name: string) =>{
    return 'hello ' + name
}, 8080)

AddStatic('/file', './test/media', {listFiles: false}, 8080)


AddStatic('/file', './test/media', {listFiles: true}, 90)

AddRoute(RouteMethod.GET, '/par1', (par1: string) => {
    return par1
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
