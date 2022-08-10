import { basename } from 'path'
import { EasyError } from '../error/error'

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

export type PropertyDef = string | {
    name: string
    validator: _validator
}

export const Validate = (val: unknown, validator: CheckFunction|_validator, debug = true): void=>
{
    if (debug)
    {
        console.log('-------------')
        console.debug('VALIDATE', val)
        console.log('***************')
    }
    const isValidator = validator instanceof _validator
    const name = isValidator ? (validator as  _validator).GetName(): JSON.stringify(val)
    const fct: CheckFunction = isValidator? (validator as  _validator).GetFunction() : (validator as CheckFunction)
    if (debug)
    {
        console.debug('VALIDATING', fct.errorMessage )
    }
    if (!fct(val))
    {
        throw (new EasyError(400, `Validation error: ${name}  ${fct.errorMessage} `))
    }
}

const NewValidationFunction = (errorMessage: string, fct: CheckFunction) => 
{
    fct.errorMessage = errorMessage
    return fct
}

const Errorify = (properties: PropertyDef[]): string => 
{
    let error = '['
    properties.forEach((prop: PropertyDef, index: number) => 
    {
        if (index > 0)
        {
            error += ','
        }
        if (typeof prop === 'string')
        {
            error += `"${prop}"`
        }
        else 
        {
            error += `"${prop.name}": ${prop.validator.GetFunction().errorMessage}`
        }
    })
    error += ']'
    return error
}

export const EasyValidatorEx = {

    Not: (fct: CheckFunction): CheckFunction => {
        return NewValidationFunction(`NOT : \n ${fct.errorMessage}`, (val: unknown) => {return !fct(val)})
    },
    Equal : (val2: unknown): CheckFunction => {
        return NewValidationFunction( `equal to ${typeof val2 === 'string'?`"${val2}"` :val2}`, (val: unknown): boolean => {return val === val2})
    },
    GreaterThan: (val2: number): CheckFunction => {
        return NewValidationFunction( `greater than ${val2}`, (val: unknown): boolean => {return val > val2})
    },
    GreaterOrEqual: (val2: number): CheckFunction => {
        return NewValidationFunction( `greater than or equal to ${val2}`, (val: unknown): boolean => {return val >= val2})
    },
    LessThan: (val2: number): CheckFunction => {
        return NewValidationFunction( `less than ${val2}`, (val: unknown): boolean => {return val < val2})
    },
    LessOrEqual: (val2: number): CheckFunction => {
        return NewValidationFunction( `less than or equal to ${val2}`, (val: unknown): boolean => {return val <= val2})
    },
    Between: (minVal: number, maxVal: number): CheckFunction => {
        return NewValidationFunction( `between ${minVal} and ${maxVal}`, (val: unknown): boolean => {return val <= maxVal && val >= minVal}) 
    },
    IsOfType: (val2: string): CheckFunction =>
    {
        return NewValidationFunction( `of type ${val2}`, (val: unknown): boolean => {return typeof val === val2})
    },
    IsNumber: (): CheckFunction =>
    {
        return EasyValidatorEx.IsOfType('number')
    },
    IsString: (minLength = 0, maxLength = 0): CheckFunction =>
    {

        if (minLength <= 0 && maxLength <= 0)
        {
            return EasyValidatorEx.IsOfType('string')
        }
        
        let errorMessage = `a string with a length between: ${minLength} and ${maxLength}`

        if (maxLength === minLength)
        {
            errorMessage = `a string of length: ${minLength}`
        }

        if (maxLength <= 0)
        {
            errorMessage = `a string of minimal length: ${minLength}`
            maxLength = Number.MAX_SAFE_INTEGER
        }
        
        if (minLength <= 0)
        {
            errorMessage = `a string of maximum length: ${maxLength}`
        }

        return NewValidationFunction(errorMessage, (val: unknown): boolean =>
        {
            return (typeof val === 'string' && (val as string).length <= maxLength && (val as string).length >= minLength)
        })
        
        
        
        
    },
    
    MatchesPattern: (pattern: string): CheckFunction => {
        return NewValidationFunction(`with format ${pattern}`, (val: unknown): boolean =>
        {
            try 
            {
                const regex = new RegExp(pattern)
                return  (typeof val === 'string' && regex.test(val))
            }
            catch(err)
            {
                return false
            }
        })
    },
    IsObject: (): CheckFunction =>
    {
        return EasyValidatorEx.IsOfType('object')
    },
    IsArray: (length = -1): CheckFunction =>
    {
        const lengthDescription = length >= 0? `of minimal lengh: ${length}`: ''
        const description = `an array ${lengthDescription}`
        return NewValidationFunction( description, (val: unknown): boolean => 
        {
            return (Array.isArray(val) && 
            (length < 0 || (val as unknown[]).length >= length)
            )})
    },
    HasProperties: (properties: PropertyDef[]): CheckFunction =>
    {
        return NewValidationFunction( `have properties: ${Errorify(properties)}`, (val: unknown): boolean => 
        {
            return properties.every((property) => 
            {
                let found = false
                const valRecord = val as Record<string, unknown>

                if(typeof property === 'object')
                {
                    found = property.name in (val as Record<string, unknown>) && property.validator.InnerValidate(valRecord[property.name])
                }
                else 
                {
                    found = property in valRecord
                }
                return found
                
                
            })

        })
    },
    IsSet: (): CheckFunction => 
    {   
        return NewValidationFunction('is set', (val: unknown): boolean =>
        {
            return (val != undefined && val != null)    
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
        fcts.forEach((fct) => 
        {
            description += `\n- ${fct.errorMessage} `
        })
        return NewValidationFunction( description, (val: unknown): boolean => {return fcts.some((fct) => fct(val))})   
    },
    True: (): CheckFunction =>
    {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return NewValidationFunction( '', (val: unknown): boolean => {return true})
    }
    
}
export class _validator 
{
    private instructions: CheckFunction[]
    private not: boolean
    private name: string

    constructor(name: string)
    {
        this.instructions = []
        this.name = name
    }

    public GetName = (): string =>
    {
        return this.name
    }

    public GetFunction(): CheckFunction
    {
        if (this.instructions.length > 1) return EasyValidatorEx.And(this.instructions)

        if(this.instructions.length == 1) return this.instructions[0]

        return EasyValidatorEx.True()
    }   

    public Eval = (val: unknown): boolean =>
    {
        return this.GetFunction()(val)
    }

    private addInstruction = (fct: CheckFunction) =>
    {
        if (this.not)
        {
            fct = EasyValidatorEx.Not(fct)
            this.not = false
        }
        this.instructions.push(fct)
    }

    public Equal = (val: unknown): _validator =>
    {
        this.addInstruction(EasyValidatorEx.Equal(val))
        return this
    } 

    public GreaterThan = (val: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.GreaterThan(val))
        return this
    } 

    public GreaterOrEqual = (val: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.GreaterOrEqual(val))
        return this
    } 

    public LessThan = (val: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.LessThan(val))
        return this
    } 

    public LessOrEqual = (val: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.LessOrEqual(val))
        return this
    } 

    public Between = (minVal: number, maxVal: number): _validator => 
    {
        this.addInstruction(EasyValidatorEx.Between(minVal, maxVal))
        return this
    }

    public IsOfType = (val: string): _validator =>
    {
        this.addInstruction(EasyValidatorEx.IsOfType(val))
        return this
    }

    public IsNumber = (): _validator =>
    {
        this.addInstruction(EasyValidatorEx.IsOfType('number'))
        return this
    }

    public IsString = (minLength = 0, maxLength = 0): _validator =>
    {
        this.addInstruction(EasyValidatorEx.IsString(minLength, maxLength))
        return this
    }
    
    public MatchesPattern = (pattern: string): _validator => 
    {
        this.addInstruction(EasyValidatorEx.MatchesPattern(pattern))
        return this
    }
    
    public IsObject = (): _validator =>
    {
        this.addInstruction(EasyValidatorEx.IsOfType('object'))
        return this
    }

    public IsArray = (length = -1): _validator =>
    {
        this.addInstruction(EasyValidatorEx.IsArray(length))
        return this
    }

    public HasProperties = (properties: PropertyDef[]): _validator =>
    {
        this.addInstruction(EasyValidatorEx.HasProperties(properties))
        return this
    }

    public get Not(): _validator
    {
        this.not = !this.not
        return this       
    }

    public IsSet(): _validator
    {
        this.addInstruction(EasyValidatorEx.IsSet())
        return this
    }

    public Validate = (value: unknown): void => 
    {
        Validate(value, this, false)
    }

    public InnerValidate = (value: unknown): boolean => 
    {
        try 
        {
            Validate(value, this, false)
            return true
        }
        catch(err)
        {
            return false
        }
    }
}

export const EasyValidator = (name: string): _validator =>
{
    return new _validator(name)
}
