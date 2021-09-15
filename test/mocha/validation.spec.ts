import { expect } from 'chai'
import 'mocha'

import {SimpleValidation as SV, Validate, CheckFunction} from '../../src/index'
import { SimpleError } from '../../src/lib/error/error'

const testValidation = (val, validation: CheckFunction, error: string = null) =>
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

describe('Parameters validation test', () => {

    it('Test equality validation', () => 
    {
        testValidation('2', SV.Equal('2'))
        testValidation('2', SV.Equal('3'), 'should be equal to "3" ')
        testValidation(2, SV.Equal('2'), 'should be equal to "2"' )
        testValidation('2', SV.Equal('3'), 'should be equal to "3"')
        testValidation(['2','3'], SV.Equal('2'), 'should be equal to "2"')
    })

    it('Test inequality validation', () => 
    {
        testValidation( '2', SV.GreaterThan(1))
        testValidation( 2, SV.GreaterThan(2), 'should be greater than 2 ')
        testValidation( '2', SV.GreaterOrEqual(1))
        testValidation( '2', SV.GreaterOrEqual(2))
        testValidation( 2, SV.GreaterOrEqual(3), 'should be greater than or equal to 3 ')

        testValidation( '2', SV.LessThan(3))
        
        testValidation( 2, SV.LessThan(2), 'should be less than 2 ')
        testValidation( '2', SV.LessOrEqual(3))
        testValidation( '2', SV.LessOrEqual(2))
        testValidation( 2, SV.LessOrEqual(1), 'should be less than or equal to 1 ')

        testValidation( '2', SV.Between(-1, 5))
        testValidation( -2, SV.Between(-1, 5), 'should be between -1 and 5 ')
        testValidation( 10, SV.Between(-1, 5), 'should be between -1 and 5 ')
        
    })

    it('Test string type  validation', () => 
    {
        testValidation( '2', SV.IsString(1))
        testValidation( '2', SV.IsString(2), 'should be a string of length: 2 ')
        testValidation( ['2','3'], SV.IsString(2), 'should be a string of length: 2 ')
    })

    it('Test array type validation', () => 
    {
        testValidation( ['2'], SV.IsArray(1))
        testValidation( ['2', '3'], SV.IsArray(1))
        testValidation( ['2', '1'], SV.IsArray(3), 'should be an array of minimal lengh: 3 ')
        testValidation( '12', SV.IsArray(2), 'should be an array of minimal lengh: 2 ')
    })

    it('Test object type validation', () => 
    {
        testValidation( {toto:'2'}, SV.IsObject())
        testValidation( ['2', '1'], SV.IsObject())
        testValidation( '12', SV.IsObject(), 'should be of type object ')

        testValidation( {titi: '1', toto: 2, tata: 3}, SV.HasProperties(['titi', 'tata']))
        testValidation( {titi: '1', toto: 2}, SV.HasProperties(['titi', 'tata']), 'should have properties: ["titi","tata"]')
    })

    it('Test AND type validation', () => 
    {
        const validationFct = SV.And([
            SV.IsObject(),
            SV.HasProperties(['toto'])
        ])

        const error = 'AND : \n- should be of type object \n- should have properties: ["toto"]'
        testValidation( {toto:'2'}, validationFct)
        testValidation( ['2', '1'], validationFct, error)
        testValidation( '12',  validationFct, error)
        testValidation( {titi:'2'}, validationFct, error)
    })

    it('Test OR type validation', () => 
    {
        const validationFct = SV.Or([
            SV.IsArray(2),
            SV.And([
                SV.IsNumber(),
                SV.GreaterOrEqual(5)
            ])
        ])

        const error = 'OR : \n- should be an array of minimal lengh: 2 \n- AND : \n- should be of type number \n- should be greater than or equal to 5   '

        testValidation( ['2', '1', 3], validationFct)
        testValidation( 12,  validationFct)
        testValidation( {toto:'2'}, validationFct, error)
        testValidation( 'a', validationFct, error)
    })

})