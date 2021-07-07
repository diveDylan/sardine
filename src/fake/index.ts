const Chance = require('chance')
import { Definition, Items } from '../swagger'
import { typeMapChanceConfig, DEFAULT_ARRAY_COUNT } from './config'

const chanceInstance = new Chance()
export { chanceInstance }

export function fakeByDeinition(
  definition: Definition | Items,
  definitions: Record<string, Definition>
): Record<string, any> {
  return typeActions[definition.type](definition, definitions)
}
/**
 * @description #/definitions/Category -> Category
 * @param ref
 * @returns definition name
 */
export function getRefDefinitionName(ref: string): string {
  return ref.replace('#/definitions/', '')
}

export function fakeObjectDefinition(
  definition: Definition,
  definitions: Record<string, Definition>
): Record<string, any> {
  const mock: Record<string, any> = {}
  const properties = definition.properties
  Object.entries(properties).forEach(([key, value]) => {
    if (Array.isArray(value.enum)) {
      mock[key] = fakeEnums(value.enum) as string
      return
    }
    if (value.$ref) {
      mock[key] = fakeRef(value.$ref, definitions)
      return
    }
    // @ts-ignore
    mock[key] = typeActions[value.type](value)
    return
  })
  return mock
}

interface StringLength {
  length: number
}
export function fakeRef(
  ref: string,
  definitions: Record<string, Definition>
): Record<string, any> | unknown[] {
  const definitionName = getRefDefinitionName(ref)
  return fakeByDeinition(definitions[definitionName], definitions)
}

export function fakeStringLength(minLength?: number, maxLength?: number): StringLength | {} {
  return maxLength
    ? chanceInstance.integer({
        min: minLength || 1,
        max: maxLength
      })
    : {}
}
interface NumberAmongValue {
  min: number
  max: number
}

export function fakeNumberAmongValue(min?: number, max?: number): NumberAmongValue | {} {
  return max ? { min: min || 0, max } : {}
}

export function fakeEnums(enums: Array<string | number | boolean>): string | number | boolean {
  return chanceInstance.pickone(enums)
}

export function fakeArrayCount(min?: number, max?: number): number {
  return max && max > 1 ? chanceInstance.integer({ min: min || 1, max }) : DEFAULT_ARRAY_COUNT
}

type ItemsType = Exclude<Pick<Items, 'type'>['type'], 'file'>

export function fakeArrays(
  definition: Definition | Items,
  definitions: Record<string, Definition>
): unknown[] {
  const fakeCount: number = fakeArrayCount(definition.minItems, definition.maxItems)
  const fakeSourceArrays: Array<any> = definition.enum || definition.items?.enum || []
  /**
   * @comment has source arrays
   */
  if (fakeSourceArrays.length) {
    return chanceInstance.pickset(fakeSourceArrays, fakeCount)
  }
  /**
   * @comment handler $refs
   */
  if (definition.items?.$ref) {
    const arr = []
    for (let i = 0; i < fakeCount; i++) {
      arr.push(fakeRef(definition.items?.$ref, definitions))
    }
    return arr
  }
  /**
   * https://swagger.io/specification/v2/#swaggerSchemes
   * type property Required. The internal type of the array. The value MUST be one of "string", "number", "integer", "boolean", or "array". Files and models are not allowed.
   */
  if (definition.items?.type) {
    const type: ItemsType = definition.items.type as ItemsType
    if (type === 'array') {
      return fakeArrays(definition.items, definitions)
    }
    return fakeTypesArray(definition.items, typeActions[type], fakeCount)
  }

  return []
}
// @ts-ignore
export const getFormatterFunction = (format: string): Function => {
  return chanceInstance[typeMapChanceConfig[format] || format].bind(chanceInstance)
}

export const typeActions: Record<
  'string' | 'number' | 'boolean' | 'integer' | 'array' | 'object' | 'ref',
  Function
> = {
  string: fakeString,
  number: fakeNumber,
  integer: fakeNumber,
  boolean: fakeBoolean,
  array: fakeArrays,
  object: fakeObjectDefinition,
  ref: fakeRef
}

export function fakeTypesArray(item: Items, typeAction: Function, count: number): unknown[] {
  let stringArray: string[] = []
  for (let i = 0; i < count; i++) {
    stringArray.push(typeAction(item))
  }
  return stringArray
}

export function fakeString(item: Items): string {
  if (Array.isArray(item.enum)) {
    return fakeEnums(item.enum) as string
  }
  const format: string = item.format || item.type
  const formatter = getFormatterFunction(format)
  return formatter(fakeStringLength(item.minLength, item.maxLength))
}

export function fakeNumber(item: Items): number {
  if (Array.isArray(item.enum)) {
    return fakeEnums(item.enum) as number
  }
  const format: string = item.format || item.type
  const formatter: Function = getFormatterFunction(format)
  return formatter(fakeNumberAmongValue(item.minimum, item.maximum))
}

export function fakeBoolean(): boolean {
  return chanceInstance.bool()
}