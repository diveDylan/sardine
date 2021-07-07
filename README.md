## Sardine

`Sardine` is a mock serve tool via swagger data & chance. You can set swagger `format` property with chance method name to fake different types data~


### Swagger Schemes



 📖 : [Swagger Schemes](https://swagger.io/specification/v2/#swaggerSchemes)

 💡 : <b>Idea</b>
> However, the format property is an open string-valued property, and can have any value to support documentation needs. Formats such as "email", "uuid", etc., can be used even though they are not defined by this specification

🚥 : <b>Rules</b>
- `number` types use `minimum` & `maximum`

- `string` types use `maxLength`  & `minLength`

- `array` types use `maxItems` & `minItems`

- `enum` types use for `options`








