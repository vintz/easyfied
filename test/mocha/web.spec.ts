import { expect } from 'chai'
import 'mocha'

import {AddRoute, RouteMethod, Close, AddMiddleware, AddRedirect, AddStatic, SetResponseCode, Easyfied} from '../../src/index'
import { EasyError } from '../../src/lib/error/error'
import { get, post, put } from '../testLib'

describe('Get method test', () => {

    it('should respond "hello world" with a 200 response on http://localhost/hw  ', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/hw', () => {
            return 'hello world'
        }, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/hw'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('hello world')
            })
    })

    it('should respond false with a 200 response on http://localhost/false  ', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/false', () => {
            return false
        }, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/false'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('false')
            })
    })

    it('should respond 13.3 with a 200 response on http://localhost/float  ', () => 
    {
        const port = 80
        
        AddRoute(RouteMethod.GET, '/float', () => {
            return 13.3
        }, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/float'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('13.3')
            })
    })


    it('should respond with a 500 response on http://localhost/crash', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/crash', () => {
            throw new Error('Crashed')
        }, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/crash'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(500)
                expect(res.Result).to.equal('Crashed')
            })
    })

    it('should respond with a 400 response on http://localhost/crashdefault  ', () => 
    {
        const port = 80
        const message = 'This server has encountered an error. Please try again'
        Easyfied(port, {defaultError: { code: 400, message}})
        AddRoute(RouteMethod.GET, '/crashdefault', () => {
            throw new Error('Crashed')
        }, port)


        
        return get({Hostname: 'localhost', Port: port, Path: '/crashdefault'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(400)
                expect(res.Result).to.equal(message)
            })
    })


    it('should respond with a 204 response on http://localhost/no  ', () => 
    {
        const port = 80

        const message = 'This server has encountered an error. Please try again'
        Easyfied(port, {defaultError: { code: 400, message}})

        AddRoute(RouteMethod.GET, '/no', () => {
            // No return 
        }, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/no'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(204)
            })
    })


    it('should respond with a 204 response on http://localhost/null  ', () => 
    {
        const port = 80

        const message = 'This server has encountered an error. Please try again'
        Easyfied(port, {defaultError: { code: 400, message}})

        AddRoute(RouteMethod.GET, '/null', () => {
            return null
        }, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/null'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(204)
            })
    })


    it('should respond with a 201 response on http://localhost/otherRes  ', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/otherRes', () => {
            SetResponseCode(201)
            return ''
        }, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/otherRes'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(201)
            })
    })


    it('should respond "hello world" with a 200 response on http://localhost:8080/hw and "hw" with a 200 response on http://localhost:8090/hw ', () => 
    {
        const port1 = 8080
        const port2 = 8090

        AddRoute(RouteMethod.GET, '/hw', () => {
            return 'hello world'
        }, port1)

        AddRoute(RouteMethod.GET, '/hw', () => {
            return 'hw'
        }, port2)
       
        let res1
        let res2 
       
        return get({Hostname: 'localhost', Port: port1, Path: '/hw'})
            .then((res)=> {
                res1 = res
                return get({Hostname: 'localhost', Port: port2, Path: '/hw'})
            })
            .then((res) => {
                res2 = res
                Close(8080)
                Close(8090)
                expect(res2.Code).to.equal(200)
                expect(res2.Result).to.equal('hw')
                expect(res1.Code).to.equal(200)
                expect(res1.Result).to.equal('hello world')
            })
    })

    it('should respond "hello world" with a 200 response on http://localhost:8080/hw on successive call if we stop and recreate the same server', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/hw', () => {
            return 'hello world'
        }, port)

        let res1
        let res2 

        return get({Hostname: 'localhost', Port: port, Path: '/hw'})
            .then((res)=> {
                res1 = res
                Close(port)
                AddRoute(RouteMethod.GET, '/hw', () => {
                    return 'hello world 2'
                }, port)
                return get({Hostname: 'localhost', Port: port, Path: '/hw'})
            })
            .then((res) => {
                res2 = res
                Close(port)
                expect(res2.Code).to.equal(200)
                expect(res2.Result).to.equal('hello world 2')
                expect(res1.Code).to.equal(200)
                expect(res1.Result).to.equal('hello world')
            })
    })

    it('should respond "error found" with a 400 response on http://localhost/error400', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/error400', () => {
            throw EasyError.BadRequest('error found')
        })
        
        return get({Hostname: 'localhost', Port: port, Path: '/error400'})
            .then((res)=> {
                Close()
                expect(res.Code).to.equal(400)
                expect(res.Result).to.equal('error found')
            })
    })

    it('should respond  :' 
    + '\n\t"not logged" with a 403 code on http://localhost/logged when called without header, '
    + '\n\t"logged" with code 200 when called on http://localhost/logged when with header "authorization:ok" '
    + '\n\t and with code 200 "not logged" on http://localhost/notlogged ', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/notlogged', () => {
            return 'not logged'
        })

        AddMiddleware((_headers: Record<string, string>) => 
        {
            if(!_headers.authorization || _headers.authorization !== 'ok')
            {
                throw EasyError.Forbidden('not logged')
            }
        })

        AddRoute(RouteMethod.GET, '/logged', () => {
            return 'logged'
        })

        return get({Hostname: 'localhost', Port: port, Path: '/notlogged'})
            .then((res)=> {
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('not logged')
                return get({Hostname: 'localhost', Port: port, Path: '/logged'})
            })
            .then((res)=> {
                expect(res.Code).to.equal(403)
                expect(res.Result).to.equal('not logged')
                return get({Hostname: 'localhost', Port: port, Path: '/logged', Headers:{authorization: 'ok'}})
            })
            .then((res) => {
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('logged')
            })
            .finally(()=>
            {
                Close()
            })
    })

    it('should respond "hello mister" with a 200 response on http://localhost/hello/mister  ', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/hello/:name', (name: string) => {
            return `hello ${name}`
        }, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/hello/mister'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('hello mister')
            })
    })

    it('should respond "hello mister" with a 200 response on (PUT) http://localhost/hello/mister  ', () => 
    {
        const port = 80

        AddRoute(RouteMethod.PUT, '/Hello/:name', (name: string) => {
            return `hello ${name}`
        }, port)
        
        return put({Hostname: 'localhost', Port: port, Path: '/Hello/mister'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('hello mister')
            })
    })

    it('should respond "missing parameters" with a 400 response on http://localhost/missing', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/missing', (par1: string) => {
            console.log(par1)
        })
        
        return get({Hostname: 'localhost', Port: port, Path: '/missing'})
            .then((res)=> {
                Close()
                expect(res.Code).to.equal(400)
                expect(res.Result).to.equal('A parameter is missing : par1')
            })
    })

    it('should respond "par1Value" with a 200 response on http://localhost/testpar?par1=par1Value', () => 
    {
        const port = 80

        AddRoute(RouteMethod.GET, '/par1', (par1: string) => {
            return par1
        })
        
        return get({Hostname: 'localhost', Port: port, Path: '/par1?par1=par1Value'})
            .then((res)=> {
                Close()
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('par1Value')
            })
    })
})


describe('Post method test', () => {

    it('should respond "hello world" with a 200 response on http://localhost/hw  ', () => 
    {
        const port = 80

        AddRoute(RouteMethod.POST, '/hw', () => {
            return 'hello world'
        }, port)
        
        return post({Hostname: 'localhost', Port: port, Path: '/hw'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('hello world')
            })
    })

    it('should respond "hello mister" with a 200 response on http://localhost/hello/mister  ', () => 
    {
        const port = 80

        AddRoute(RouteMethod.POST, '/hello/:name', (name: string) => {
            return `hello ${name}`
        }, port)
        
        return post({Hostname: 'localhost', Port: port, Path: '/hello/mister'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('hello mister')
            })
    })

    it('should respond "hello mister" with a 200 response on http://localhost/hello with the following data : {"name":"mister"}  ', () => 
    {
        const port = 80

        AddRoute(RouteMethod.POST, '/hello', (name: string) => {
            return `hello ${name}`
        }, port)
        
        return post({Hostname: 'localhost', Port: port, Path: '/hello', Headers:{'Content-Type': 'application/json'}}, {name: 'mister json'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(200)
                expect(res.Result).to.equal('hello mister json')
            })
    })
})

describe('Addstatic test', () => {

    it('should return a png file with a 200 response on http://localhost/file/test.png  ', () => 
    {
        const port = 80

        AddStatic('/file', './test/media', undefined, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/file/test.png'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(200)
                const isPng = (res.Result as string).startsWith(String.fromCharCode(0xfffd)+'PNG')
                expect(isPng).to.equal(true)
            })
    })
    it('should return a 404 error response on http://localhost/file/test2.png  ', () => 
    {
        const port = 80

        AddStatic('/file', './test/media', undefined, port)
        
        return get({Hostname: 'localhost', Port: port, Path: '/file/test2.png'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(404)
            })
    })
})

describe('Redirect test', () => {

    it('should return a png file with a 301 response redirecting to http://localhost:90/plop/hw?titi=toto on http://localhost:8080/hw?titi=toto  ', () => 
    {
        const port = 8080

        AddRedirect('http://localhost:90/plop?toto=tiit', port, true)
        
        return get({Hostname: 'localhost', Port: port, Path: '/hw?titi=toto'})
            .then((res) =>
            {
                Close(port)
                expect(res.Code).to.equal(301)
                
                expect(res?.Headers?.location).to.equal('http://localhost:90/plop/hw?titi=toto')
            })
    })
})