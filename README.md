# Portfolio API

API para gestionar portfolios de desarrolladores, incluyendo proyectos, categorías y lenguajes de programación.

## Índice

- [Diagrama de Rutas](#diagrama-de-rutas)
- [Modelo de Base de Datos](#modelo-de-base-de-datos)
- [Endpoints](#endpoints)
  - [Base URL](#base-url)
  - [Rutas Principales](#rutas-principales)
  - [Subrutas](#subrutas)
  - [`/languages`](#languages)
  - [`/categories`](#categories)
  - [`/projects/:user`](#projectsuser)

## Diagrama de Rutas

```mermaid
flowchart LR
    sym0{{USE}} & sym1([GET]) & sym2[/POST/] & sym3[\PATCH\] & sym4(DELETE) & sym5[property] & sym6[[array]] ~~~ root
    root{{/api/portfolio}} --> use0{{/languages}} & get0([/user/_:token_]) & use1{{/categories}} & get1([/translates]) & use2{{/projects/_:user_}}
    use0 --> get00([?proy&user]) & get01([/_:id_]) & post0[/ / /] & patch0[\/_:id_\] & delete0(/_:id_)
    use1 --> get10([?proy&user]) & get11([/_:id_]) & post1[/ / /] & patch1[\/_:id_\] & delete1(/_:id_)
    use2 --> get20([?lan&cat]) & get21([/_:id_]) & post2[/ / /] & patch2[\/_:id_\] & delete2(/_:id_)
    post0 ==> json0[body: json] ==> json00[token: string] & json01[name: string] & json02[image: string]
    patch0 ==> json_0[body: json] ==> json_00[token: string] & json_01[name: string?] & json_02[image: string?]
    delete0 ==> json__0[body: json] ==> json__00[token: string]
    post1 ==> json1[body: json] ==> json10[token: string] & json11[id: string] & json12[icon: string] & json13[[name: json]]
    json13 ==> json130[translation: string] & json131[name: string]
    patch1 ==> json_1[body: json] ==> json_10[token: string] & json_12[icon: string?] & json_13[[name: json?]]
    json_13 ==> json_130[translation: string] & json_131[name: string]
    delete1 ==> json__1[body: json] ==> json__10[token: string]
    post2 ==> json2[body: json] ==> json20[token: string] & json21[[name: json]] & json22[repository: string] & json23[website: string?] & json24[icon: string?] & json25[[languages: string]] & json26[[categories: string]]
    json21 ==> json210[translation: string] & json211[name: string]
    patch2 ==> json_2[body: json] ==> json_20[token: string] & json_21[[name: json?]] & json_22[repository: string?] & json_23[website: string?] & json_24[icon: string?] & json_25[[languages: string?]] & json_26[[categories: string?]]
    json_21 ==> json_210[translation: string] & json_211[name: string]
    delete2 ==> json__2[body: json] ==> json__20[token: string]
```

## Modelo de Base de Datos

```mermaid
erDiagram
    Symbols {
        🔑 PRIMARY_KEY
        🎲 DEFAULT(RANDOM_VALUE)
        ⏫ AUTOINCREMENT
        🔗 FOREIGN_KEY
        ❓  NULLABLE
    }
    category ||--|{ cat_name :cat_id
    category ||--|{ cat_proy :cat_id
    cat_name }|--|| translation :tran_id
    token }|--|| user :user_id
    cat_proy }|--|| project :proy_id
    translation ||--|{ proy_name :tran_id
    user ||--|{ project :user_id
    project ||--|{ proy_name :proy_id
    project ||--|{ lan_proy :proy_id
    lan_proy }|--|| language :lan_id
    token {
        BLOB🔑🎲 token
        BLOB🔗 user_id
    }
    user {
        BLOB🔑🎲 id
        VARCHAR(50) name
    }
    category {
        VARCHAR(4)🔑 id
        TEXT icon
    }
    cat_proy {
        VARCHAR(4)🔗 cat_id
        INTEGER🔗 proy_id
    }
    project {
        INTEGER🔑⏫ id
        TEXT repository
        TEXT❓ website
        TEXT❓ icon
        BLOB🔗 user_id
    }
    lan_proy {
        INTEGER🔗 lan_id
        INTEGER🔗 proy_id
    }
    cat_name {
        INTEGER🔑⏫ id
        VARCHAR(255) name
        INTEGER🔗 tran_id
        INTEGER🔗 cat_id
    }
    translation {
        INTEGER🔑⏫ id
        VARCHAR(10) name
    }
    proy_name {
        INTEGER🔑⏫ id
        VARCHAR(255) name
        INTEGER🔗 tran_id
        INTEGER🔗 proy_id
    }
    language {
        INTEGER🔑⏫ id
        VARCHAR(20) name
        TEXT image
    }
```

## Endpoints

### Base URL

`/api/portfolio`

### Rutas Principales

1. **User**
   - `GET /user/:token` - Obtener información del usuario
2. **Translates**
   - `GET /translates` - Obtener todas las traducciones disponibles

### Subrutas

#### `/languages`

- `GET ?proy&user` - Listar lenguajes (filtrable por proyecto o usuario)
- `GET /:id` - Obtener un lenguaje específico
- `POST /` - Crear nuevo lenguaje

```json
{
  "token": "string",
  "name": "string",
  "image": "string"
}
```

- `PATCH /:id` - Actualizar lenguaje

```json
{
  "token": "string",
  "name": "string?",
  "image": "string?"
}
```

- `DELETE /:id` - Eliminar lenguaje

```json
{
  "token": "string"
}
```

#### `/categories`

- `GET ?proy&user` - Listar categorías (filtrable por proyecto o usuario)
- `GET /:id` - Obtener una categoría específica
- `POST /` - Crear nueva categoría

```json
{
  "token": "string",
  "id": "string",
  "icon": "string",
  "name": [
    {
      "translation": "string",
      "name": "string"
    }
  ]
}
```

- `PATCH /:id` - Actualizar categoría

```json
{
  "token": "string",
  "icon": "string?",
  "name": [
    {
      "translation": "string",
      "name": "string"
    }
  ]?
}
```

- `DELETE /:id` - Eliminar categoría

```json
{
  "token": "string"
}
```

#### `/projects/:user`

- `GET ?lan&cat` - Listar proyectos (filtrable por lenguaje o categoría)
- `GET /:id`- Obtener un proyecto específico
- `POST /` - Crear nuevo proyecto

```json
{
  "token": "string",
  "name": [
    {
      "translation": "string",
      "name": "string"
    }
  ],
  "repository": "string",
  "website": "string?",
  "icon": "string?",
  "languages": ["string"],
  "categories": ["string"]
}
```

- `PATCH /:id` - Actualizar proyecto

```json
{
  "token": "string",
  "name": [
    {
      "translation": "string",
      "name": "string"
    }
  ]?,
  "repository": "string?",
  "website": "string?",
  "icon": "string?",
  "languages": ["string"]?,
  "categories": ["string"]?
}
```

- `DELETE /:id` - Eliminar proyecto

```json
{
  "token": "string"
}
```
