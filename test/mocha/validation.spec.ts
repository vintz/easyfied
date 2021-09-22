import { expect } from 'chai'
import 'mocha'

import {EasyValidator as SV, EasyValidatorEx as SVex, Validate, CheckFunction} from '../../src/index'
import { _validator } from '../../src/lib/validation/validation'

const testValidation = (val, validation: CheckFunction | _validator, error: string = null) =>
{
    const fct = () => {
        Validate(val, validation)
    }
    if (!error)
    {
        expect(fct).not.to.throw()
    }
    else 
    {
        expect(fct).to.throw(`Validation error: ${JSON.stringify(val)}  ${error}`)
    }
}

describe('Parameters easy validation test', () => {

    it('Test equality validation', () => 
    {
        testValidation('2', SV().Equal('2'))
        testValidation('2', SV().Equal('3'), 'equal to "3" ')
        testValidation(2, SV().Equal('2'), 'equal to "2"' )
        testValidation('2', SV().Equal('3'), 'equal to "3"')
        testValidation(['2','3'], SV().Equal('2'), 'equal to "2"')
    })

    it('Test inequality validation', () => 
    {
        testValidation( '2', SV().GreaterThan(1))
        testValidation( 2, SV().GreaterThan(2), 'greater than 2 ')
        testValidation( '2', SV().GreaterOrEqual(1))
        testValidation( '2', SV().GreaterOrEqual(2))
        testValidation( 2, SV().GreaterOrEqual(3), 'greater than or equal to 3 ')

        testValidation( '2', SV().LessThan(3))
        
        testValidation( 2, SV().LessThan(2), 'less than 2 ')
        testValidation( '2', SV().LessOrEqual(3))
        testValidation( '2', SV().LessOrEqual(2))
        testValidation( 2, SV().LessOrEqual(1), 'less than or equal to 1 ')

        testValidation( '2', SV().Between(-1, 5))
        testValidation( -2, SV().Between(-1, 5), 'between -1 and 5 ')
        testValidation( 10, SV().Between(-1, 5), 'between -1 and 5 ')
        
    })

    it('Test string type  validation', () => 
    {
        testValidation( '2', SV().IsString(1))
        testValidation( '2', SV().IsString(2), 'a string of length: 2 ')
        testValidation( ['2','3'], SV().IsString(2), 'a string of length: 2 ')
    })

    it('Test array type validation', () => 
    {
        testValidation( ['2'], SV().IsArray(1))
        testValidation( ['2', '3'], SV().IsArray(1))
        testValidation( ['2', '1'], SV().IsArray(3), 'an array of minimal lengh: 3 ')
        testValidation( '12', SV().IsArray(2), 'an array of minimal lengh: 2 ')
    })

    it('Test object type validation', () => 
    {
        testValidation( {toto:'2'}, SV().IsObject())
        testValidation( ['2', '1'], SV().IsObject())
        testValidation( '12', SV().IsObject(), 'of type object ')

        testValidation( {titi: '1', toto: 2, tata: 3}, SV().HasProperties(['titi', 'tata']))
        testValidation( {titi: '1', toto: 2}, SV().HasProperties(['titi', 'tata']), 'have properties: ["titi","tata"]')
    })

    it('Test AND type validation', () => 
    {
        const validationFct = SV().IsObject().HasProperties(['toto'])
      
        const error = 'AND : \n- of type object \n- have properties: ["toto"]'
        testValidation( {toto:'2'}, validationFct)
        testValidation( ['2', '1'], validationFct, error)
        testValidation( '12',  validationFct, error)
        testValidation( {titi:'2'}, validationFct, error)
    })

    it('Test NOT type validation', () => 
    {
        const validationFct = SV().IsNumber().Not.GreaterOrEqual(5)

        const error =  'AND : \n- of type number \n- NOT : \n greater than or equal to 5'

        testValidation( ['2', '1', 3], validationFct, error)
        testValidation( 12,  validationFct, error)
        testValidation( 2, validationFct)
    })

})


describe('Parameters extended validation test', () => {

    it('Test equality validation', () => 
    {
        testValidation('2', SVex.Equal('2'))
        testValidation('2', SVex.Equal('3'), 'equal to "3" ')
        testValidation(2, SVex.Equal('2'), 'equal to "2"' )
        testValidation('2', SVex.Equal('3'), 'equal to "3"')
        testValidation(['2','3'], SVex.Equal('2'), 'equal to "2"')
    })

    it('Test inequality validation', () => 
    {
        testValidation( '2', SVex.GreaterThan(1))
        testValidation( 2, SVex.GreaterThan(2), 'greater than 2 ')
        testValidation( '2', SVex.GreaterOrEqual(1))
        testValidation( '2', SVex.GreaterOrEqual(2))
        testValidation( 2, SVex.GreaterOrEqual(3), 'greater than or equal to 3 ')

        testValidation( '2', SVex.LessThan(3))
        
        testValidation( 2, SVex.LessThan(2), 'less than 2 ')
        testValidation( '2', SVex.LessOrEqual(3))
        testValidation( '2', SVex.LessOrEqual(2))
        testValidation( 2, SVex.LessOrEqual(1), 'less than or equal to 1 ')

        testValidation( '2', SVex.Between(-1, 5))
        testValidation( -2, SVex.Between(-1, 5), 'between -1 and 5 ')
        testValidation( 10, SVex.Between(-1, 5), 'between -1 and 5 ')
        
    })

    it('Test string type  validation', () => 
    {
        testValidation( '2', SVex.IsString(1))
        testValidation( '2', SVex.IsString(2), 'a string of length: 2 ')
        testValidation( ['2','3'], SVex.IsString(2), 'a string of length: 2 ')
    })

    it('Test array type validation', () => 
    {
        testValidation( ['2'], SVex.IsArray(1))
        testValidation( ['2', '3'], SVex.IsArray(1))
        testValidation( ['2', '1'], SVex.IsArray(3), 'an array of minimal lengh: 3 ')
        testValidation( '12', SVex.IsArray(2), 'an array of minimal lengh: 2 ')
    })

    it('Test object type validation', () => 
    {
        testValidation( {toto:'2'}, SVex.IsObject())
        testValidation( ['2', '1'], SVex.IsObject())
        testValidation( '12', SVex.IsObject(), 'of type object ')

        testValidation( {titi: '1', toto: 2, tata: 3}, SVex.HasProperties(['titi', 'tata']))
        testValidation( {titi: '1', toto: 2}, SVex.HasProperties(['titi', 'tata']), 'have properties: ["titi","tata"]')
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