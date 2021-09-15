import { SimpleError } from '../error/error'

export interface IValidation 
{
    value : string | number | unknown[] | Record<string, unknown>
}

export interface IValidationError
{
    paramName: string
    condition: string
    data: string
}

export type CheckFunction = {
    errorMessage?: string
    (val: unknown): boolean
}

export const Validate = (val: unknown, fct: CheckFunction): void=>
{
    if (!fct(val))
    {
        throw (new SimpleError(400, `Validation error: ${JSON.stringify(val)}  ${fct.errorMessage} `))
    }
}

const NewValidationFunction = (errorMessage: string, fct: CheckFunction) => 
{
    fct.errorMessage = errorMessage
    return fct
}

export const SimpleValidation = {

    Equal : (val2: unknown): CheckFunction => {
        return NewValidationFunction( `should be equal to ${typeof val2 === 'string'?`"${val2}"` :val2}`, (val: unknown): boolean => {return val === val2})
    },
    GreaterThan: (val2: number): CheckFunction => {
        return NewValidationFunction( `should be greater than ${val2}`, (val: unknown): boolean => {return val > val2})
    },
    GreaterOrEqual: (val2: number): CheckFunction => {
        return NewValidationFunction( `should be greater than or equal to ${val2}`, (val: unknown): boolean => {return val >= val2})
    },
    LessThan: (val2: number): CheckFunction => {
        return NewValidationFunction( `should be less than ${val2}`, (val: unknown): boolean => {return val < val2})
    },
    LessOrEqual: (val2: number): CheckFunction => {
        return NewValidationFunction( `should be less than or equal to ${val2}`, (val: unknown): boolean => {return val <= val2})
    },
    Between: (minVal: number, maxVal: number): CheckFunction => {
        return NewValidationFunction( `should be between ${minVal} and ${maxVal}`, (val: unknown): boolean => {return val <= maxVal && val >= minVal}) 
    },
    IsOfType: (val2: string): CheckFunction =>
    {
        return NewValidationFunction( `should be of type ${val2}`, (val: unknown): boolean => {return typeof val === val2})
    },
    IsNumber: (): CheckFunction =>
    {
        return SimpleValidation.IsOfType('number')
    },
    IsString: (length = -1): CheckFunction =>
    {
        
        if (length >= 0)
        {
            return NewValidationFunction(`should be a string of length: ${length}`, (val: unknown): boolean => {
                return (typeof val === 'string' && (val as string).length === length)
            })
        }
        return SimpleValidation.IsOfType('string')
        
    },
    IsObject: (): CheckFunction =>
    {
        return SimpleValidation.IsOfType('object')
    },
    IsArray: (length = -1): CheckFunction =>
    {
        const lengthDescription = length >= 0? `of minimal lengh: ${length}`: ''
        const description = `should be an array ${lengthDescription}`
        return NewValidationFunction( description, (val: unknown): boolean => {
            return (Array.isArray(val) && 
            (length < 0 || (val as unknown[]).length >= length)
            )})
    },
    HasProperties: (properties: string[]): CheckFunction =>
    {
        return NewValidationFunction( `should have properties: ${JSON.stringify(properties)}`, (val: unknown): boolean => {
            return properties.every((propertyName) => propertyName in (val as Record<string, unknown>))
        })
    },
    And: (fcts: CheckFunction[]) : CheckFunction =>
    {
        let description = 'AND : '
        fcts.forEach((fct) => {
            description += `\n- ${fct.errorMessage} `
        })
        return NewValidationFunction( description, (val: unknown): boolean => {return fcts.every((fct) => fct(val))})   
    },
    Or: (fcts: CheckFunction[]) : CheckFunction =>
    {
        let description = 'OR : '
        fcts.forEach((fct) => {
            description += `\n- ${fct.errorMessage} `
        })
        return NewValidationFunction( description, (val: unknown): boolean => {return fcts.some((fct) => fct(val))})   
    },
    
}