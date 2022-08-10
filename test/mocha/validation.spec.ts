import { expect } from 'chai'
import 'mocha'

import {EasyValidator as SV,   EasyValidatorEx as SVex, Validate, CheckFunction} from '../../src/index'
import { EasyValidator, _validator } from '../../src/lib/validation/validation'

const testValidation = (val, validation: CheckFunction | _validator, error: string | null = null) =>
{
    const fct = () => {
        if (validation instanceof _validator)
        {
            (validation as _validator).Validate(val)
        }
        else 
        {
            Validate(val, validation)
        }
    }
    if (!error)
    {
        expect(fct).not.to.throw()
    }
    else 
    {
        const name = (validation instanceof _validator)? validation.GetName(): JSON.stringify(val)
        expect(fct).to.throw(`Validation error: ${name}  ${error}`)
    }
}

describe('Parameters easy validation test', () => {

    it('Test "is set" validation ', () =>
    {
        testValidation(2, SV('var').IsSet())
        testValidation('A', SV('var').IsSet())
        testValidation({test: 'A'}, SV('var').IsSet())
        testValidation(undefined, SV('var').IsSet(), 'is set')
        testValidation(null, SV('var').IsSet(), 'is set')
    })
    it('Test equality validation', () => 
    {
        testValidation('2', SV('var').Equal('2'))
        testValidation('2', SV('var').Equal('3'), 'equal to "3" ')
        testValidation(2, SV('var').Equal('2'), 'equal to "2"' )
        testValidation('2', SV('var').Equal('3'), 'equal to "3"')
        testValidation(['2','3'], SV('var').Equal('2'), 'equal to "2"')
    })

    it('Test inequality validation', () => 
    {
        testValidation( '2', SV('var').GreaterThan(1))
        testValidation( 2, SV('var').GreaterThan(2), 'greater than 2 ')
        testValidation( '2', SV('var').GreaterOrEqual(1))
        testValidation( '2', SV('var').GreaterOrEqual(2))
        testValidation( 2, SV('var').GreaterOrEqual(3), 'greater than or equal to 3 ')

        testValidation( '2', SV('var').LessThan(3))
        
        testValidation( 2, SV('var').LessThan(2), 'less than 2 ')
        testValidation( '2', SV('var').LessOrEqual(3))
        testValidation( '2', SV('var').LessOrEqual(2))
        testValidation( 2, SV('var').LessOrEqual(1), 'less than or equal to 1 ')

        testValidation( '2', SV('var').Between(-1, 5))
        testValidation( -2, SV('var').Between(-1, 5), 'between -1 and 5 ')
        testValidation( 10, SV('var').Between(-1, 5), 'between -1 and 5 ')
        
    })

    it('Test string type  validation', () => 
    {
        testValidation( '12345678', SV('var').IsString(5))
        testValidation( '2', SV('var').IsString(2), 'a string of minimal length: 2 ')
        testValidation( '5',  SV('var').IsString(0, 2))
        testValidation( '12345678',  SV('var').IsString(0, 7), 'a string of maximum length: 7 ')
        testValidation( '123',  SV('var').IsString(2, 6))
        testValidation( '1',  SV('var').IsString(2, 7), 'a string with a length between: 2 and 7')
        testValidation( '12345678',  SV('var').IsString(2, 7), 'a string with a length between: 2 and 7')
    })
    


    it('Test pattern validation', () => 
    {
        const pattern = '^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$'
        testValidation( 'test@email.com', SV('var').MatchesPattern(pattern))
        testValidation( 'test@email.com@', SV('var').MatchesPattern(pattern), `with format ${pattern} `)
    })

    it('Test array type validation', () => 
    {
        testValidation( ['2'], SV('var').IsArray(1))
        testValidation( ['2', '3'], SV('var').IsArray(1))
        testValidation( ['2', '1'], SV('var').IsArray(3), 'an array of minimal lengh: 3 ')
        testValidation( '12', SV('var').IsArray(2), 'an array of minimal lengh: 2 ')
    })

    it('Test object type validation', () => 
    {
        testValidation( {toto:'2'}, SV('var').IsObject())
        testValidation( ['2', '1'], SV('var').IsObject())
        testValidation( '12', SV('var').IsObject(), 'of type object ')

        testValidation( {titi: '1', toto: 2, tata: 3}, SV('var').HasProperties(['titi', 'tata']))
        testValidation( {titi: '1', toto: 2}, SV('var').HasProperties(['titi', 'tata']), 'have properties: ["titi","tata"]')
        testValidation( {email: 'test@test.com', toto: 2, tata: 3}, SV('var').HasProperties([{name:'email', validator: SV('email').MatchesPattern('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$') }, 'tata']))
        testValidation( {email: 'test@test', toto: 2, tata: 3}, SV('var').HasProperties([{name:'email', validator: SV('email').MatchesPattern('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$') }, 'tata']), 'have properties: ["email": with format ^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$,"tata"]')
        
    })

    it('Test AND type validation', () => 
    {
        const validationFct = SV('var').IsObject().HasProperties(['toto'])
      
        const error = 'AND : \n- of type object \n- have properties: ["toto"]'
        testValidation( {toto:'2'}, validationFct)
        testValidation( ['2', '1'], validationFct, error)
        testValidation( '12',  validationFct, error)
        testValidation( {titi:'2'}, validationFct, error)
    })

    it('Test NOT type validation', () => 
    {
        const validationFct = SV('var').IsNumber().Not.GreaterOrEqual(5)

        const error =  'AND : \n- of type number \n- NOT : \n greater than or equal to 5'

        testValidation( ['2', '1', 3], validationFct, error)
        testValidation( 12,  validationFct, error)
        testValidation( 2, validationFct)
    })

})


describe('Parameters extended validation test', () => {

    it('Test array type validation', () => 
    {
        testValidation( ['2'], SV('var').IsArray(1))
        testValidation( ['2', '3'], SV('var').IsArray(1))
        testValidation( ['2', '1'], SV('var').IsArray(3), 'an array of minimal lengh: 3 ')
        testValidation( '12', SV('var').IsArray(2), 'an array of minimal lengh: 2 ')
    })

    it('Test object type validation', () => 
    {
        testValidation( {toto:'2'}, SV('var').IsObject())
        testValidation( ['2', '1'], SV('var').IsObject())
        testValidation( '12', SV('var').IsObject(), 'of type object ')

        testValidation( {titi: '1', toto: 2, tata: 3}, SV('var').HasProperties(['titi', 'tata']))
        testValidation( {titi: '1', toto: 2}, SV('var').HasProperties(['titi', 'tata']), 'have properties: ["titi","tata"]')
    })

    it('Test AND type validation', () => 
    {
        const validationFct = SVex.And([
            SVex.IsObject(),
            SVex.HasProperties(['toto'])
        ])

        const error = 'AND : \n- of type object \n- have properties: ["toto"]'
        testValidation( {toto:'2'}, validationFct)
        testValidation( ['2', '1'], validationFct, error)
        testValidation( '12',  validationFct, error)
        testValidation( {titi:'2'}, validationFct, error)
    })

    it('Test OR type validation', () => 
    {
        const validationFct = SVex.Or([
            SVex.IsArray(2),
            SVex.And([
                SVex.IsNumber(),
                SVex.GreaterOrEqual(5)
            ])
        ])

        const error = 'OR : \n- an array of minimal lengh: 2 \n- AND : \n- of type number \n- greater than or equal to 5   '

        testValidation( ['2', '1', 3], validationFct)
        testValidation( 12,  validationFct)
        testValidation( {toto:'2'}, validationFct, error)
        testValidation( 'a', validationFct, error)
    })

    it('Test NOT type validation', () => 
    {
        const validationFct = SVex.Not( 
            SVex.Or([
                SVex.IsArray(2),
                SVex.And([
                    SVex.IsNumber(),
                    SVex.GreaterOrEqual(5)
                ])
            ])
        )

        const error = 'NOT : \n OR : \n- an array of minimal lengh: 2 \n- AND : \n- of type number \n- greater than or equal to 5   '

        testValidation( ['2', '1', 3], validationFct, error)
        testValidation( 12,  validationFct, error)
        testValidation( {toto:'2'}, validationFct)
        testValidation( 'a', validationFct)
    })

})