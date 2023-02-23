



![npm](https://img.shields.io/npm/v/easyfied.svg)
![NPM](https://img.shields.io/npm/l/easyfied.svg)
![npm type definitions](https://img.shields.io/npm/types/easyfied.svg)
![npm](https://img.shields.io/npm/dt/easyfied.svg)
![npm bundle size](https://img.shields.io/bundlephobia/min/easyfied.svg)

# Easyfied

Very simple web framework for Node.js

Easyfied is a node.js framework aimed at providing the most simple way to manage the different routes of your server.

Easyfied tries to fulfill the following features: 

- **simple routes declaration**: adding a route is as simple as creating a function
- **simple response management**: the response to a call is the return of the route function
- **simple parameters validation**:  the data validation is mainly based on the function parameters
- **extensible**:  every part of the framework could be extended (route declaration, response, parameters validation, etc. ) by a system of plugin 

## Quickstart

Add Easyfied to your project:

```bash
nmp install --save easyfied
```

Create index.ts and copy the following content:

```typescript
// Import the framework elements
import {AddRoute, RouteMethod} from 'easyfied'

// Declare a single route
AddRoute(RouteMethod.GET, '/', ()=>
{
    return 'Hello world'
}, 80)

```

Then you can launch the server with : 

````
ts-node index.ts
````

And you can check the server with : 

```bash
curl http://localhost
```



## Main features

1. [Response management](#response-management)
2. [Parameters validation](#parameters-validation)
3. [Static files server](#static-files-server)
4. [Middlewares](#middlewares)

### Response management 

With Easyfied, every response is managed by two things:

- the value returned by the route function
- the exception that could be thrown by the function

If the returned value is an object, by default a call to the server will be answered with a JSON response (with the appropriate header). In any other case, the response is assumed to be text.   

For example:

```typescript
// Import the need framework elements 
import {AddRoute, RouteMethod} from 'easyfied'

// Declare routes 
AddRoute(RouteMethod.Get, '/test', (value = '') =>
{
	if (value === 'ok')
    {
        return {
            result:
            {
            	value1: 1,
                value2: "2"
            },
            test: "test"
        }
    }
    else return 'ko'
})
```



If the route function throws an exception, by default, the server will return a 400 error with the content of the exception. You can send other errors by throwing a EasyError. It is also possible to modify the default error behavior to hide the internal error. 

```typescript
/// Import the need framework elements 
import {AddRoute, RouteMethod, EasyError} from 'easyfied'

// Declare routes 
AddRoute(RouteMethod.Get, '/test', (value = '') =>
{
	if (value === 'ko')
    {
        throw new EasyError(401, 'Value was ko')
    }
    else if (value === 'ko2')
    {
        throw EasyError.Forbidden('not logged in') 
    }
    else return {
        result: 'ok'
    }
})
```

You may add some "special" parameters to your functions to access to inner part of the query. The special parameters always start with an underscore and are listed in the documentation. 

In the following code, a call to /heders return the headers of the query.

```typescript
/// Import the need framework elements 
import {AddRoute, RouteMethod, EasyError} from 'easyfied'

// Declare routes 
AddRoute(RouteMethod.Get, '/headers', ( _req: Http.IncomingMessage, value = '') =>
{
	if (value === 'ko')
    {
        throw new EasyError(401, 'Value was ko')
    }
    else return _req.headers
    
})
```



### Parameters validation

The parameters of the route function are used for the call parameters validation.  Any call to the server must fill in the same parameters as the route function.  Only variables without default value are mandatory.

 By default, if any parameter is missing, the call will receive a 400 error with a list of the missing parameters.

```typescript
/// Import the need framework elements 
import {AddRoute, RouteMethod, EasyError} from 'easyfied'

// Declare routes 
AddRoute(RouteMethod.Get, '/test', (value1, value2 = '') =>
{
	[code...]
})
```

In the preceding example, a call to http://localhost/test without any parameter  will receive a 400 response with the following message: "Missing parameters: value1" (as value2 has a default value)

You can also provide input validation using the Validation module. 

For example for a simple parameters validation: 

```typescript
/// Import the need framework elements 
import {AddRoute, RouteMethod, EasyError, Validate, EasyValidator} from 'easyfied'

// Declare routes 
AddRoute(RouteMethod.Get, '/test', (value1, value2, value3 = '') =>
{
    Validate(value1, EasyValidator('value1').IsNumber().Between(0,5))
    Validate(value1, EasyValidator('value2').IsObject().HasProperties(['prop1']))
    Validate(value3, EasyValidator('value3').IsString(4))
	[code...]
})
```

If some input doesn't validate, the framework will return a 400 error with a description explaining what is expected. 



### Static files server

A very simple static file server middleware is built-in Easyfied.

For example, the following code will serve files from the directory named *media* when called from http://localhost:8080/files

```typescript
AddStatic('/files', './media', 8080)
```

Now you can load files by calling the following URLs

```
http://localhost:8080/files/image.png
http://localhost:8080/files/index.html
http://localhost:8080/files/script.js
http://localhost:8080/files/css/index.css

```



### Middlewares

As your server becomes bigger, you may need to add more functionalities apart from direct response. For example, you may want to add some code to check if the user is authenticated. To do this, you can add a middleware that will test the header for the authentication. Since the routes and the middlewares are tested/executed in the order they are added, any route added after the "authentication" middleware won't be called if there is no authentication



```typescript
/// Import the need framework elements 
import {AddRoute, AddMiddlware, RouteMethod, EasyError} from 'easyfied'

// Declare routes 
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

AddRoute(RouteMethod.GET, '/logged', () => 
{
    return 'logged'
})
```



