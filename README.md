



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
import {AddRoute, RouteMethod} from 'simplify'

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



## Documentation

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
import {AddRoute, RouteMethod} from 'simplify'

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



If the route function throw an exception, by default, the server will return a 400 error with the content of the exception. You can send other errors by throwing a EasyError. It is also possible to modify the default error behaviour to hide the internal error. 

```typescript
/// Import the need framework elements 
import {AddRoute, RouteMethod, EasyError} from 'simplify'

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



### Parameters validation

The parameters of the route function are used for the call parameters validation.  Any call to the server must fill in the same parameters as the route function.  Only the variable without a default value are mandatory.

 By default, if any parameter is missing, the call will receive a 400 error with a list of the missing parameters.

```typescript
/// Import the need framework elements 
import {AddRoute, RouteMethod, EasyError} from 'simplify'

// Declare routes 
AddRoute(RouteMethod.Get, '/test', (value1, value2 = '') =>
{
	[code...]
})
```

In the preceding example, a call to http://localhost/test without any parameter  will receive a 400 response with the following message: "Missing parameter: value1





